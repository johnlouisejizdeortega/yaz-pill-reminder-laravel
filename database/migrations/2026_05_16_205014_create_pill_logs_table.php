<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('pill_logs')) return;
        Schema::create('pill_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reminder_id')->constrained()->cascadeOnDelete();
            $table->date('log_date');
            $table->boolean('taken');
            $table->timestamps();

            $table->unique(['reminder_id', 'log_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pill_logs');
    }
};
