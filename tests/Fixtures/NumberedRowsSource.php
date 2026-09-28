<?php

namespace Tests\Fixtures;

use App\Services\Datasets\DatasetSource;

/**
 * Test-only source: 240 numbered rows tagged with the requested scope.
 */
class NumberedRowsSource implements DatasetSource
{
    public function fetch(?string $scope = null): array
    {
        return array_map(
            fn (int $number): array => ['number' => $number, 'scope' => $scope],
            range(0, 239),
        );
    }
}
