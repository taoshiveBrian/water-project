<?php

use App\Enums\ArticleTemplate;
use App\Models\Article;
use App\Models\Asset;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
});

/**
 * A valid editor payload with one text section and the given pool entries.
 *
 * @param  list<array{tag: string, field: string, displayMode: string}>  $pool
 * @return array<string, mixed>
 */
function articlePayload(array $pool = [], array $overrides = []): array
{
    return [
        'template' => 'article',
        'title' => 'Reading a hydrograph',
        'is_public' => '1',
        'source_label' => 'USGS',
        'source_url' => 'https://waterdata.usgs.gov',
        'body' => json_encode([
            'builder' => 'v2',
            'sections' => [
                ['type' => 'text', 'instanceId' => 'text-1', 'content' => 'Intro [imgA]'],
            ],
            'pool' => $pool,
        ]),
        ...$overrides,
    ];
}

describe('index', function () {
    test('guests only see public articles', function () {
        $public = Article::factory()->create();
        Article::factory()->membersOnly()->create();

        $response = $this->get(route('articles.index'));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('articles/index')
            ->has('articles.data', 1)
            ->where('articles.data.0.id', $public->id));
    });

    test('logged-in users also see members-only articles', function () {
        Article::factory()->membersOnly()->create();
        Article::factory()->note()->create();

        $response = $this->actingAs(User::factory()->create())->get(route('articles.index'));

        $response->assertInertia(fn (Assert $page) => $page->has('articles.data', 1));
    });

    test('articles can be filtered by category, with every category offered as a tab', function () {
        $categorized = Article::factory()->categorized()->create();
        Article::factory()->categorized()->create();
        Article::factory()->create();
        $slug = $categorized->category->slug;

        $response = $this->get(route('articles.index', ['category' => $slug]));

        $response->assertInertia(fn (Assert $page) => $page
            ->has('categories', 2)
            ->has('articles.data', 1)
            ->where('articles.data.0.id', $categorized->id)
            ->where('articles.data.0.category.slug', $slug)
            ->where('filters.category', $slug));
    });

    test('members can filter articles by author, with every author offered', function () {
        $article = Article::factory()->create();
        Article::factory()->membersOnly()->create();

        $response = $this->actingAs($article->user)->get(route('articles.index', ['author' => $article->user_id]));

        $response->assertInertia(fn (Assert $page) => $page
            ->has('authors', 2)
            ->has('articles.data', 1)
            ->where('articles.data.0.id', $article->id)
            ->where('filters.author', $article->user_id));
    });

    test('guests cannot filter by author', function () {
        $article = Article::factory()->create();
        Article::factory()->create();

        $response = $this->get(route('articles.index', ['author' => $article->user_id]));

        $response->assertInertia(fn (Assert $page) => $page
            ->has('authors', 0)
            ->has('articles.data', 2)
            ->where('filters.author', null));
    });

    test('an unknown category filter is rejected', function () {
        $response = $this->get(route('articles.index', ['category' => 'missing']));

        $response->assertSessionHasErrors('category');
    });
});

describe('show', function () {
    test('guests can view a public article with its image urls', function () {
        $article = Article::factory()->withCoverImage()->create();

        $response = $this->get(route('articles.show', $article));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('articles/show')
            ->where('article.title', $article->title)
            ->where('article.images.cover_image.url', $article->coverImage->url)
            ->where('can.update', false));
    });

    test('members-only articles are visible to other logged-in users but not guests', function () {
        $article = Article::factory()->membersOnly()->create();

        $this->get(route('articles.show', $article))->assertNotFound();
        $this->actingAs(User::factory()->create())->get(route('articles.show', $article))->assertOk();
    });

    test('authors can view their members-only articles', function () {
        $article = Article::factory()->membersOnly()->create();

        $response = $this->actingAs($article->user)->get(route('articles.show', $article));

        $response->assertInertia(fn (Assert $page) => $page->where('can.update', true));
    });
});

describe('create', function () {
    test('guests are redirected to login', function () {
        $response = $this->get(route('articles.create'));

        $response->assertRedirect(route('login'));
    });

    test('authenticated users see the editor with the existing categories', function () {
        Category::factory()->count(2)->create();

        $response = $this->actingAs(User::factory()->create())->get(route('articles.create'));

        $response->assertInertia(fn (Assert $page) => $page->component('articles/create')->has('categories', 2));
    });
});

