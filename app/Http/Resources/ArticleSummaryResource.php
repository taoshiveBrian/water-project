<?php

namespace App\Http\Resources;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The fields an article card needs. Expects `user`, `category` and `coverImage` loaded.
 *
 * @mixin Article
 */
class ArticleSummaryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category?->only(['id', 'name', 'slug']),
            'template' => $this->template,
            'title' => $this->title,
            'is_public' => $this->is_public,
            'author' => $this->user->name,
            'cover_image_url' => $this->coverImage ? ($this->coverImage->sizeUrls()['medium'] ?? $this->coverImage->url) : null,
            'created_at' => $this->created_at,
        ];
    }
}
