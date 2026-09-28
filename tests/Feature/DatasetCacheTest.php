<?php

use App\Models\User;
use Tests\Fixtures\NumberedRowsSource;

beforeEach(function () {
    config(['datasets.sources' => ['readings' => NumberedRowsSource::class]]);
});

test('returns 401 for guests', function () {
    $response = $this->getJson(route('datasets.show', 'readings'));

    $response->assertUnauthorized();
});

test('an unknown dataset returns 404', function () {
    $response = $this->actingAs(User::factory()->create())->getJson(route('datasets.show', 'nope'));

    $response->assertNotFound();
});

test('a dataset that was never synced reports not synced', function () {
    $response = $this->actingAs(User::factory()->create())->getJson(route('datasets.show', 'readings'));

    $response->assertExactJson(['synced' => false, 'synced_at' => null, 'paginator' => null]);
});

test('a synced dataset is served from the cache one page at a time', function () {
    $this->travelTo('2026-09-25 12:00:00');
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('datasets.sync', 'readings'))
        ->assertExactJson(['count' => 240, 'synced_at' => '2026-09-25T12:00:00+00:00']);
    $response = $this->actingAs($user)->getJson(route('datasets.show', ['readings', 'page' => 5]));

    $response->assertJsonPath('synced', true)
        ->assertJsonPath('synced_at', '2026-09-25T12:00:00+00:00')
        ->assertJsonPath('paginator.current_page', 5)
        ->assertJsonPath('paginator.last_page', 5)
        ->assertJsonPath('paginator.total', 240)
        ->assertJsonCount(40, 'paginator.data')
        ->assertJsonPath('paginator.data.0.number', 200);
});

test('each scope is cached independently', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson(route('datasets.sync', ['readings', 'scope' => 'north']));
    $north = $this->actingAs($user)->getJson(route('datasets.show', ['readings', 'scope' => 'north']));
    $south = $this->actingAs($user)->getJson(route('datasets.show', ['readings', 'scope' => 'south']));

    $north->assertJsonPath('paginator.data.0.scope', 'north');
    $south->assertJsonPath('synced', false);
});

test('a snapshot expires at the end of its ttl window even while being read', function () {
    config(['datasets.ttl_minutes' => 20]);
    $user = User::factory()->create();
    $this->actingAs($user)->postJson(route('datasets.sync', 'readings'));

    $this->travel(19)->minutes();
    $this->actingAs($user)->getJson(route('datasets.show', 'readings'))->assertJsonPath('synced', true);
    $this->travel(2)->minutes();
    $response = $this->actingAs($user)->getJson(route('datasets.show', 'readings'));

    $response->assertJsonPath('synced', false);
});

test('forgetting a dataset clears its snapshot', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->postJson(route('datasets.sync', 'readings'));

    $this->actingAs($user)->deleteJson(route('datasets.destroy', 'readings'));

    $this->actingAs($user)->getJson(route('datasets.show', 'readings'))->assertJsonPath('synced', false);
});

test('a scope that is not route safe is rejected', function () {
    $response = $this->actingAs(User::factory()->create())
        ->postJson(route('datasets.sync', ['readings', 'scope' => '../etc']));

    $response->assertUnprocessable()->assertJsonValidationErrors(['scope' => 'The scope field must only contain letters, numbers, dashes, and underscores.']);
});
