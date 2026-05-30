<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subject_averages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('postulant_id')->constrained('postulants')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->decimal('average', 5, 2)->comment('Promedio final de la materia (Ex1+Ex2+Ex3)/3');
            $table->enum('status', ['APROBADO', 'REPROBADO'])->comment('APROBADO si average >= 60, sino REPROBADO');
            $table->timestamps();

            // Un solo promedio por postulante por materia
            $table->unique(['postulant_id', 'subject_id']);
        });

        // PostgreSQL CHECK constraint para asegurar que el promedio está entre 0 y 100
        DB::statement('ALTER TABLE subject_averages ADD CONSTRAINT chk_average CHECK (average >= 0 AND average <= 100)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_averages');
    }
};
