<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Snapshot Lifetime
    |--------------------------------------------------------------------------
    |
    | Minutes a synced dataset stays in the cache. The window is fixed from the
    | moment of the sync; browsing the data does not extend it.
    |
    */

    'ttl_minutes' => (int) env('DATASET_CACHE_TTL_MINUTES', 20),

    /*
    |--------------------------------------------------------------------------
    | Dataset Sources
    |--------------------------------------------------------------------------
    |
    | Route-safe dataset names mapped to their DatasetSource implementation.
    |
    */

    'sources' => [
        //
    ],

];
