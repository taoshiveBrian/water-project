<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DatasetController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\Media\MediaController;
use App\Http\Controllers\Media\MediaPickerController;
use App\Http\Controllers\Media\MediaProcessingController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::inertia('map', 'map')->name('map');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::inertia('dashboard/extra-info', 'dashboard/extra-info')->name('dashboard.extra-info');
    Route::get('dashboard/notes', [ArticleController::class, 'notes'])->name('dashboard.notes')->can('view-notes');

    Route::get('dashboard/media', [MediaController::class, 'index'])->name('dashboard.media');
    Route::prefix('dashboard/media')->name('media.')->group(function () {
        Route::get('picker', MediaPickerController::class)->name('picker');
        Route::post('/', [MediaController::class, 'store'])->name('store');
        Route::put('settings', [MediaController::class, 'updateSettings'])->name('settings.update');
        Route::post('bulk-delete', [MediaController::class, 'bulkDestroy'])->name('bulk-destroy');
        Route::post('bulk-folder', [MediaController::class, 'bulkFolder'])->name('bulk-folder');
        Route::post('bulk-process', [MediaProcessingController::class, 'bulk'])->name('bulk-process');
        Route::post('process-all', [MediaProcessingController::class, 'all'])->name('process-all');
        Route::patch('{asset}', [MediaController::class, 'update'])->name('update');
        Route::delete('{asset}', [MediaController::class, 'destroy'])->name('destroy');
        Route::post('{asset}/process', [MediaProcessingController::class, 'single'])->name('process');
    });

    Route::resource('articles', ArticleController::class)->except(['index', 'show']);
    Route::post('articles/{article}/publish', [ArticleController::class, 'publish'])->name('articles.publish');

    Route::get('datasets/{dataset}', [DatasetController::class, 'show'])->name('datasets.show');
    Route::post('datasets/{dataset}/sync', [DatasetController::class, 'sync'])->name('datasets.sync');
    Route::delete('datasets/{dataset}', [DatasetController::class, 'destroy'])->name('datasets.destroy');
});

Route::resource('articles', ArticleController::class)->only(['index', 'show']);

require __DIR__.'/settings.php';
