<?php

namespace App\Http\Controllers;

use App\Services\Datasets\DatasetCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DatasetController extends Controller
{
    public function __construct(private DatasetCache $datasets) {}

    /**
     * One page of a dataset's cached snapshot, or `synced: false` when nothing is cached.
     */
    public function show(Request $request, string $dataset): JsonResponse
    {
        $scope = $this->validatedScope($request, $dataset);

        $cached = $this->datasets->paginate($dataset, $scope, $request->integer('page', 1));

        return response()->json([
            'synced' => $cached !== null,
            'synced_at' => $cached['synced_at'] ?? null,
            'paginator' => $cached['paginator'] ?? null,
        ]);
    }

    /**
     * Pull fresh rows from the source and restart the snapshot's TTL window.
     */
    public function sync(Request $request, string $dataset): JsonResponse
    {
        $result = $this->datasets->sync($dataset, $this->validatedScope($request, $dataset));

        return response()->json([
            'count' => $result['count'],
            'synced_at' => $result['synced_at']->toIso8601String(),
        ]);
    }

    /**
     * Drop the snapshot so the next read reports it as not synced.
     */
    public function destroy(Request $request, string $dataset): JsonResponse
    {
        $this->datasets->forget($dataset, $this->validatedScope($request, $dataset));

        return response()->json(['synced' => false]);
    }

    private function validatedScope(Request $request, string $dataset): ?string
    {
        abort_unless($this->datasets->exists($dataset), 404);

        return $request->validate([
            'scope' => ['nullable', 'string', 'alpha_dash', 'max:100'],
        ])['scope'] ?? null;
    }
}
