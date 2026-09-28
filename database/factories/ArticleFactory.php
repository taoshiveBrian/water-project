<?php

namespace Database\Factories;

use App\Enums\ArticleTemplate;
use App\Enums\ArticleType;
use App\Models\Article;
use App\Models\Asset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Article>
 */
class ArticleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => ArticleType::Post,
            'template' => ArticleTemplate::Article,
            'title' => fake()->sentence(),
            'body' => [
                'builder' => 'v2',
                'sections' => [
                    ['type' => 'text', 'instanceId' => 'text-1', 'content' => fake()->paragraph()],
                ],
                'pool' => [],
            ],
            'is_public' => true,
        ];
    }

    public function note(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_note' => true,
            'is_public' => false,
        ]);
    }

    public function simple(): static
    {
        return $this->state(fn (array $attributes) => [
            'template' => ArticleTemplate::Simple,
            'subtitle' => fake()->sentence(),
            'body' => ['builder' => 'simple', 'text' => fake()->paragraph(), 'text2' => null],
        ]);
    }

    /**
     * A guide with one chapter whose pool holds one stored image tagged imgA.
     */
    public function guide(): static
    {
        return $this->state(fn (array $attributes) => [
            'template' => ArticleTemplate::Sectioned,
            'body' => [
                'builder' => 'v2-chapters',
                'chapters' => [[
                    'id' => 'chapter-1',
                    'heading' => 'Getting started',
                    'sections' => [['type' => 'text', 'instanceId' => 'text-1', 'content' => 'Step one [imgA]']],
                    'pool' => [[
                        'tag' => 'imgA',
                        'displayMode' => 'block',
                        'assetId' => Asset::factory()->withFile()->create()->id,
                    ]],
                ]],
            ],
        ]);
    }

    public function tutorial(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ArticleType::Tutorial,
        ]);
    }

    public function membersOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_public' => false,
        ]);
    }

    /**
     * Attach a cover image asset with a file on disk.
     */
    public function withCoverImage(): static
    {
        return $this->state(fn (array $attributes) => [
            'cover_image_id' => Asset::factory()->withFile(),
        ]);
    }

    /**
     * Attach an image asset (with a file on disk) to the first pool slot.
     */
    public function withPoolImage(): static
    {
        return $this->state(fn (array $attributes) => [
            'image_1_id' => Asset::factory()->withFile(),
            'body' => [
                ...$attributes['body'],
                'pool' => [['tag' => 'imgA', 'field' => 'image_1', 'displayMode' => 'block']],
            ],
        ]);
    }
}
