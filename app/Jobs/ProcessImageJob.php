<?php

namespace App\Jobs;

use App\Models\Asset;
use App\Services\ImageProcessingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Queue-mode image processing. Deleted assets are dropped rather than failing.
 */
class ProcessImageJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    public bool $deleteWhenMissingModels = true;

    public function __construct(public Asset $asset) {}

    public function handle(ImageProcessingService $processor): void
    {
        $processor->process($this->asset);
    }

    public function failed(Throwable $exception): void
    {
        app(ImageProcessingService::class)->markFailed($this->asset, $exception);
    }
}
