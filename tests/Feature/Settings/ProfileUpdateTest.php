<?php

use App\Models\Asset;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('profile text and links can be updated, and links must be urls', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->patch(route('profile.update'), [
        'name' => $user->name,
        'email' => $user->email,
        'profile_text' => 'Hydrologist.',
        'link_1' => 'https://github.com/example',
    ])->assertSessionHasNoErrors();

    expect($user->refresh())
        ->profile_text->toBe('Hydrologist.')
        ->link_1->toBe('https://github.com/example');

    $this->actingAs($user)->patch(route('profile.update'), [
        'name' => $user->name,
        'email' => $user->email,
        'link_2' => 'javascript:alert(1)',
    ])->assertSessionHasErrors('link_2');
});

test('an uploaded avatar is private, and choosing a shared avatar deletes it', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $shared = Asset::factory()->libraryItem()->create(['subcategory' => 'Avatars']);
    Asset::factory()->libraryItem()->create(['subcategory' => 'articles']);

    $this->actingAs($user)->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->missing('avatarChoices')
            ->reloadOnly('avatarChoices', fn (Assert $reload) => $reload
                ->has('avatarChoices', 1)
                ->where('avatarChoices.0.id', $shared->id)));

    $this->actingAs($user)->post(route('avatar.update'), ['avatar' => UploadedFile::fake()->image('a.jpg')])
        ->assertRedirect(route('profile.edit'));

    $uploaded = $user->refresh()->avatarImage;

    expect($uploaded)
        ->subcategory->toBe('user_avatars')
        ->is_private->toBeTrue()
        ->user_id->toBe($user->id);
    expect($user->avatar)->toBe($uploaded->thumbnail_url);

    $this->actingAs($user)->put(route('avatar.choose'), ['asset_id' => $shared->id]);

    expect($user->refresh()->avatar_id)->toBe($shared->id);
    expect(Asset::find($uploaded->id))->toBeNull();

    $this->actingAs(User::factory()->create())->put(route('avatar.choose'), ['asset_id' => $shared->id]);

    expect(Asset::find($shared->id))->not->toBeNull();
});

test('a pixel art avatar is flagged and shown from the full file', function () {
    $tiny = Asset::factory()->libraryItem()->create(['subcategory' => 'Avatars', 'file_size' => 600]);
    $user = User::factory()->create();

    $this->actingAs($user)->put(route('avatar.choose'), ['asset_id' => $tiny->id]);

    expect($user->refresh())
        ->avatar->toBe($tiny->url)
        ->avatar_pixelated->toBeTrue();
});

test('a private avatar cannot be chosen by another user', function () {
    $private = Asset::factory()->create(['subcategory' => 'Avatars', 'is_private' => true]);

    $this->actingAs(User::factory()->create())->put(route('avatar.choose'), ['asset_id' => $private->id])
        ->assertSessionHasErrors('asset_id');
});

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});