describe('store', function () {
    test('an article is created with its cover and pool images stored as assets', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('articles.store'), articlePayload(
            pool: [['tag' => 'imgA', 'field' => 'image_2', 'displayMode' => 'float-left']],
            overrides: [
                'cover_image' => UploadedFile::fake()->image('cover.jpg'),
                'image_2' => UploadedFile::fake()->image('inline.png'),
                'image_2_display' => 'float-left',
            ],
        ));

        $article = Article::sole();
        $response->assertRedirect(route('articles.show', $article));
        expect($article->user_id)->toBe($user->id);
        expect($article->type)->toBeNull();
        expect($article->category_id)->toBeNull();
        expect($article->body['pool'][0]['field'])->toBe('image_2');
        expect($article->image_2_display)->toBe('float-left');
        expect($article->image_1_id)->toBeNull();
        expect($article->coverImage->original_filename)->toBe('cover.jpg');
        expect($article->image2->user_id)->toBe($user->id);
        Storage::disk('public')->assertExists($article->coverImage->path);
        Storage::disk('public')->assertExists($article->image2->path);
    });

    test('an empty payload is rejected', function () {
        $response = $this->actingAs(User::factory()->create())->post(route('articles.store'), []);

        $response->assertSessionHasErrors(['template', 'title', 'is_public', 'body']);
        expect(Article::count())->toBe(0);
    });

    test('an article can be given an existing category', function () {
        $category = Category::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('articles.store'), articlePayload(overrides: ['category_id' => $category->id]));

        expect(Article::sole()->category_id)->toBe($category->id);
    });

    test('a new category is created from its name, reusing one that differs only in case or spacing', function () {
        $existing = Category::factory()->create(['name' => 'Water Quality']);
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('articles.store'), articlePayload(overrides: ['new_category' => '  Stream   Flow ']));
        $this->actingAs($user)->post(route('articles.store'), articlePayload(overrides: ['new_category' => 'water quality']));

        [$first, $second] = Article::oldest('id')->get();
        expect($first->category->name)->toBe('Stream Flow');
        expect($first->category->slug)->toBe('stream-flow');
        expect($second->category_id)->toBe($existing->id);
        expect(Category::count())->toBe(2);
    });

    test('an existing and a new category cannot both be sent', function () {
        $category = Category::factory()->create();

        $response = $this->actingAs(User::factory()->create())->post(route('articles.store'), articlePayload(overrides: [
            'category_id' => $category->id,
            'new_category' => 'Other',
        ]));

        $response->assertSessionHasErrors('category_id');
        expect(Article::count())->toBe(0);
    });

    test('a new category name needs a letter or number', function () {
        $response = $this->actingAs(User::factory()->create())
            ->post(route('articles.store'), articlePayload(overrides: ['new_category' => '!!!']));

        $response->assertSessionHasErrors('new_category');
        expect(Category::count())->toBe(0);
    });

    test('a body that is not the editor json is rejected', function () {
        $response = $this->actingAs(User::factory()->create())->post(
            route('articles.store'),
            articlePayload(overrides: ['body' => '{"builder":"v1","sections":[{"type":"script"}]}']),
        );

        $response->assertSessionHasErrors(['body.builder', 'body.sections.0.type', 'body.pool']);
    });

    test('a non-image upload is rejected and nothing is stored', function () {
        $response = $this->actingAs(User::factory()->create())->post(route('articles.store'), articlePayload(overrides: [
            'cover_image' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
        ]));

        $response->assertSessionHasErrors(['cover_image' => 'The cover image field must be an image.']);
        expect(Asset::count())->toBe(0);
        expect(Storage::disk('public')->allFiles())->toBeEmpty();
    });
});

