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
            'type' => $this->type,
            'template' => $this->template,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'body' => $this->body(),
            'is_public' => $this->is_public,
            'is_note' => $this->is_note,
            'source_label' => $this->source_label,
            'source_url' => $this->source_url,
            'author' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
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

        $urls = Asset::whereKey($this->resource->chapterAssetIds())
            ->get()
            ->mapWithKeys(fn (Asset $asset): array => [$asset->id => $asset->display_url]);

        foreach ($body['chapters'] as $chapterIndex => $chapter) {
            foreach ($chapter['pool'] ?? [] as $entryIndex => $entry) {
                $body['chapters'][$chapterIndex]['pool'][$entryIndex]['url'] = $urls[$entry['assetId'] ?? 0] ?? null;
            }
        }

        return $body;
    }

    /**
     * Every image slot keyed by field, with the live URL and display mode.
     *
     * @return array<string, array{url: string|null, display: string|null}>
     */
    private function images(): array
    {
        $images = [];

        foreach (Article::IMAGE_FIELDS as $field) {
            $images[$field] = [
                'url' => $this->resource->imageAsset($field)?->display_url,
                'display' => $field === 'cover_image' ? null : $this->{"{$field}_display"},
            ];
        }

        return $images;
    }
}
