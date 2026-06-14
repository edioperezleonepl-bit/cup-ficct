<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('value');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Sembrar valores por defecto
        DB::table('settings')->insert([
            ['key' => 'passing_grade', 'value' => '60', 'description' => 'Nota mínima para aprobar el curso preuniversitario (CU11)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'max_group_capacity', 'value' => '70', 'description' => 'Capacidad máxima de alumnos por grupo (CU12)', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
