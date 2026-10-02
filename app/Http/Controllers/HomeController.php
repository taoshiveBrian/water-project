<?php

namespace App\Http\Controllers;

use App\Http\Resources\ArticleResource;
use App\Models\Article;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class HomeController extends Controller
{
    /**
     * The landing page: the six most recent articles the viewer can see, in full.
     */
    public function __invoke(Request $request): Response
    {
        $articles = Article::query()
            ->published()
            ->visibleTo($request->user())
            ->with(['user', 'category', ...Article::imageRelations()])
            ->latest()
            ->limit(6)
            ->get();

        return Inertia::render('welcome', [
            'articles' => ArticleResource::collection($articles)->resolve($request),
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
        ]);
    }
}
