<?php

namespace App\Models;

use App\Enums\ProcessingStatus;
use Database\Factories\AssetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * A stored file plus its metadata. Every upload in the app goes through
 * AssetService so files, rows, processing, and cleanup stay in one place.
 *
 * `path` is the file that's served. For processed images, `original_path` keeps the
 * untouched upload so compression and size variants are always rebuilt from it.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $disk
 * @property string $path
 * @property string|null $original_path
 * @property array<string, string>|null $sizes Variant name => path on the disk.
 * @property string $original_filename
 * @property string|null $mime_type
 * @property int|null $file_size
 * @property int|null $optimized_size Bytes saved by compression.
 * @property string|null $category image, video, audio, or document
 * @property string|null $subcategory A free-form folder name.
 * @property string|null $title
 * @property string|null $alt_text
 * @property string|null $description
 * @property array<string, mixed>|null $metadata
 * @property ProcessingStatus $processing_status
 * @property string|null $processing_error
 * @property bool $is_featured
 * @property bool $is_library_item Uploaded to the library directly, so it's kept even when unused.
 * @property bool $is_private Seen in the media library only by media admins, and never offered for articles (e.g. a user's uploaded avatar).
 * @property-read string $url
 * @property-read string $display_url
 * @property-read string $thumbnail_url
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'disk',
    'path',
    'original_path',
    'sizes',
    'original_filename',
    'mime_type',
    'file_size',
    'optimized_size',
    'category',
    'subcategory',
    'title',
    'alt_text',
    'description',
    'metadata',
    'processing_status',
    'processing_error',
    'is_featured',
    'is_library_item',
    'is_private',
])]
class Asset extends Model
{
    /** @use HasFactory<AssetFactory> */
    use HasFactory;

    public const array FILE_TYPES = ['image', 'video', 'audio', 'document'];

    /**
     * Shared avatars anyone can choose, uploaded through the media library.
     */
    public const string AVATAR_FOLDER = 'Avatars';

    /**
     * Users' own uploaded avatars, which are private.
     */
    public const string USER_AVATAR_FOLDER = 'user_avatars';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sizes' => 'array',
            'metadata' => 'array',
            'file_size' => 'integer',
            'optimized_size' => 'integer',
            'processing_status' => ProcessingStatus::class,
            'is_featured' => 'boolean',
            'is_library_item' => 'boolean',
            'is_private' => 'boolean',
        ];
    }

    /**
     * Remove every file the asset owns (served file, original, size variants) when
     * the row is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (Asset $asset) {
            Storage::disk($asset->disk)->delete($asset->storedPaths());
        });
    }

    /**
     * The file type bucket for a MIME type.
     */
    public static function categoryForMime(?string $mimeType): string
    {
        return match (true) {
            str_starts_with($mimeType ?? '', 'image/') => 'image',
            str_starts_with($mimeType ?? '', 'video/') => 'video',
            str_starts_with($mimeType ?? '', 'audio/') => 'audio',
            default => 'document',
        };
    }

    /**
     * Every path on the disk that belongs to this asset.
     *
     * @return list<string>
     */
    public function storedPaths(): array
    {
        return array_values(array_unique(array_filter([
            $this->path,
            $this->original_path,
            ...array_values($this->sizes ?? []),
        ])));
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Match title, filenames, or description.
     *
     * @param  Builder<Asset>  $query
     */
    public function scopeSearch(Builder $query, string $term): void
    {
        $like = '%'.addcslashes($term, '%_\\').'%';

        $query->where(function (Builder $query) use ($like) {
            $query->whereLike('title', $like)
                ->orWhereLike('original_filename', $like)
                ->orWhereLike('description', $like);
        });
    }

    /**
     * @param  Builder<Asset>  $query
     */
    public function scopeImages(Builder $query): void
    {
        $query->where('category', 'image');
    }

    /**
     * Shared avatars anyone can choose.
     *
     * @param  Builder<Asset>  $query
     */
    public function scopeAvatarChoices(Builder $query): void
    {
        $query->images()->where('subcategory', self::AVATAR_FOLDER)->where('is_private', false);
    }

    /**
     * Limit to assets the viewer may see in the media library: private assets are
     * for media admins only, even to their uploader.
     *
     * @param  Builder<Asset>  $query
     */
    public function scopeVisibleTo(Builder $query, User $viewer): void
    {
        if (! $viewer->can('view-private-media')) {
            $query->where('is_private', false);
        }
    }

    public function isVisibleTo(User $viewer): bool
    {
        return ! $this->is_private || $viewer->can('view-private-media');
    }

    /**
     * The URL of the served file, generated from the disk so it follows APP_URL changes.
     *
     * @return Attribute<string, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(fn (): string => $this->urlFor($this->path));
    }

    /**
     * The best variant for showing in a page: large, then the served file.
     *
     * @return Attribute<string, never>
     */
    protected function displayUrl(): Attribute
    {
        return Attribute::get(fn (): string => $this->variantUrl('large'));
    }

    /**
     * The smallest variant for grids and pickers.
     *
     * @return Attribute<string, never>
     */
    protected function thumbnailUrl(): Attribute
    {
        return Attribute::get(fn (): string => $this->variantUrl('thumbnail', 'medium'));
    }

    /**
     * The URL of the first size variant that exists, else the served file. Pixel art
     * always gets its untouched original, since resizing or re-encoding smears pixels.
     */
    public function variantUrl(string ...$sizes): string
    {
        if ($this->isPixelArt()) {
            return $this->urlFor($this->original_path ?? $this->path);
        }

        foreach ($sizes as $size) {
            if (isset($this->sizes[$size])) {
                return $this->urlFor($this->sizes[$size]);
            }
        }

        return $this->urlFor($this->path);
    }

    /**
     * @return array<string, string>
     */
    public function sizeUrls(): array
    {
        return array_map(fn (string $path): string => $this->urlFor($path), $this->sizes ?? []);
    }

    public function isImage(): bool
    {
        return str_starts_with($this->mime_type ?? '', 'image/');
    }

    /**
     * Images at or under the media settings' pixel art size: shown from the original
     * file and, when enlarged, scaled with hard pixel edges instead of smoothing.
     */
    public function isPixelArt(): bool
    {
        $maxBytes = self::pixelArtMaxBytes();

        return $maxBytes > 0 && $this->isImage() && $this->file_size !== null && $this->file_size <= $maxBytes;
    }

    /**
     * Read once per request, since every image URL asks.
     */
    private static function pixelArtMaxBytes(): int
    {
        return once(fn (): int => MediaSettings::current()->pixel_art_max_size * 1024);
    }

    /**
     * Images the processor can re-encode. GIFs are left alone to keep animation.
     */
    public function isProcessableImage(): bool
    {
        return in_array($this->mime_type, ['image/jpeg', 'image/png', 'image/webp'], true);
    }

    private function urlFor(string $path): string
    {
        return Storage::disk($this->disk)->url($path);
    }
}