describe('update', function () {
    test('choosing no category removes it from the article', function () {
        $article = Article::factory()->categorized()->create();

        $this->actingAs($article->user)
            ->put(route('articles.update', $article), articlePayload(overrides: ['category_id' => '']));

        expect($article->fresh()->category_id)->toBeNull();
    });

    test('other users cannot update an article', function () {
        $article = Article::factory()->create();

        $response = $this->actingAs(User::factory()->create())
            ->put(route('articles.update', $article), articlePayload(overrides: ['title' => 'Hijacked']));

        $response->assertForbidden();
        expect($article->fresh()->title)->not->toBe('Hijacked');
    });

    test('uploading a new image replaces the old asset and deletes its file', function () {
        $article = Article::factory()->withCoverImage()->create();
        $oldCover = $article->coverImage;

        $response = $this->actingAs($article->user)->put(route('articles.update', $article), articlePayload(overrides: [
            'cover_image' => UploadedFile::fake()->image('new-cover.jpg'),
        ]));

        $response->assertRedirect(route('articles.show', $article));
        $article->refresh();
        expect($article->coverImage->original_filename)->toBe('new-cover.jpg');
        Storage::disk('public')->assertExists($article->coverImage->path);
        Storage::disk('public')->assertMissing($oldCover->path);
        $this->assertModelMissing($oldCover);
    });

    test('a clear flag removes the image and deletes its file', function () {
        $article = Article::factory()->withPoolImage()->create();
        $image = $article->image1;

        $this->actingAs($article->user)->put(
            route('articles.update', $article),
            articlePayload(overrides: ['clear_image_1' => '1']),
        );

        expect($article->fresh()->image_1_id)->toBeNull();
        Storage::disk('public')->assertMissing($image->path);
        $this->assertModelMissing($image);
    });

    test('images are left untouched when no file or clear flag is sent', function () {
        $article = Article::factory()->withCoverImage()->withPoolImage()->create();

        $this->actingAs($article->user)->put(route('articles.update', $article), articlePayload(
            pool: [['tag' => 'imgA', 'field' => 'image_1', 'displayMode' => 'float-right']],
            overrides: ['title' => 'Renamed', 'image_1_display' => 'float-right'],
        ));

        $article->refresh();
        expect($article->title)->toBe('Renamed');
        expect($article->image_1_display)->toBe('float-right');
        Storage::disk('public')->assertExists($article->coverImage->path);
        Storage::disk('public')->assertExists($article->image1->path);
    });

    test('the template cannot be changed after creation', function () {
        $article = Article::factory()->create();

        $this->actingAs($article->user)->put(
            route('articles.update', $article),
            articlePayload(overrides: ['template' => 'something-else']),
        );

        expect($article->fresh()->template)->toBe(ArticleTemplate::Article);
    });
});

describe('destroy', function () {
    test('other users cannot delete an article', function () {
        $article = Article::factory()->create();

        $response = $this->actingAs(User::factory()->create())->delete(route('articles.destroy', $article));

        $response->assertForbidden();
        $this->assertModelExists($article);
    });

    test('deleting an article deletes its assets and files', function () {
        $article = Article::factory()->withCoverImage()->withPoolImage()->create();
        $cover = $article->coverImage;
        $poolImage = $article->image1;

        $response = $this->actingAs($article->user)->delete(route('articles.destroy', $article));

        $response->assertRedirect(route('articles.index'));
        $this->assertModelMissing($article);
        $this->assertModelMissing($cover);
        $this->assertModelMissing($poolImage);
        Storage::disk('public')->assertMissing([$cover->path, $poolImage->path]);
    });
});

/**
 * A Guide payload. Each chapter is [id, heading, pool entries].
 *
 * @param  list<array{0: string, 1: string, 2: list<array<string, mixed>>}>  $chapters
 * @return array<string, mixed>
 */
function guidePayload(array $chapters, array $overrides = []): array
{
    return [
        'template' => 'sectioned',
        'title' => 'Calibrating a flow meter',
        'is_public' => '1',
        'body' => json_encode([
            'builder' => 'v2-chapters',
            'chapters' => array_map(fn (array $chapter) => [
                'id' => $chapter[0],
                'heading' => $chapter[1],
                'sourceLabel' => '',
                'sourceUrl' => '',
                'sections' => [['type' => 'text', 'instanceId' => 'text-1', 'content' => 'See [imgA]']],
                'pool' => $chapter[2],
            ], $chapters),
        ]),
        ...$overrides,
    ];
}

describe('simple template', function () {
    test('a simple post is stored with its subtitle and text', function () {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('articles.store'), [
            'template' => 'simple',
            'title' => 'Hello',
            'subtitle' => 'A short one',
            'is_public' => '1',
            'body' => json_encode(['builder' => 'simple', 'text' => '<b>not html</b>', 'text2' => '']),
        ]);

        $article = Article::sole();
        expect($article->template)->toBe(ArticleTemplate::Simple);
        expect($article->subtitle)->toBe('A short one');
        expect($article->body['text'])->toBe('<b>not html</b>');
    });

    test('text is required', function () {
        $response = $this->actingAs(User::factory()->create())->post(route('articles.store'), [
            'template' => 'simple',
            'title' => 'Hello',
            'is_public' => '1',
            'body' => json_encode(['builder' => 'simple', 'text' => '']),
        ]);

        $response->assertSessionHasErrors(['body.text' => 'The text field is required.']);
    });

    test('templates other than simple do not store a subtitle', function () {
        $this->actingAs(User::factory()->create())
            ->post(route('articles.store'), articlePayload(overrides: ['subtitle' => 'Ignored']));

        expect(Article::sole()->subtitle)->toBeNull();
    });
});

