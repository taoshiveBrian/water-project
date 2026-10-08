<?php

namespace App\Http\Controllers\Media;

use App\Enums\ProcessingStatus;
use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Services\ImageProcessingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * Re-run image processing: one asset, a selection, or every image (optionally
 * only failed ones). Uses immediate or queued processing per the media settings.
 */
class MediaProcessingController extends Controller
{
    public function __construct(private ImageProcessingService $processor) {}

    public function single(Request $request, Asset $asset): RedirectResponse
    {
        abort_unless($asset->isVisibleTo($request->user()), 404);

        return $this->run(collect([$asset]));
    }

    public function bulk(Request $request): RedirectResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'distinct'],
        ])['ids'];

        return $this->run(Asset::visibleTo($request->user())->whereKey($ids)->get());
    }

    public function all(Request $request): RedirectResponse
    {
        $onlyFailed = $request->validate([
            'only_failed' => ['nullable', 'boolean'],
        ])['only_failed'] ?? false;

        return $this->run(Asset::query()
            ->whereIn('mime_type', ['image/jpeg', 'image/png', 'image/webp'])
            ->when($onlyFailed, fn ($query) => $query->where('processing_status', ProcessingStatus::Failed))
            ->get());
    }

    /**
     * @param  Collection<int, Asset>  $assets
     */
    private function run(Collection $assets): RedirectResponse
    {
        $processable = $assets->filter(fn (Asset $asset): bool => $asset->isProcessableImage());
        $processable->each(fn (Asset $asset) => $this->processor->schedule($asset));

        $skipped = $assets->count() - $processable->count();

        Inertia::flash('toast', ['type' => 'success', 'message' => $skipped > 0
            ? __('Processing :count. Skipped :skipped that are not JPEG, PNG or WebP images.', ['count' => $processable->count(), 'skipped' => $skipped])
            : __('Processing :count.', ['count' => $processable->count()])]);

        return back();
    }
}
