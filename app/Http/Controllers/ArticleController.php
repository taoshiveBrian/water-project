<?php

namespace App\Http\Controllers;

use App\Actions\Articles\SaveArticle;
use App\Enums\ArticleTemplate;
use App\Enums\ArticleType;
use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ArticleController extends Controller
{
    /**
     * List the published articles the viewer can see, optionally filtered by type.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'type' => ['nullable', Rule::enum(ArticleType::class)],
        ]);

        $articles = Article::query()
            ->published()
            ->visibleTo($request->user())
            ->when($filters['type'] ?? null, fn ($query, string $type) => $query->where('type', $type))
            ->with(['user', 'coverImage'])
            ->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Article $article): array => [
                'id' => $article->id,
                'type' => $article->type,
                'template' => $article->template,
                'title' => $article->title,
                'is_public' => $article->is_public,
                'author' => $article->user->name,
                'cover_image_url' => $article->coverImage ? ($article->coverImage->sizeUrls()['medium'] ?? $article->coverImage->url) : null,
                'created_at' => $article->created_at,
            ]);

        return Inertia::render('articles/index', [
            'articles' => $articles,
            'filters' => ['type' => $filters['type'] ?? null],
            'types' => $this->typeOptions(),
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
            ->latest('updated_at')
            ->get()
            ->map(fn (Article $article): array => [
                'id' => $article->id,
                'template' => $article->template,
                'title' => $article->title,
                'updated_at' => $article->updated_at,
            ]);

        return Inertia::render('dashboard/notes', [
            'notes' => $notes,
            'types' => $this->typeOptions(),
        ]);
    }

    /**
     * Show a single rendered article.
     */
    public function show(Request $request, Article $article): Response
    {
        Gate::authorize('view', $article);

        $article->load(['user', ...Article::imageRelations()]);

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
            'types' => $this->typeOptions(),
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

        $article->load(['user', ...Article::imageRelations()]);

        return Inertia::render('articles/edit', [
            'article' => ArticleResource::make($article)->resolve($request),
            'types' => $this->typeOptions(),
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
    public function publish(Request $request, Article $article): RedirectResponse
    {
        Gate::authorize('update', $article);
        abort_unless($article->is_note, 404);

        $validated = $request->validate([
            'type' => ['required', Rule::enum(ArticleType::class)],
            'is_public' => ['required', 'boolean'],
        ]);

        $article->update([...$validated, 'is_note' => false]);

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
     * @return list<array{value: string, label: string}>
     */
    private function typeOptions(): array
    {
        return array_map(
            fn (ArticleType $type): array => ['value' => $type->value, 'label' => $type->label()],
            ArticleType::cases(),
        );
    }
}
