<?php

namespace App\Services\Datasets;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Container\Container;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;

/**
 * Holds short-lived snapshots of external or expensive datasets in the cache store so
 * they can be paged through without hitting the source on every request.
 *
 * Each dataset + scope pair gets its own key and its own fixed TTL window, starting at
 * the moment it was synced. Reads never extend it; an expired snapshot reads as null.
 */
class DatasetCache
{
    public function __construct(private Container $container) {}

    public function exists(string $dataset): bool
    {
        return array_key_exists($dataset, $this->sources());
    }

    /**
     * Fetch fresh rows from the source and overwrite the snapshot with a new TTL window.
     *
     * @return array{count: int, synced_at: CarbonImmutable}
     */
    public function sync(string $dataset, ?string $scope = null): array
    {
        $rows = $this->source($dataset)->fetch($scope);
        $syncedAt = now();

        Cache::put($this->cacheKey($dataset, $scope), [
            'rows' => $rows,
            'synced_at' => $syncedAt->toIso8601String(),
        ], $syncedAt->addMinutes($this->ttlMinutes()));

        return ['count' => count($rows), 'synced_at' => $syncedAt];
    }

    /**
     * The cached snapshot, or null when never synced or expired.
     *
     * @return array{rows: list<array<string, mixed>>, synced_at: string}|null
     */
    public function get(string $dataset, ?string $scope = null): ?array
    {
        return Cache::get($this->cacheKey($dataset, $scope));
    }

    /**
     * One page of the cached snapshot, or null when there is nothing cached.
     *
     * @return array{synced_at: string, paginator: LengthAwarePaginator<int, array<string, mixed>>}|null
     */
    public function paginate(string $dataset, ?string $scope, int $page, int $perPage = 50): ?array
    {
        $cached = $this->get($dataset, $scope);

        if ($cached === null) {
            return null;
        }

        $page = max($page, 1);

        return [
            'synced_at' => $cached['synced_at'],
            'paginator' => new LengthAwarePaginator(
                collect($cached['rows'])->forPage($page, $perPage)->values()->all(),
                count($cached['rows']),
                $perPage,
                $page,
                ['path' => Paginator::resolveCurrentPath()],
            ),
        ];
    }

    public function forget(string $dataset, ?string $scope = null): void
    {
        Cache::forget($this->cacheKey($dataset, $scope));
    }

    /**
     * One key per dataset + scope, so snapshots never overwrite each other.
     */
    private function cacheKey(string $dataset, ?string $scope): string
    {
        return $scope === null
            ? "dataset_cache_{$dataset}"
            : "dataset_cache_{$dataset}_{$scope}";
    }

    private function source(string $dataset): DatasetSource
    {
        if (! $this->exists($dataset)) {
            throw new InvalidArgumentException("Unknown dataset [{$dataset}].");
        }

        return $this->container->make($this->sources()[$dataset]);
    }

    /**
     * @return array<string, class-string<DatasetSource>>
     */
    private function sources(): array
    {
        return config('datasets.sources', []);
    }

    private function ttlMinutes(): int
    {
        return (int) config('datasets.ttl_minutes', 20);
    }
}
