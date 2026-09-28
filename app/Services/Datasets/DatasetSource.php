<?php

namespace App\Services\Datasets;

/**
 * A slow, rate-limited, or expensive source whose rows are snapshotted into the cache
 * by DatasetCache. Register implementations in config/datasets.php.
 */
interface DatasetSource
{
    /**
     * Fetch every row for the given scope (an external account, region, station, ...).
     *
     * @return list<array<string, mixed>>
     */
    public function fetch(?string $scope = null): array;
}
