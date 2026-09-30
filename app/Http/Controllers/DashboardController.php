<?php

namespace App\Http\Controllers;

use App\Http\Resources\ArticleSummaryResource;
use App\Models\Article;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * The dashboard, led by the three most recent articles the viewer can see.
     */
    public function __invoke(Request $request): Response
    {
        $latestArticles = Article::query()
            ->published()
            ->visibleTo($request->user())
            ->with(['user', 'category', 'coverImage'])
            ->latest()
            ->limit(3)
            ->get();

        return Inertia::render('dashboard', [
            'latestArticles' => ArticleSummaryResource::collection($latestArticles)->resolve($request),
        ]);
    }
}
