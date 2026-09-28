<?php

use App\Models\Asset;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

test('files with no asset row are deleted and tracked files are kept', function () {
    $asset = Asset::factory()->withFile()->create();
    Storage::disk('public')->put('assets/images/orphan.jpg', 'x');
    Storage::disk('public')->put('elsewhere/untouched.jpg', 'x');

    $this->artisan('files:cleanup')->expectsOutput('Deleted 1 orphaned files.')->assertSuccessful();

    Storage::disk('public')->assertMissing('assets/images/orphan.jpg');
    Storage::disk('public')->assertExists([$asset->path, 'elsewhere/untouched.jpg']);
});

test('a dry run lists orphaned files without deleting them', function () {
    Storage::disk('public')->put('assets/images/orphan.jpg', 'x');

    $this->artisan('files:cleanup --dry-run')
        ->expectsOutput('assets/images/orphan.jpg')
        ->expectsOutput('Found 1 orphaned files.')
        ->assertSuccessful();

    Storage::disk('public')->assertExists('assets/images/orphan.jpg');
});