describe('guide template', function () {
    test('chapter images are stored as assets and referenced by id in the body', function () {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('articles.store'), guidePayload(
            [['chapter-1', 'Setup', [['tag' => 'imgA', 'displayMode' => 'block', 'uploadKey' => 'chapter-1:imgA']]]],
            ['chapter_images' => ['chapter-1:imgA' => UploadedFile::fake()->image('meter.jpg')]],
        ));

        $article = Article::sole();
        $assetId = $article->body['chapters'][0]['pool'][0]['assetId'];
        expect(Asset::find($assetId)->original_filename)->toBe('meter.jpg');
        expect($article->body['chapters'][0]['pool'][0])->not->toHaveKey('uploadKey');
        Storage::disk('public')->assertExists(Asset::find($assetId)->path);
    });

    test('an asset id supplied by the client is ignored', function () {
        $someoneElsesAsset = Asset::factory()->withFile()->create();

        $this->actingAs(User::factory()->create())->post(route('articles.store'), guidePayload(
            [['chapter-1', 'Setup', [['tag' => 'imgA', 'displayMode' => 'block', 'assetId' => $someoneElsesAsset->id]]]],
        ));

        expect(Article::sole()->body['chapters'][0]['pool'][0]['assetId'])->toBeNull();
    });

    test('show resolves chapter image urls on the server', function () {
        $article = Article::factory()->guide()->create();
        $asset = Asset::find($article->chapterAssetIds()[0]);

        $response = $this->get(route('articles.show', $article));

        $response->assertInertia(fn (Assert $page) => $page
            ->where('article.body.chapters.0.pool.0.url', $asset->url));
    });

    test('resaving without a file keeps the stored chapter image', function () {
        $article = Article::factory()->guide()->create();
        $assetId = $article->chapterAssetIds()[0];

        $this->actingAs($article->user)->put(route('articles.update', $article), guidePayload(
            [['chapter-1', 'Renamed', [['tag' => 'imgA', 'displayMode' => 'float-left']]]],
        ));

        $article->refresh();
        expect($article->chapterAssetIds())->toBe([$assetId]);
        expect($article->body['chapters'][0]['heading'])->toBe('Renamed');
    });

    test('a cleared chapter image is deleted', function () {
        $article = Article::factory()->guide()->create();
        $asset = Asset::find($article->chapterAssetIds()[0]);

        $this->actingAs($article->user)->put(route('articles.update', $article), guidePayload(
            [['chapter-1', 'Setup', [['tag' => 'imgA', 'displayMode' => 'block', 'cleared' => true]]]],
        ));

        expect($article->fresh()->chapterAssetIds())->toBe([]);
        $this->assertModelMissing($asset);
        Storage::disk('public')->assertMissing($asset->path);
    });

    test('removing a chapter deletes its images', function () {
        $article = Article::factory()->guide()->create();
        $asset = Asset::find($article->chapterAssetIds()[0]);

        $this->actingAs($article->user)->put(route('articles.update', $article), guidePayload(
            [['chapter-2', 'A different chapter', []]],
        ));

        $this->assertModelMissing($asset);
        Storage::disk('public')->assertMissing($asset->path);
    });

    test('uploading a new chapter image replaces and deletes the old one', function () {
        $article = Article::factory()->guide()->create();
        $old = Asset::find($article->chapterAssetIds()[0]);

        $this->actingAs($article->user)->put(route('articles.update', $article), guidePayload(
            [['chapter-1', 'Setup', [['tag' => 'imgA', 'displayMode' => 'block', 'uploadKey' => 'chapter-1:imgA']]]],
            ['chapter_images' => ['chapter-1:imgA' => UploadedFile::fake()->image('new.jpg')]],
        ));

        $new = Asset::find($article->fresh()->chapterAssetIds()[0]);
        expect($new->original_filename)->toBe('new.jpg');
        $this->assertModelMissing($old);
        Storage::disk('public')->assertMissing($old->path);
    });

    test('every chapter needs a heading', function () {
        $response = $this->actingAs(User::factory()->create())
            ->post(route('articles.store'), guidePayload([['chapter-1', '', []]]));

        $response->assertSessionHasErrors(['body.chapters.0.heading' => 'The chapter heading field is required.']);
    });

    test('deleting a guide deletes its chapter images', function () {
        $article = Article::factory()->guide()->create();
        $asset = Asset::find($article->chapterAssetIds()[0]);

        $this->actingAs($article->user)->delete(route('articles.destroy', $article));

        $this->assertModelMissing($asset);
        Storage::disk('public')->assertMissing($asset->path);
    });
});

