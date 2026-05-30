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
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('postulant_id')->constrained('postulants')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->integer('exam_number')->comment('Número de examen del 1 al 3');
            $table->decimal('grade', 5, 2)->comment('Nota obtenida entre 0.00 y 100.00');
            $table->timestamps();

            // Clave única para evitar duplicidades
            $table->unique(['postulant_id', 'subject_id', 'exam_number']);
        });

        // PostgreSQL CHECK constraints para validación estricta a nivel de Base de Datos
        DB::statement('ALTER TABLE exams ADD CONSTRAINT chk_exam_number CHECK (exam_number IN (1, 2, 3))');
        DB::statement('ALTER TABLE exams ADD CONSTRAINT chk_grade CHECK (grade >= 0 AND grade <= 100)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
