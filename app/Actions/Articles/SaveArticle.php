<?php

namespace App\Actions\Articles;

use App\Enums\ArticleTemplate;
use App\Enums\ArticleType;
use App\Models\Article;
use App\Models\Asset;
use App\Services\AssetService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/**
 * Fills and saves an article from a validated store/update request, for any template.
 *
 * Image rules, for fixed slots and Guide chapter images alike: a new file replaces the
 * image, an image picked from the media library replaces it, a clear flag removes it,
 * and anything else keeps it. Replaced or removed assets are discarded only after the
 * article has been saved without them, and only if nothing else uses them.
 */
class SaveArticle
{
    public function __construct(private AssetService $assets) {}

    /**
     * The article's `template`, `is_note` and owner must already be set.
     */
    public function handle(Article $article, FormRequest $request): Article
    {
        $validated = $request->validated();
        $isArticleTemplate = $article->template === ArticleTemplate::Article;

        $article->fill([
            'title' => $validated['title'],
            'subtitle' => $article->template === ArticleTemplate::Simple ? ($validated['subtitle'] ?? null) : null,
            'body' => $validated['body'],
            'source_label' => $isArticleTemplate ? ($validated['source_label'] ?? null) : null,
            'source_url' => $isArticleTemplate ? ($validated['source_url'] ?? null) : null,
        ]);

        $article->type = $validated['type'] ?? $article->type ?? ArticleType::Post;

        $article->is_public = $article->is_note ? false : (bool) $validated['is_public'];

        /** @var list<Asset> $discarded */
        $discarded = [];

        $discarded[] = $this->applyImage($article, 'cover_image', $request);

        if ($isArticleTemplate) {
            foreach (Article::POOL_FIELDS as $field) {
                $discarded[] = $this->applyImage($article, $field, $request);
                $article->{"{$field}_display"} = $validated["{$field}_display"] ?? 'block';
            }
        }

        if ($article->template === ArticleTemplate::Sectioned) {
            $discarded = [...$discarded, ...$this->resolveChapterImages($article, $request)];
        }

        $article->save();

        foreach (array_filter($discarded) as $asset) {
            $this->assets->discard($asset);
        }

        return $article;
    }

    /**
     * Apply a new file or a clear flag to one fixed image slot.
     *
     * @return Asset|null the asset that is no longer used, if any
     */
    private function applyImage(Article $article, string $field, FormRequest $request): ?Asset
    {
        $current = $article->exists ? $article->imageAsset($field) : null;

        if ($request->hasFile($field)) {
            $article->{"{$field}_id"} = $this->storeImage($request, $request->file($field))->id;

            return $current;
        }

        $pickedId = $request->validated("{$field}_asset_id");

        if ($pickedId) {
            if ($current?->id === (int) $pickedId) {
                return null;
            }

            $article->{"{$field}_id"} = (int) $pickedId;

            return $current;
        }

        if ($current && $request->boolean("clear_{$field}")) {
            $article->{"{$field}_id"} = null;

            return $current;
        }

        return null;
    }

    /**
     * Rebuild every chapter pool entry's `assetId` from the server's own copy of the
     * previous body, keyed by "{chapterId}|{tag}". The client can only change it with a
     * new upload or a validated `pickedAssetId` from the library; a raw `assetId` is ignored.
     *
     * @return list<Asset> assets that are no longer referenced
     */
    private function resolveChapterImages(Article $article, FormRequest $request): array
    {
        $previous = [];

        foreach ($article->exists ? $article->getOriginal('body')['chapters'] ?? [] : [] as $chapter) {
            foreach ($chapter['pool'] ?? [] as $entry) {
                if (! empty($entry['assetId'])) {
                    $previous["{$chapter['id']}|{$entry['tag']}"] = (int) $entry['assetId'];
                }
            }
        }

        $body = $article->body;
        $kept = [];

        foreach ($body['chapters'] as $chapterIndex => $chapter) {
            foreach ($chapter['pool'] ?? [] as $entryIndex => $entry) {
                $assetId = $previous["{$chapter['id']}|{$entry['tag']}"] ?? null;
                $upload = isset($entry['uploadKey']) ? $request->file("chapter_images.{$entry['uploadKey']}") : null;

                if ($upload) {
                    $assetId = $this->storeImage($request, $upload)->id;
                } elseif (! empty($entry['pickedAssetId'])) {
                    $assetId = (int) $entry['pickedAssetId'];
                } elseif (! empty($entry['cleared'])) {
                    $assetId = null;
                }

                if ($assetId) {
                    $kept[$assetId] = true;
                }

                $body['chapters'][$chapterIndex]['pool'][$entryIndex] = [
                    'tag' => $entry['tag'],
                    'displayMode' => $entry['displayMode'],
                    'assetId' => $assetId,
                ];
            }
        }

        $article->body = $body;

        $unused = array_diff(array_unique(array_values($previous)), array_keys($kept));

        return array_values(Asset::whereKey($unused)->get()->all());
    }

    private function storeImage(FormRequest $request, UploadedFile $file): Asset
    {
        return $this->assets->store($file, 'articles', $request->user());
    }
}
