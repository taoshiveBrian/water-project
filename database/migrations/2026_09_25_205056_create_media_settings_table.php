<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. A single-row table; see MediaSettings::current().
     */
    public function up(): void
    {
        Schema::create('media_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('processing_enabled')->default(true);
            $table->boolean('compress_images')->default(true);
            $table->unsignedTinyInteger('compression_quality')->default(85);
            $table->json('sizes');
            $table->string('processing_method', 20)->default('immediate');
            $table->json('allowed_mime_types');
            $table->unsignedInteger('max_file_size')->default(10240);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_settings');
    }
};
