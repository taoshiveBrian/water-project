<?php

namespace App\Models;

use App\Enums\ProcessingMethod;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Media library processing settings. Always exactly one row; use current().
 *
 * @property int $id
 * @property bool $processing_enabled
 * @property bool $compress_images
 * @property int $compression_quality
 * @property list<array{name: string, width: int|null, height: int|null, crop: bool, enabled: bool}> $sizes
 * @property ProcessingMethod $processing_method
 * @property list<string> $allowed_mime_types
 * @property int $max_file_size Kilobytes.
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'processing_enabled',
    'compress_images',
    'compression_quality',
    'sizes',
    'processing_method',
    'allowed_mime_types',
    'max_file_size',
])]
class MediaSettings extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'processing_enabled' => 'boolean',
            'compress_images' => 'boolean',
            'compression_quality' => 'integer',
            'sizes' => 'array',
            'processing_method' => ProcessingMethod::class,
            'allowed_mime_types' => 'array',
            'max_file_size' => 'integer',
        ];
    }

    /**
     * The settings row, created with defaults on first use.
     */
    public static function current(): self
    {
        return self::query()->firstOrCreate([], self::defaults());
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'processing_enabled' => true,
            'compress_images' => true,
            'compression_quality' => 85,
            'sizes' => [
                ['name' => 'thumbnail', 'width' => 300, 'height' => 300, 'crop' => true, 'enabled' => true],
                ['name' => 'medium', 'width' => 800, 'height' => 800, 'crop' => false, 'enabled' => true],
                ['name' => 'large', 'width' => 1920, 'height' => 1920, 'crop' => false, 'enabled' => true],
            ],
            'processing_method' => ProcessingMethod::Immediate,
            'allowed_mime_types' => [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'video/mp4', 'video/quicktime',
                'audio/mpeg', 'audio/wav',
                'application/pdf',
            ],
            'max_file_size' => 10240,
        ];
    }

    /**
     * Size variants that are switched on.
     *
     * @return list<array{name: string, width: int|null, height: int|null, crop: bool, enabled: bool}>
     */
    public function enabledSizes(): array
    {
        return array_values(array_filter($this->sizes, fn (array $size): bool => $size['enabled']));
    }
}
