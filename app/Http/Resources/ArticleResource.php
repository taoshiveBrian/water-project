<?php

namespace App\Http\Resources;

use App\Enums\ArticleTemplate;
use App\Models\Article;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Article
 */
class ArticleResource extends JsonResource
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
            'subtitle' => $this->subtitle,
            'body' => $this->body(),
            'is_public' => $this->is_public,
            'is_note' => $this->is_note,
            'source_label' => $this->source_label,
            'source_url' => $this->source_url,
            'author' => AuthorResource::make($this->user)->resolve($request),
            'images' => $this->images(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * The body JSON, with each Guide chapter pool entry given its image URL from the
     * asset's disk (never built client-side).
     *
     * @return array<string, mixed>
     */
    private function body(): array
    {
        $body = $this->body;

        if ($this->template !== ArticleTemplate::Sectioned) {
            return $body;
        }

        $assets = Asset::whereKey($this->resource->chapterAssetIds())->get()->keyBy('id');

        foreach ($body['chapters'] as $chapterIndex => $chapter) {
            foreach ($chapter['pool'] ?? [] as $entryIndex => $entry) {
                $asset = $assets[$entry['assetId'] ?? 0] ?? null;
                $body['chapters'][$chapterIndex]['pool'][$entryIndex]['url'] = $asset?->display_url;
                $body['chapters'][$chapterIndex]['pool'][$entryIndex]['pixelated'] = $asset?->isPixelArt() ?? false;
            }
        }

        return $body;
    }

    /**
     * Every image slot keyed by field, with the live URL and display mode.
     *
     * @return array<string, array{url: string|null, pixelated: bool, display: string|null}>
     */
    private function images(): array
    {
        $images = [];

        foreach (Article::IMAGE_FIELDS as $field) {
            $asset = $this->resource->imageAsset($field);

            $images[$field] = [
                'url' => $asset?->display_url,
                'pixelated' => $asset?->isPixelArt() ?? false,
                'display' => $field === 'cover_image' ? null : $this->{"{$field}_display"},
            ];
        }

        return $images;
    }
}
