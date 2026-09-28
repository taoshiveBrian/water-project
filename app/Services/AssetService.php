<?php

namespace App\Services;

use App\Enums\ProcessingStatus;
use App\Models\Asset;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use RuntimeException;

/**
 * The single entry point for putting uploaded files on disk and taking them off.
 *
 * Files land under assets/{category}/{subcategory}/ with hashed names, get an Asset
 * row, and images are handed to the processor for compression and size variants.
 */
class AssetService
{
    public const string DISK = 'public';

    public function __construct(
        private ImageProcessingService $processor,
        private AssetUsage $usage,
    ) {}

    /**
     * Store an upload and schedule its processing.
     *
     * @param  bool  $isLibraryItem  true for media library uploads, which are kept even when unused
     */
    public function store(
        UploadedFile $file,
        ?string $subcategory = null,
        ?User $owner = null,
        bool $isLibraryItem = false,
    ): Asset {
        $mimeType = $file->getMimeType();
        $category = Asset::categoryForMime($mimeType);
        $directory = collect(['assets', $category, $subcategory])->filter()->implode('/');

        $path = $file->store($directory, self::DISK);

        if ($path === false) {
            throw new RuntimeException("Unable to store upload [{$file->getClientOriginalName()}].");
        }

        $asset = Asset::create([
            'user_id' => $owner?->id,
            'disk' => self::DISK,
            'path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $mimeType,
            'file_size' => $file->getSize(),
            'category' => $category,
            'subcategory' => $subcategory,
            'processing_status' => ProcessingStatus::Pending,
            'is_library_item' => $isLibraryItem,
        ]);

        $this->processor->schedule($asset);

        return $asset->refresh();
    }

    /**
     * Delete an asset an article no longer points at, unless it's a library item or
     * another article still uses it.
     */
    public function discard(Asset $asset, ?int $exceptArticleId = null): void
    {
        if ($asset->is_library_item || $this->usage->isUsed($asset->id, $exceptArticleId)) {
            return;
        }

        $asset->delete();
    }
}
