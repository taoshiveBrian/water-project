<?php

namespace App\Http\Controllers\Media;

use App\Enums\ProcessingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Media\StoreMediaRequest;
use App\Http\Requests\Media\UpdateMediaSettingsRequest;
use App\Models\Asset;
use App\Models\MediaSettings;
use App\Services\AssetService;
use App\Services\AssetUsage;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The media library: gallery, uploads, edits and deletes. Any signed-in user can
 * manage every asset until roles exist.
 */
class MediaController extends Controller
{
    public const array TABS = ['gallery', 'settings', 'queue'];

    public function __construct(private AssetUsage $usage) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'tab' => ['nullable', Rule::in(self::TABS)],
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::in(Asset::FILE_TYPES)],
            'folder' => ['nullable', 'string', 'max:50'],
            'featured' => ['nullable', 'boolean'],
        ]);

        $assets = Asset::query()
            ->with('user')
            ->when($filters['search'] ?? null, fn ($query, string $search) => $query->search($search))
            ->when($filters['type'] ?? null, fn ($query, string $type) => $query->where('category', $type))
            ->when($filters['folder'] ?? null, fn ($query, string $folder) => $query->where('subcategory', $folder))
            ->when($request->boolean('featured'), fn ($query) => $query->where('is_featured', true))
            ->latest()
            ->paginate(24)
            ->withQueryString();

        $usage = $this->usage->forAssets($assets->getCollection()->map(fn (Asset $asset): int => $asset->id)->values()->all());

        return Inertia::render('dashboard/media', [
            'tab' => $filters['tab'] ?? 'gallery',
            'filters' => [
                'search' => $filters['search'] ?? null,
                'type' => $filters['type'] ?? null,
                'folder' => $filters['folder'] ?? null,
                'featured' => $request->boolean('featured'),
            ],
            'assets' => $assets->through(fn (Asset $asset): array => [
                ...$this->present($asset),
                'usage' => $usage[$asset->id] ?? [],
            ]),
            'folders' => Asset::query()->whereNotNull('subcategory')->distinct()->orderBy('subcategory')->pluck('subcategory'),
            'stats' => [
                'total_count' => Asset::count(),
                'total_size' => (int) Asset::sum('file_size'),
                'saved_bytes' => (int) Asset::where('optimized_size', '>', 0)->sum('optimized_size'),
                'by_type' => Asset::query()->toBase()->selectRaw('category, count(*) as total')->groupBy('category')->pluck('total', 'category'),
            ],
            'settings' => MediaSettings::current(),
            'supportedMimeTypes' => UpdateMediaSettingsRequest::SUPPORTED_MIME_TYPES,
            'phpLimits' => [
                'upload_max_filesize' => (string) ini_get('upload_max_filesize'),
                'post_max_size' => (string) ini_get('post_max_size'),
                'ini_file' => (string) php_ini_loaded_file(),
            ],
            'queueStats' => fn () => $this->queueStats(),
            'recentJobs' => fn () => Asset::query()->with('user')
                ->whereIn('processing_status', [ProcessingStatus::Pending, ProcessingStatus::Processing, ProcessingStatus::Failed])
                ->latest('updated_at')
                ->limit(25)
                ->get()
                ->map(fn (Asset $asset): array => $this->present($asset)),
        ]);
    }

    public function store(StoreMediaRequest $request, AssetService $assets): RedirectResponse
    {
        $stored = collect($request->file('files'))->map(fn ($file) => $assets->store(
            $file,
            $request->validated('folder'),
            $request->user(),
            isLibraryItem: true,
        ));

        $failed = $stored->where('processing_status', ProcessingStatus::Failed)->count();

        Inertia::flash('toast', $failed > 0
            ? ['type' => 'error', 'message' => __(':count uploaded, :failed failed processing. See the Queue tab.', ['count' => $stored->count(), 'failed' => $failed])]
            : ['type' => 'success', 'message' => trans_choice('{1} File uploaded.|[2,*] :count files uploaded.', $stored->count())]);

        return back();
    }

    /**
     * Edit descriptive details. Changing the folder relabels the file; it doesn't move it.
     */
    public function update(Request $request, Asset $asset): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'subcategory' => ['nullable', 'string', 'alpha_dash', 'max:50'],
            'is_featured' => ['required', 'boolean'],
        ]);

        $asset->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Details saved.')]);

        return back();
    }

    /**
     * Delete an asset and its files. Refused while any article uses it.
     */
    public function destroy(Asset $asset): RedirectResponse
    {
        $usedBy = $this->usage->forAssets([$asset->id])[$asset->id];

        if ($usedBy !== []) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('In use by: :titles. Remove it there first.', [
                'titles' => collect($usedBy)->pluck('title')->implode(', '),
            ])]);

            return back();
        }

        $asset->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('File deleted.')]);

        return back();
    }

    /**
     * Delete several assets, skipping any an article still uses.
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        $assets = $this->selectedAssets($request);
        $usage = $this->usage->forAssets($assets->map(fn (Asset $asset): int => $asset->id)->values()->all());

        [$inUse, $unused] = $assets->partition(fn (Asset $asset): bool => $usage[$asset->id] !== []);
        $unused->each->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => $inUse->isEmpty()
            ? __('Deleted :count.', ['count' => $unused->count()])
            : __('Deleted :count. Skipped :skipped still used by articles.', ['count' => $unused->count(), 'skipped' => $inUse->count()])]);

        return back();
    }

    public function bulkFolder(Request $request): RedirectResponse
    {
        $folder = $request->validate([
            'folder' => ['nullable', 'string', 'alpha_dash', 'max:50'],
        ])['folder'] ?? null;

        $assets = $this->selectedAssets($request);
        Asset::whereKey($assets->modelKeys())->update(['subcategory' => $folder]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Moved :count to :folder.', [
            'count' => $assets->count(),
            'folder' => $folder ?? __('no folder'),
        ])]);

        return back();
    }

    public function updateSettings(UpdateMediaSettingsRequest $request): RedirectResponse
    {
        MediaSettings::current()->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Media settings saved. Reprocess images to apply them to existing files.')]);

        return back();
    }

    /**
     * @return EloquentCollection<int, Asset>
     */
    private function selectedAssets(Request $request): EloquentCollection
    {
        $ids = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer', 'distinct'],
        ])['ids'];

        return Asset::whereKey($ids)->get();
    }

    /**
     * @return array<string, int>
     */
    private function queueStats(): array
    {
        $counts = Asset::query()->toBase()
            ->selectRaw('processing_status, count(*) as total')
            ->groupBy('processing_status')
            ->pluck('total', 'processing_status');

        return collect(ProcessingStatus::cases())
            ->mapWithKeys(fn (ProcessingStatus $status): array => [$status->value => (int) ($counts[$status->value] ?? 0)])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public static function present(Asset $asset): array
    {
        return [
            'id' => $asset->id,
            'title' => $asset->title,
            'original_filename' => $asset->original_filename,
            'alt_text' => $asset->alt_text,
            'description' => $asset->description,
            'url' => $asset->url,
            'thumbnail_url' => $asset->thumbnail_url,
            'size_urls' => $asset->sizeUrls(),
            'mime_type' => $asset->mime_type,
            'category' => $asset->category,
            'subcategory' => $asset->subcategory,
            'file_size' => $asset->file_size,
            'optimized_size' => $asset->optimized_size,
            'processing_status' => $asset->processing_status,
            'processing_error' => $asset->processing_error,
            'is_featured' => $asset->is_featured,
            'is_library_item' => $asset->is_library_item,
            'uploaded_by' => $asset->user?->name,
            'created_at' => $asset->created_at,
        ];
    }
}
