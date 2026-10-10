<?php

use App\Enums\ProcessingMethod;
use App\Enums\ProcessingStatus;
use App\Jobs\ProcessImageJob;
use App\Models\Article;
use App\Models\Asset;
use App\Models\MediaSettings;
use App\Models\User;
use App\Services\ImageProcessingService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
});

/**
 * Upload files to the library as a new user and return the created assets.
 *
 * @param  list<UploadedFile>  $files
 */
function uploadToLibrary(array $files, array $extra = []): TestResponse
{
    return test()->actingAs(User::factory()->create())
        ->post(route('media.store'), ['files' => $files, ...$extra]);
}

/**
 * @return array{0: int, 1: int, 2: string} width, height, mime type
 */
function imageInfo(string $path): array
{
    $info = getimagesizefromstring(Storage::disk('public')->get($path));

    return [$info[0], $info[1], $info['mime']];
}

describe('access', function () {
    test('guests are redirected from the media library', function () {
        $this->get(route('dashboard.media'))->assertRedirect(route('login'));
    });

    test('signed-in users see the gallery with usage for each file', function () {
        $article = Article::factory()->withCoverImage()->create();

        $response = $this->actingAs(User::factory()->create())->get(route('dashboard.media'));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/media')
            ->has('assets.data', 1)
            ->where('assets.data.0.usage.0.id', $article->id));
    });

    test('private assets and their folder are shown only to admins', function () {
        $owner = User::factory()->create();
        $private = Asset::factory()->create(['user_id' => $owner->id, 'is_private' => true, 'subcategory' => 'user_avatars']);

        $this->actingAs($owner)->get(route('dashboard.media'))
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 0)->has('folders', 0));
        $this->actingAs($owner)->delete(route('media.destroy', $private))->assertNotFound();
        $this->actingAs($owner)->getJson(route('media.picker'))->assertJsonCount(0, 'data');

        config(['app.admin_emails' => ['test@example.com']]);
        $this->actingAs(User::factory()->create(['email' => 'test@example.com']))->get(route('dashboard.media'))
            ->assertInertia(fn (Assert $page) => $page->has('assets.data', 1)->where('folders.0', 'user_avatars'));
    });
});

describe('processing', function () {
    test('an uploaded image keeps its original and gets compressed with size variants', function () {
        uploadToLibrary([UploadedFile::fake()->image('river.jpg', 2400, 1600)], ['folder' => 'site-photos']);

        $asset = Asset::sole();
        expect($asset->is_library_item)->toBeTrue();
        expect($asset->category)->toBe('image');
        expect($asset->subcategory)->toBe('site-photos');
        expect($asset->processing_status)->toBe(ProcessingStatus::Completed);
        expect(array_keys($asset->sizes))->toBe(['thumbnail', 'medium', 'large']);
        Storage::disk('public')->assertExists([$asset->path, $asset->original_path, ...array_values($asset->sizes)]);
        expect(imageInfo($asset->sizes['thumbnail']))->toBe([300, 300, 'image/jpeg']);
        expect(imageInfo($asset->sizes['medium']))->toBe([800, 533, 'image/jpeg']);
        expect(imageInfo($asset->original_path))->toBe([2400, 1600, 'image/jpeg']);
    });

    test('small images are never enlarged', function () {
        uploadToLibrary([UploadedFile::fake()->image('small.jpg', 400, 300)]);

        $asset = Asset::sole();

        expect(imageInfo($asset->sizes['large']))->toBe([400, 300, 'image/jpeg']);
    });

    test('a png stays a png', function () {
        uploadToLibrary([UploadedFile::fake()->image('chart.png', 1200, 900)]);

        $asset = Asset::sole();

        expect(imageInfo($asset->path)[2])->toBe('image/png');
        expect(imageInfo($asset->sizes['medium'])[2])->toBe('image/png');
    });

    test('gifs are left untouched', function () {
        uploadToLibrary([UploadedFile::fake()->image('loop.gif', 500, 500)]);

        $asset = Asset::sole();

        expect($asset->processing_status)->toBe(ProcessingStatus::Completed);
        expect($asset->original_path)->toBeNull();
        expect($asset->sizes)->toBeNull();
    });

    test('reprocessing rebuilds from the original instead of recompressing', function () {
        uploadToLibrary([UploadedFile::fake()->image('river.jpg', 1600, 1200)]);
        $asset = Asset::sole();
        $firstServed = Storage::disk('public')->get($asset->path);

        $this->actingAs(User::factory()->create())->post(route('media.process', $asset));

        expect(Storage::disk('public')->get($asset->fresh()->path))->toBe($firstServed);
    });

    test('queue mode leaves the image pending and dispatches a job', function () {
        Queue::fake();
        MediaSettings::current()->update(['processing_method' => ProcessingMethod::Queue]);

        uploadToLibrary([UploadedFile::fake()->image('river.jpg')]);

        expect(Asset::sole()->processing_status)->toBe(ProcessingStatus::Pending);
        Queue::assertPushed(ProcessImageJob::class);
    });

    test('an unreadable image is marked failed with the reason', function () {
        $asset = Asset::factory()->create(['mime_type' => 'image/jpeg']);
        Storage::disk('public')->put($asset->path, 'not an image');

        app(ImageProcessingService::class)->process($asset);

        expect($asset->fresh()->processing_status)->toBe(ProcessingStatus::Failed);
        expect($asset->fresh()->processing_error)->not->toBeEmpty();
    });
});

