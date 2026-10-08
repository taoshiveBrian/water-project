<?php

namespace App\Http\Resources;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The fields an article card needs. Expects `user.avatarImage`, `category` and `coverImage` loaded.
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
            'author' => AuthorResource::make($this->user)->resolve($request),
            'cover_image_url' => $this->coverImage?->variantUrl('medium'),
            'cover_image_pixelated' => $this->coverImage?->isPixelArt() ?? false,
            'created_at' => $this->created_at,
        ];
    }
}
