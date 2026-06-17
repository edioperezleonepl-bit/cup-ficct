<?php

namespace App\Modules\P2_GestionPostulantes\Models;

use App\Modules\P4_CarrerasYGrupos\Models\Career;
use App\Modules\P4_CarrerasYGrupos\Models\Group;
use App\Modules\P5_ExamenesYCalificaciones\Models\Exam;
use App\Modules\P5_ExamenesYCalificaciones\Models\SubjectAverage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo de Postulante al Curso Pre-universitario de la FICCT.
 * Módulo: P2_GestionPostulantes
 *
 * Centraliza todos los datos personales, de requisitos, pago,
 * carrera, grupo y estado de admisión del aspirante.
 */
class Postulant extends Model
{
    protected $fillable = [
        'ci',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'sexo',
        'direccion',
        'telefono',
        'correo_electronico',
        'colegio_procedencia',
        'ciudad',
        'titulo_bachiller',
        'pago_realizado',
        'transaccion_pago_id',
        'monto_pagado',
        'carrera_opcion1_id',
        'carrera_opcion2_id',
        'carrera_admitida_id',
        'estado_admision',
        'grupo_id',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'titulo_bachiller' => 'boolean',
        'pago_realizado'   => 'boolean',
    ];

    // ─── Relaciones con Carreras (M4) ────────────────────────────────────────

    /**
     * Relación con la primera opción de carrera elegida por el postulante.
     */
    public function carreraOpcion1(): BelongsTo
    {
        return $this->belongsTo(Career::class, 'carrera_opcion1_id');
    }

    /**
     * Relación con la segunda opción de carrera elegida por el postulante.
     */
    public function carreraOpcion2(): BelongsTo
    {
        return $this->belongsTo(Career::class, 'carrera_opcion2_id');
    }

    /**
     * Relación con la carrera finalmente admitida (si aplica).
     */
    public function carreraAdmitida(): BelongsTo
    {
        return $this->belongsTo(Career::class, 'carrera_admitida_id');
    }

    // ─── Relación con Grupo (M4) ──────────────────────────────────────────────

    /**
     * Relación con el grupo de clase asignado al postulante.
     */
    public function grupo(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'grupo_id');
    }

    // ─── Relaciones con Exámenes y Promedios (M5) ────────────────────────────

    /**
     * Relación con los exámenes individuales registrados por materia.
     */
    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class, 'postulant_id');
    }

    /**
     * Relación con los promedios calculados por materia.
     */
    public function subjectAverages(): HasMany
    {
        return $this->hasMany(SubjectAverage::class, 'postulant_id');
    }

    /**
     * Relación con los registros de asistencia del postulante.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(PostulantAttendance::class, 'postulant_id');
    }
}
