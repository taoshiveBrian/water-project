<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Services\AssetService;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * @extends Factory<Asset>
 */
class AssetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'disk' => AssetService::DISK,
            'path' => 'assets/images/'.fake()->uuid().'.jpg',
            'original_filename' => fake()->word().'.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => fake()->numberBetween(10_000, 500_000),
            'category' => 'image',
        ];
    }

    /**
     * Uploaded straight to the media library, so it's kept even when unused.
     */
    public function libraryItem(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_library_item' => true,
        ]);
    }

    /**
     * Put a real (fake) image on the disk at the asset's path.
     */
    public function withFile(): static
    {
        return $this->afterCreating(function (Asset $asset) {
            Storage::disk($asset->disk)->put(
                $asset->path,
                UploadedFile::fake()->image('image.jpg')->getContent(),
            );
        });
    }
}
