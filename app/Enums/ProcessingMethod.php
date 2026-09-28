<?php

namespace App\Enums;

enum ProcessingMethod: string
{
    /** Process during the upload request. No worker needed. */
    case Immediate = 'immediate';

    /** Process in a queued job. Needs `php artisan queue:work` running. */
    case Queue = 'queue';
}