describe('notes', function () {
    test('saving as a note stores a private draft without a visibility', function () {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('articles.store'), articlePayload(overrides: [
            'is_note' => '1',
            'is_public' => null,
        ]));

        $article = Article::sole();
        $response->assertRedirect(route('dashboard.notes'));
        expect($article->is_note)->toBeTrue();
        expect($article->is_public)->toBeFalse();
    });

    test('notes are left out of the article list even for their author', function () {
        $note = Article::factory()->note()->create();

        $response = $this->actingAs($note->user)->get(route('articles.index'));

        $response->assertInertia(fn (Assert $page) => $page->has('articles.data', 0));
    });

    test('a public note is still hidden from other users', function () {
        $note = Article::factory()->note()->create(['is_public' => true]);

        $response = $this->actingAs(User::factory()->create())->get(route('articles.show', $note));

        $response->assertNotFound();
    });

    test('the notes page lists only the current user\'s drafts', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $note = Article::factory()->note()->for($user)->create();
        Article::factory()->note()->create();
        Article::factory()->for($user)->create();

        $response = $this->actingAs($note->user)->get(route('dashboard.notes'));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/notes')
            ->has('notes', 1)
            ->where('notes.0.id', $note->id));
    });

    test('publishing a note makes it a post with the chosen category and visibility', function () {
        $note = Article::factory()->note()->create();
        $category = Category::factory()->create();

        $response = $this->actingAs($note->user)->post(route('articles.publish', $note), [
            'category_id' => $category->id,
            'is_public' => true,
        ]);

        $response->assertRedirect(route('articles.show', $note));
        $note->refresh();
        expect($note->is_note)->toBeFalse();
        expect($note->category_id)->toBe($category->id);
        expect($note->is_public)->toBeTrue();
    });

    test('a note can be published into a new category', function () {
        $note = Article::factory()->note()->create();

        $this->actingAs($note->user)->post(route('articles.publish', $note), [
            'new_category' => 'Field Notes',
            'is_public' => false,
        ]);

        expect($note->fresh()->category->name)->toBe('Field Notes');
    });

    test('publishing requires a visibility', function () {
        $note = Article::factory()->note()->create();

        $response = $this->actingAs($note->user)->post(route('articles.publish', $note), []);

        $response->assertSessionHasErrors('is_public');
        expect($note->fresh()->is_note)->toBeTrue();
    });

    test('other users cannot publish a note', function () {
        $note = Article::factory()->note()->create();

        $response = $this->actingAs(User::factory()->create())
            ->post(route('articles.publish', $note), ['is_public' => true]);

        $response->assertForbidden();
        expect($note->fresh()->is_note)->toBeTrue();
    });
});

describe('articles using library images', function () {
    test('a library image can be picked as an article cover', function () {
        $image = Asset::factory()->libraryItem()->withFile()->create();

        $this->actingAs(User::factory()->create())->post(route('articles.store'), [
            ...articlePayload(),
            'cover_image_asset_id' => $image->id,
        ]);

        expect(Article::sole()->cover_image_id)->toBe($image->id);
    });

    test('a guide chapter can use a picked library image', function () {
        $image = Asset::factory()->libraryItem()->withFile()->create();

        $this->actingAs(User::factory()->create())->post(route('articles.store'), guidePayload(
            [['chapter-1', 'Setup', [['tag' => 'imgA', 'displayMode' => 'block', 'pickedAssetId' => $image->id]]]],
        ));

        expect(Article::sole()->chapterAssetIds())->toBe([$image->id]);
    });

    test('only images can be picked', function () {
        $pdf = Asset::factory()->create(['category' => 'document', 'mime_type' => 'application/pdf']);

        $response = $this->actingAs(User::factory()->create())->post(route('articles.store'), [
            ...articlePayload(),
            'cover_image_asset_id' => $pdf->id,
        ]);

        $response->assertSessionHasErrors('cover_image_asset_id');
    });

    test('removing a library image from an article keeps it in the library', function () {
        $image = Asset::factory()->libraryItem()->withFile()->create();
        $article = Article::factory()->create(['cover_image_id' => $image->id]);

        $this->actingAs($article->user)->put(
            route('articles.update', $article),
            [...articlePayload(), 'clear_cover_image' => '1'],
        );

        expect($article->fresh()->cover_image_id)->toBeNull();
        $this->assertModelExists($image);
    });

    test('deleting an article keeps images another article still uses', function () {
        $shared = Asset::factory()->withFile()->create();
        $first = Article::factory()->create(['cover_image_id' => $shared->id]);
        Article::factory()->create(['cover_image_id' => $shared->id]);

        $this->actingAs($first->user)->delete(route('articles.destroy', $first));

        $this->assertModelExists($shared);
        Storage::disk('public')->assertExists($shared->path);
    });
});
