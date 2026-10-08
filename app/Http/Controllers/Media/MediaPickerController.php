<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * JSON list of library images for the "choose from library" picker in editors.
 */
class MediaPickerController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $search = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ])['search'] ?? null;

        $images = Asset::query()
            ->images()
            ->where('is_private', false)
            ->when($search, fn ($query, string $term) => $query->search($term))
            ->latest()
            ->paginate(24)
            ->withQueryString()
            ->through(fn (Asset $asset): array => [
                'id' => $asset->id,
                'title' => $asset->title,
                'original_filename' => $asset->original_filename,
                'alt_text' => $asset->alt_text,
                'url' => $asset->display_url,
                'thumbnail_url' => $asset->thumbnail_url,
            ]);

        return response()->json($images);
    }
}
