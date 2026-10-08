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
        Schema::table('users', function (Blueprint $table) {
            $table->text('profile_text')->nullable()->after('email');
            $table->string('link_1', 2048)->nullable()->after('profile_text');
            $table->string('link_2', 2048)->nullable()->after('link_1');
            $table->string('link_3', 2048)->nullable()->after('link_2');
            $table->foreignId('avatar_id')->nullable()->after('link_3')->constrained('assets')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('avatar_id');
            $table->dropColumn(['profile_text', 'link_1', 'link_2', 'link_3']);
        });
    }
};
