<?php

namespace App\Modules\P5_ExamenesYCalificaciones\Models;

use App\Modules\P2_GestionPostulantes\Models\Postulant;
use App\Modules\P5_ExamenesYCalificaciones\Models\Subject;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Promedio por Materia del Postulante.
 * Módulo: P5_ExamenesYCalificaciones
 *
 * Almacena el promedio calculado automáticamente para cada materia.
 * Estado: APROBADO (>= 60) | REPROBADO (< 60)
 * CU11 — Procesar resultados académicos
 */
class SubjectAverage extends Model
{
    protected $table = 'subject_averages';

    protected $fillable = [
        'postulant_id',
        'subject_id',
        'average',
        'status',
    ];

    protected $casts = [
        'average' => 'decimal:2',
    ];

    /**
     * Relación con el postulante asociado al promedio.
     */
    public function postulant(): BelongsTo
    {
        return $this->belongsTo(Postulant::class, 'postulant_id');
    }

    /**
     * Relación con la materia correspondiente al promedio.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
