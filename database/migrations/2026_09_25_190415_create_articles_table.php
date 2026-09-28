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
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('post');
            $table->string('template')->default('prototype');
            $table->string('title');
            $table->json('body');
            $table->boolean('is_public')->default(true);
            $table->string('source_label')->nullable();
            $table->string('source_url')->nullable();

            $table->foreignId('cover_image_id')->nullable()->constrained('assets')->nullOnDelete();

            foreach (range(1, 5) as $slot) {
                $table->foreignId("image_{$slot}_id")->nullable()->constrained('assets')->nullOnDelete();
                $table->string("image_{$slot}_display", 20)->default('block');
            }

            $table->timestamps();

            $table->index(['type', 'is_public', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
