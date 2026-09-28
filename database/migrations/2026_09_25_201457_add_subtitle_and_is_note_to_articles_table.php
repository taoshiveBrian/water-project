<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('subtitle')->nullable()->after('title');
            $table->boolean('is_note')->default(false)->after('is_public');
        });

        DB::table('articles')->where('template', 'prototype')->update(['template' => 'article']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('articles')->where('template', 'article')->update(['template' => 'prototype']);

        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['subtitle', 'is_note']);
        });
    }
};
