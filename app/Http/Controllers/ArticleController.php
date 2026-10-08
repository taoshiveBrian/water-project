<?php

namespace App\Http\Controllers;

use App\Actions\Articles\SaveArticle;
use App\Enums\ArticleTemplate;
use App\Http\Requests\PublishArticleRequest;
use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\ArticleSummaryResource;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    /**
     * List the published articles the viewer can see, optionally filtered by category slug,
     * and for members, by author.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'category' => ['nullable', 'string', Rule::exists('categories', 'slug')],
            'author' => [Rule::excludeIf(! $request->user()), 'nullable', 'integer', Rule::exists('users', 'id')],
        ]);

        $visible = fn () => Article::query()->published()->visibleTo($request->user());

        $articles = $visible()
            ->when($filters['category'] ?? null, fn ($query, string $slug) => $query->whereRelation('category', 'slug', $slug))
            ->when($filters['author'] ?? null, fn ($query, $userId) => $query->where('user_id', $userId))
            ->with(['user', 'category', 'coverImage'])
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Article $article): array => ArticleSummaryResource::make($article)->resolve($request));

        return Inertia::render('articles/index', [
            'articles' => $articles,
            'filters' => [
                'category' => $filters['category'] ?? null,
                'author' => isset($filters['author']) ? (int) $filters['author'] : null,
            ],
            'categories' => $this->categoryOptions(),
            'authors' => $request->user()
                ? User::query()->whereIn('id', $visible()->select('user_id'))->orderBy('name')->get(['id', 'name'])
                : [],
        ]);
    }

    /**
     * List the current user's draft notes, of any template.
     */
    public function notes(Request $request): Response
    {
        $notes = Article::query()
            ->whereBelongsTo($request->user())
            ->where('is_note', true)
            ->with('category')
            ->latest('updated_at')
            ->get()
            ->map(fn (Article $article): array => [
                'id' => $article->id,
                'template' => $article->template,
                'title' => $article->title,
                'category' => $article->category?->only(['id', 'name', 'slug']),
                'updated_at' => $article->updated_at,
            ]);

        return Inertia::render('dashboard/notes', [
            'notes' => $notes,
            'categories' => $this->categoryOptions(),
        ]);
    }

    /**
     * Show a single rendered article.
     */
    public function show(Request $request, Article $article): Response
    {
        Gate::authorize('view', $article);

        $article->load(['user', 'category', ...Article::imageRelations()]);

        return Inertia::render('articles/show', [
            'article' => ArticleResource::make($article)->resolve($request),
            'can' => [
                'update' => $request->user()?->can('update', $article) ?? false,
                'delete' => $request->user()?->can('delete', $article) ?? false,
            ],
        ]);
    }

    /**
     * Show the template picker and editors for a new article.
     */
    public function create(): Response
    {
        Gate::authorize('create', Article::class);

        return Inertia::render('articles/create', [
            'categories' => $this->categoryOptions(),
        ]);
    }

    /**
     * Store a new article or draft note.
     */
    public function store(StoreArticleRequest $request, SaveArticle $saveArticle): RedirectResponse
    {
        $article = new Article([
            'template' => $request->enum('template', ArticleTemplate::class),
            'is_note' => $request->boolean('is_note'),
        ]);
        $article->user()->associate($request->user());

        $saveArticle->handle($article, $request);

        return $this->redirectAfterSave($article, $article->is_note ? __('Note saved.') : __('Article published.'));
    }

    /**
     * Show the editor for an existing article or draft.
     */
    public function edit(Request $request, Article $article): Response
    {
        Gate::authorize('update', $article);

        $article->load(['user', 'category', ...Article::imageRelations()]);

        return Inertia::render('articles/edit', [
            'article' => ArticleResource::make($article)->resolve($request),
            'categories' => $this->categoryOptions(),
        ]);
    }

    /**
     * Update an article or draft. Its template and draft status never change here.
     */
    public function update(UpdateArticleRequest $request, Article $article, SaveArticle $saveArticle): RedirectResponse
    {
        $saveArticle->handle($article, $request);

        return $this->redirectAfterSave($article, $article->is_note ? __('Note saved.') : __('Article updated.'));
    }

    /**
     * Turn a draft note into a real post.
     */
    public function publish(PublishArticleRequest $request, Article $article): RedirectResponse
    {
        abort_unless($article->is_note, 404);

        $validated = $request->validated();

        $article->category_id = Category::idFromInput($validated);
        $article->is_public = $validated['is_public'];
        $article->is_note = false;
        $article->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Article published.')]);

        return to_route('articles.show', $article);
    }

    /**
     * Delete an article along with its images.
     */
    public function destroy(Article $article): RedirectResponse
    {
        Gate::authorize('delete', $article);

        $article->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Article deleted.')]);

        return $article->is_note ? to_route('dashboard.notes') : to_route('articles.index');
    }

    private function redirectAfterSave(Article $article, string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return $article->is_note ? to_route('dashboard.notes') : to_route('articles.show', $article);
    }

    /**
     * @return Collection<int, Category>
     */
    private function categoryOptions(): Collection
    {
        return Category::query()->orderBy('name')->get(['id', 'name', 'slug']);
    }
}
