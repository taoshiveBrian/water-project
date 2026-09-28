<?php

namespace App\Services;

use App\Enums\ProcessingMethod;
use App\Enums\ProcessingStatus;
use App\Jobs\ProcessImageJob;
use App\Models\Asset;
use App\Models\MediaSettings;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Interfaces\EncodedImageInterface;
use Intervention\Image\Interfaces\ImageInterface;
use Throwable;

/**
 * Compresses images and builds their size variants (GD driver).
 *
 * The upload is copied to `original_path` the first time, and every run rebuilds
 * the served file and variants from that copy, so reprocessing never compounds
 * quality loss. Images keep their own format, variants only ever shrink, and GIFs
 * are skipped so animation survives.
 */
class ImageProcessingService
{
    private ImageManager $manager;

    public function __construct()
    {
        $this->manager = ImageManager::gd();
    }

    /**
     * Process now or queue it, depending on the media settings.
     */
    public function schedule(Asset $asset): void
    {
        $settings = MediaSettings::current();

        if (! $settings->processing_enabled || ! $asset->isProcessableImage()) {
            $asset->update(['processing_status' => ProcessingStatus::Completed]);

            return;
        }

        if ($settings->processing_method === ProcessingMethod::Queue) {
            $asset->update(['processing_status' => ProcessingStatus::Pending, 'processing_error' => null]);
            ProcessImageJob::dispatch($asset);

            return;
        }

        $this->process($asset);
    }

    public function process(Asset $asset): void
    {
        $settings = MediaSettings::current();

        if (! $settings->processing_enabled || ! $asset->isProcessableImage()) {
            $asset->update(['processing_status' => ProcessingStatus::Completed]);

            return;
        }

        $asset->update(['processing_status' => ProcessingStatus::Processing, 'processing_error' => null]);

        try {
            $this->rebuild($asset, $settings);
        } catch (Throwable $exception) {
            $this->markFailed($asset, $exception);
            report($exception);
        }
    }

    public function markFailed(Asset $asset, Throwable $exception): void
    {
        $asset->update([
            'processing_status' => ProcessingStatus::Failed,
            'processing_error' => $exception->getMessage(),
        ]);
    }

    private function rebuild(Asset $asset, MediaSettings $settings): void
    {
        $disk = Storage::disk($asset->disk);

        if (! $asset->original_path) {
            $originalPath = $this->siblingPath($asset->path, 'originals');
            $disk->copy($asset->path, $originalPath);
            $asset->update(['original_path' => $originalPath]);
        }

        $originalBytes = $disk->get($asset->original_path);
        $quality = $settings->compression_quality;

        $served = $originalBytes;

        if ($settings->compress_images) {
            $compressed = (string) $this->encode($this->manager->read($originalBytes), $asset->mime_type, $quality);

            if (strlen($compressed) < strlen($originalBytes)) {
                $served = $compressed;
            }
        }

        $disk->put($asset->path, $served);
        $disk->delete(array_values($asset->sizes ?? []));

        $sizes = [];

        foreach ($settings->enabledSizes() as $size) {
            $image = $this->manager->read($originalBytes);

            if ($size['crop'] && $size['width'] && $size['height']) {
                $image->coverDown($size['width'], $size['height']);
            } else {
                $image->scaleDown($size['width'], $size['height']);
            }

            $variantPath = $this->siblingPath($asset->path, 'sizes', "{$size['name']}_");
            $disk->put($variantPath, (string) $this->encode($image, $asset->mime_type, $quality));
            $sizes[$size['name']] = $variantPath;
        }

        $asset->update([
            'sizes' => $sizes ?: null,
            'file_size' => strlen($served),
            'optimized_size' => strlen($originalBytes) - strlen($served),
            'processing_status' => ProcessingStatus::Completed,
            'processing_error' => null,
        ]);
    }

    /**
     * Re-encode in the image's own format.
     */
    private function encode(ImageInterface $image, ?string $mimeType, int $quality): EncodedImageInterface
    {
        return match ($mimeType) {
            'image/png' => $image->toPng(),
            'image/webp' => $image->toWebp(quality: $quality),
            default => $image->toJpeg(quality: $quality),
        };
    }

    /**
     * e.g. assets/image/articles/abc.jpg → assets/image/articles/sizes/medium_abc.jpg
     */
    private function siblingPath(string $path, string $folder, string $prefix = ''): string
    {
        $directory = pathinfo($path, PATHINFO_DIRNAME);

        return ($directory === '.' ? '' : "{$directory}/")."{$folder}/{$prefix}".basename($path);
    }
}
