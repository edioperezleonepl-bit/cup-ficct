<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade')->comment('Docente asignado');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade')->comment('Materia asignada');
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade')->comment('Grupo asignado');
            $table->string('classroom')->comment('Aula designada, ej. Aula 102, Lab 1');
            $table->string('schedule')->comment('Horario asignado, ej. Lu-Mi-Vi 07:00-08:30');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_assignments');
    }
};
