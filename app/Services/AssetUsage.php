<?php

namespace App\Services;

use App\Enums\ArticleTemplate;
use App\Models\Article;
use Illuminate\Database\Eloquent\Builder;

/**
 * Finds which articles reference which assets, through the fixed image columns
 * and Guide chapter pools.
 */
class AssetUsage
{
    /**
     * @param  array<int, int>  $assetIds
     * @return array<int, list<array{id: int, title: string}>> asset id => articles using it
     */
    public function forAssets(array $assetIds, ?int $exceptArticleId = null): array
    {
        $usage = array_fill_keys($assetIds, []);

        if ($assetIds === []) {
            return $usage;
        }

        $columns = array_map(fn (string $field): string => "{$field}_id", Article::IMAGE_FIELDS);

        $fixed = Article::query()
            ->select(['id', 'title', ...$columns])
            ->when($exceptArticleId, fn (Builder $query, int $id) => $query->whereKeyNot($id))
            ->where(function (Builder $query) use ($columns, $assetIds) {
                foreach ($columns as $column) {
                    $query->orWhereIn($column, $assetIds);
                }
            })
            ->get();

        foreach ($fixed as $article) {
            foreach ($columns as $column) {
                if (isset($usage[$article->{$column}])) {
                    $usage[$article->{$column}][$article->id] = ['id' => $article->id, 'title' => $article->title];
                }
            }
        }

        $guides = Article::query()
            ->where('template', ArticleTemplate::Sectioned)
            ->when($exceptArticleId, fn (Builder $query, int $id) => $query->whereKeyNot($id))
            ->where(function (Builder $query) use ($assetIds) {
                foreach ($assetIds as $assetId) {
                    $query->orWhereLike('body', '%"assetId":'.$assetId.'%');
                }
            })
            ->get();

        foreach ($guides as $article) {
            foreach ($article->chapterAssetIds() as $assetId) {
                if (isset($usage[$assetId])) {
                    $usage[$assetId][$article->id] = ['id' => $article->id, 'title' => $article->title];
                }
            }
        }

        $result = [];

        foreach ($assetIds as $assetId) {
            $result[$assetId] = array_values($usage[$assetId]);
        }

        return $result;
    }

    public function isUsed(int $assetId, ?int $exceptArticleId = null): bool
    {
        return $this->forAssets([$assetId], $exceptArticleId)[$assetId] !== [];
    }
}
