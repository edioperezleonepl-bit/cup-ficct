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
        Schema::create('postulants', function (Blueprint $table) {
            $table->id();
            $table->string('ci')->unique()->comment('Cédula de Identidad única del postulante');
            $table->string('nombres');
            $table->string('apellidos');
            $table->date('fecha_nacimiento');
            $table->char('sexo', 1)->comment('M = Masculino, F = Femenino');
            $table->string('direccion');
            $table->string('telefono');
            $table->string('correo_electronico')->unique();
            $table->string('colegio_procedencia');
            $table->string('ciudad');
            $table->boolean('titulo_bachiller')->default(false)->comment('Indica si el postulante ya presentó su título de bachiller');
            
            // Opciones de carrera
            $table->foreignId('carrera_opcion1_id')->constrained('careers')->onDelete('cascade');
            $table->foreignId('carrera_opcion2_id')->constrained('careers')->onDelete('cascade');
            $table->foreignId('carrera_admitida_id')->nullable()->constrained('careers')->onDelete('set null');
            
            // Estado y asignación de grupo
            $table->enum('estado_admision', ['PENDIENTE', 'ADMITIDO', 'NO_ADMITIDO', 'REPROBADO'])->default('PENDIENTE');
            $table->foreignId('grupo_id')->nullable()->constrained('groups')->onDelete('set null');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('postulants');
    }
};
