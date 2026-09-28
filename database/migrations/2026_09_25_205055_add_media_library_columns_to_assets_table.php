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
        Schema::table('assets', function (Blueprint $table) {
            $table->string('original_path')->nullable()->after('path');
            $table->json('sizes')->nullable()->after('original_path');
            $table->bigInteger('optimized_size')->nullable()->after('file_size');
            $table->string('processing_status', 20)->default('completed')->after('metadata');
            $table->text('processing_error')->nullable()->after('processing_status');
            $table->boolean('is_featured')->default(false)->after('processing_error');
            $table->boolean('is_library_item')->default(false)->after('is_featured');

            $table->index('processing_status');
            $table->index('is_featured');
        });

        DB::table('assets')->where('category', 'images')->update(['category' => 'image']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('assets')->where('category', 'image')->update(['category' => 'images']);

        Schema::table('assets', function (Blueprint $table) {
            $table->dropIndex(['processing_status']);
            $table->dropIndex(['is_featured']);
            $table->dropColumn([
                'original_path', 'sizes', 'optimized_size', 'processing_status',
                'processing_error', 'is_featured', 'is_library_item',
            ]);
        });
    }
};