describe('uploads', function () {
    test('file types not allowed in settings are rejected', function () {
        MediaSettings::current()->update(['allowed_mime_types' => ['image/jpeg']]);

        $response = uploadToLibrary([UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')]);

        $response->assertSessionHasErrors('files.0');
        expect(Asset::count())->toBe(0);
    });

    test('files over the size limit are rejected', function () {
        MediaSettings::current()->update(['max_file_size' => 100]);

        $response = uploadToLibrary([UploadedFile::fake()->create('big.pdf', 200, 'application/pdf')]);

        $response->assertSessionHasErrors(['files.0' => 'The file field must not be greater than 100 kilobytes.']);
    });

    test('a folder must be path safe', function () {
        $response = uploadToLibrary([UploadedFile::fake()->image('a.jpg')], ['folder' => '../etc']);

        $response->assertSessionHasErrors('folder');
    });
});

describe('editing and deleting', function () {
    test('details can be updated', function () {
        $asset = Asset::factory()->libraryItem()->create();

        $this->actingAs(User::factory()->create())->patch(route('media.update', $asset), [
            'title' => 'Rio Grande gorge',
            'alt_text' => 'River in a canyon',
            'subcategory' => 'landscapes',
            'is_featured' => true,
        ]);

        expect($asset->fresh())
            ->title->toBe('Rio Grande gorge')
            ->alt_text->toBe('River in a canyon')
            ->subcategory->toBe('landscapes')
            ->is_featured->toBeTrue();
    });

    test('deleting removes the served file, original and every size', function () {
        uploadToLibrary([UploadedFile::fake()->image('river.jpg', 1600, 1200)]);
        $asset = Asset::sole();
        $paths = $asset->storedPaths();

        $this->actingAs(User::factory()->create())->delete(route('media.destroy', $asset));

        $this->assertModelMissing($asset);
        expect($paths)->toHaveCount(5);
        Storage::disk('public')->assertMissing($paths);
    });

    test('a file used by an article cannot be deleted', function () {
        $article = Article::factory()->withCoverImage()->create();

        $this->actingAs(User::factory()->create())->delete(route('media.destroy', $article->coverImage));

        $this->assertModelExists($article->coverImage);
    });

    test('bulk delete skips files that articles use', function () {
        $used = Article::factory()->withCoverImage()->create()->coverImage;
        $unused = Asset::factory()->libraryItem()->withFile()->create();

        $this->actingAs(User::factory()->create())->post(route('media.bulk-destroy'), [
            'ids' => [$used->id, $unused->id],
        ]);

        $this->assertModelExists($used);
        $this->assertModelMissing($unused);
    });

    test('guide chapter images count as in use', function () {
        $guide = Article::factory()->guide()->create();
        $asset = Asset::find($guide->chapterAssetIds()[0]);

        $this->actingAs(User::factory()->create())->delete(route('media.destroy', $asset));

        $this->assertModelExists($asset);
    });
});

describe('settings', function () {
    test('settings are saved', function () {
        $this->actingAs(User::factory()->create())->put(route('media.settings.update'), [
            'processing_enabled' => true,
            'compress_images' => false,
            'compression_quality' => 70,
            'processing_method' => 'queue',
            'max_file_size' => 5000,
            'pixel_art_max_size' => 3,
            'allowed_mime_types' => ['image/jpeg', 'image/png'],
            'sizes' => [['name' => 'banner', 'width' => 1200, 'height' => 400, 'crop' => true, 'enabled' => true]],
        ])->assertSessionHasNoErrors();

        $settings = MediaSettings::current();
        expect($settings->compress_images)->toBeFalse();
        expect($settings->processing_method)->toBe(ProcessingMethod::Queue);
        expect($settings->sizes[0]['name'])->toBe('banner');
        expect($settings->pixel_art_max_size)->toBe(3);
    });

    test('images up to the pixel art size are served from their original file', function () {
        $files = ['original_path' => 'assets/image/originals/a.png', 'sizes' => ['thumbnail' => 'assets/image/sizes/thumbnail_a.png']];
        $pixelArt = Asset::factory()->create(['file_size' => 5 * 1024, ...$files]);
        $photo = Asset::factory()->create(['file_size' => 5 * 1024 + 1, ...$files]);

        expect($pixelArt->isPixelArt())->toBeTrue();
        expect($pixelArt->thumbnail_url)->toEndWith('originals/a.png');
        expect($photo->isPixelArt())->toBeFalse();
        expect($photo->thumbnail_url)->toEndWith('thumbnail_a.png');
    });

    test('a size needs a width or a height', function () {
        $response = $this->actingAs(User::factory()->create())->put(route('media.settings.update'), [
            ...MediaSettings::defaults(),
            'processing_method' => 'immediate',
            'sizes' => [['name' => 'broken', 'width' => null, 'height' => null, 'crop' => false, 'enabled' => true]],
        ]);

        $response->assertSessionHasErrors(['sizes.0.width', 'sizes.0.height']);
    });
});

describe('picker', function () {
    test('lists only images', function () {
        $image = Asset::factory()->create();
        Asset::factory()->create(['category' => 'document', 'mime_type' => 'application/pdf']);

        $response = $this->actingAs(User::factory()->create())->getJson(route('media.picker'));

        $response->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $image->id);
    });
});
