<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ArticlePolicy
{
    /**
     * Anyone can see a public article and any logged-in user a members-only one; draft notes
     * are visible only to their author. A hidden article returns 404 so its existence isn't revealed.
     */
    public function view(?User $user, Article $article): Response
    {
        return (! $article->is_note && ($article->is_public || $user)) || $user?->id === $article->user_id
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * Determine whether the user can create articles.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the article.
     */
    public function update(User $user, Article $article): bool
    {
        return $user->id === $article->user_id;
    }

    /**
     * Determine whether the user can delete the article.
     */
    public function delete(User $user, Article $article): bool
    {
        return $user->id === $article->user_id;
    }
}
