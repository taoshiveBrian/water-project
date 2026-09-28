<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
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

test('guests are redirected from the map page', function () {
    $response = $this->get(route('dashboard.map'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the map page', function () {
    $this->actingAs(User::factory()->create());

    $response = $this->get(route('dashboard.map'));
    $response->assertInertia(fn ($page) => $page->component('dashboard/map'));
});
