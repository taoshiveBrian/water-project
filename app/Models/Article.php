<?php

namespace App\Models;

use App\Enums\ArticleTemplate;
use App\Enums\ArticleType;
use App\Services\AssetService;
use Database\Factories\ArticleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * A post or tutorial, built with one of three templates (see ArticleTemplate).
 *
 * `body` holds the template's JSON (see ArticleBody in resources/js/types/article.ts).
 * Every template has a cover image. Article-template inline images live in five fixed
 * foreign-key slots; Guide chapter images are asset ids stored inside `body`.
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $category_id
 * @property ArticleType|null $type Unused for now; categories group articles instead.
 * @property ArticleTemplate $template
 * @property string $title
 * @property string|null $subtitle
 * @property array<string, mixed> $body
 * @property bool $is_public
 * @property bool $is_note
 * @property string|null $source_label
 * @property string|null $source_url
 * @property int|null $cover_image_id
 * @property int|null $image_1_id
 * @property int|null $image_2_id
 * @property int|null $image_3_id
 * @property int|null $image_4_id
 * @property int|null $image_5_id
 * @property string $image_1_display
 * @property string $image_2_display
 * @property string $image_3_display
 * @property string $image_4_display
 * @property string $image_5_display
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'type',
    'template',
    'title',
    'subtitle',
    'body',
    'is_public',
    'is_note',
    'source_label',
    'source_url',
    'cover_image_id',
    'image_1_id',
    'image_2_id',
    'image_3_id',
    'image_4_id',
    'image_5_id',
    'image_1_display',
    'image_2_display',
    'image_3_display',
    'image_4_display',
    'image_5_display',
])]
class Article extends Model
{
    /** @use HasFactory<ArticleFactory> */
    use HasFactory;

    /**
     * Image slots that can be referenced inline in section text as [tag].
     */
    public const array POOL_FIELDS = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'];

    /**
     * Every image slot, including the cover.
     */
    public const array IMAGE_FIELDS = ['cover_image', ...self::POOL_FIELDS];

    public const array DISPLAY_MODES = ['block', 'float-left', 'float-right'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => ArticleType::class,
            'template' => ArticleTemplate::class,
            'body' => 'array',
            'is_public' => 'boolean',
            'is_note' => 'boolean',
        ];
    }

    /**
     * Deleting an article deletes the images it uploaded, unless another article also
     * uses them or they belong to the media library.
     */
    protected static function booted(): void
    {
        static::deleting(function (Article $article) {
            $assets = app(AssetService::class);

            $owned = Asset::whereKey([
                ...array_filter(array_map(fn (string $field) => $article->{"{$field}_id"}, self::IMAGE_FIELDS)),
                ...$article->chapterAssetIds(),
            ])->get();

            foreach ($owned as $asset) {
                $assets->discard($asset, exceptArticleId: $article->id);
            }
        });
    }

    /**
     * Asset ids referenced from a Guide's chapter pools.
     *
     * @return list<int>
     */
    public function chapterAssetIds(): array
    {
        if ($this->template !== ArticleTemplate::Sectioned) {
            return [];
        }

        $ids = [];

        foreach ($this->body['chapters'] ?? [] as $chapter) {
            foreach ($chapter['pool'] ?? [] as $entry) {
                if (! empty($entry['assetId'])) {
                    $ids[] = (int) $entry['assetId'];
                }
            }
        }

        return $ids;
    }

    /**
     * The relation names for every image slot, e.g. for eager loading.
     *
     * @return list<string>
     */
    public static function imageRelations(): array
    {
        return array_map(fn (string $field): string => Str::camel($field), self::IMAGE_FIELDS);
    }

    public function imageAsset(string $field): ?Asset
    {
        return $this->{Str::camel($field)};
    }

    /**
     * Limit to real posts, excluding draft notes.
     *
     * @param  Builder<Article>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('is_note', false);
    }

    /**
     * Limit to articles the given viewer may see: public ones for guests; for members,
     * members-only articles too, plus their own notes.
     *
     * @param  Builder<Article>  $query
     */
    public function scopeVisibleTo(Builder $query, ?User $viewer): void
    {
        $query->where(function (Builder $query) use ($viewer) {
            if (! $viewer) {
                $query->where('is_public', true);

                return;
            }

            $query->where('is_note', false)->orWhere('user_id', $viewer->id);
        });
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Not yet exposed in the UI.
     *
     * @return BelongsToMany<Tag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * @return BelongsTo<Asset, $this>
     */
    public function coverImage(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'cover_image_id');
    }

    /**
     * @return BelongsTo<Asset, $this>
     */
    public function image1(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'image_1_id');
    }

    /**
     * @return BelongsTo<Asset, $this>
     */
    public function image2(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'image_2_id');
    }

    /**
     * @return BelongsTo<Asset, $this>
     */
    public function image3(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'image_3_id');
    }

    /**
     * @return BelongsTo<Asset, $this>
     */
    public function image4(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'image_4_id');
    }

    /**
     * @return BelongsTo<Asset, $this>
     */
    public function image5(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'image_5_id');
    }
}
