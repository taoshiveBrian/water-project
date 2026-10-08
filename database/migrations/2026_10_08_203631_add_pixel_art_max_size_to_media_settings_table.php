<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('media_settings', function (Blueprint $table) {
            $table->unsignedInteger('pixel_art_max_size')->default(5)->after('max_file_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_settings', function (Blueprint $table) {
            $table->dropColumn('pixel_art_max_size');
        });
    }
};
