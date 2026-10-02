<?php

use App\Models\Article;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests see the six newest public articles', function () {
    $public = Article::factory()->count(7)->sequence(fn ($sequence) => [
        'created_at' => now()->subDays(7 - $sequence->index),
    ])->create();
    Article::factory()->membersOnly()->create();
    Article::factory()->note()->create();

    $response = $this->get(route('home'));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->has('articles', 6)
        ->where('articles.0.id', $public[6]->id)
        ->where('articles.5.id', $public[1]->id));
});

test('logged-in users also see members-only articles, newest first', function () {
    $public = Article::factory()->create(['created_at' => now()->subDay()]);
    $membersOnly = Article::factory()->membersOnly()->create();
    Article::factory()->note()->create();

    $response = $this->actingAs(User::factory()->create())->get(route('home'));

    $response->assertInertia(fn (Assert $page) => $page
        ->has('articles', 2)
        ->where('articles.0.id', $membersOnly->id)
        ->where('articles.1.id', $public->id));
});
