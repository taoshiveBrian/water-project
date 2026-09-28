<?php

namespace App\Console\Commands;

use App\Models\Asset;
use App\Services\AssetService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

#[Signature('files:cleanup {--dry-run : List orphaned files without deleting them}')]
#[Description('Delete files under the assets directory that no Asset row points to')]
class CleanupOrphanedFiles extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $disk = Storage::disk(AssetService::DISK);

        $knownPaths = Asset::where('disk', AssetService::DISK)
            ->get()
            ->flatMap(fn (Asset $asset): array => $asset->storedPaths())
            ->flip();

        $orphans = collect($disk->allFiles('assets'))
            ->reject(fn (string $path): bool => $knownPaths->has($path))
            ->values();

        if ($this->option('dry-run')) {
            $orphans->each(fn (string $path) => $this->line($path));
            $this->info("Found {$orphans->count()} orphaned files.");

            return self::SUCCESS;
        }

        $disk->delete($orphans->all());

        $this->info("Deleted {$orphans->count()} orphaned files.");

        return self::SUCCESS;
    }
}
