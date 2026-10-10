<?php

use App\Models\Article;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('the dashboard shows the three newest articles the user can see, without notes', function () {
    Article::factory()->create(['created_at' => now()->subDays(3)]);
    $newest = Article::factory()->count(3)->sequence(
        ['created_at' => now()->subDays(2)],
        ['created_at' => now()->subDay()],
        ['created_at' => now()],
    )->create();
    Article::factory()->note()->create();

    $response = $this->actingAs(User::factory()->create())->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('latestArticles', 3)
        ->where('latestArticles.0.id', $newest[2]->id)
        ->where('latestArticles.2.id', $newest[0]->id));
});

test('guests are redirected from the extra info page', function () {
    $response = $this->get(route('dashboard.extra-info'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the extra info page', function () {
    $this->actingAs(User::factory()->create());

    $response = $this->get(route('dashboard.extra-info'));
    $response->assertInertia(fn ($page) => $page->component('dashboard/extra-info'));
});

test('guests can visit the map page', function () {
    $response = $this->get(route('map'));
    $response->assertInertia(fn ($page) => $page->component('map'));
});

test('allowed users can visit the notes page and see its sidebar link', function () {
    config(['app.admin_emails' => ['admin@example.com']]);
    $this->actingAs(User::factory()->create(['email' => 'Admin@example.com']));

    $response = $this->get(route('dashboard.notes'));
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard/notes')
        ->where('auth.canViewNotes', true));
});

test('other users are forbidden from the notes page and do not see its sidebar link', function () {
    $this->actingAs(User::factory()->create(['email' => 'someone@example.com']));

    $this->get(route('dashboard.notes'))->assertForbidden();
    $this->get(route('dashboard'))->assertInertia(fn ($page) => $page->where('auth.canViewNotes', false));
});
