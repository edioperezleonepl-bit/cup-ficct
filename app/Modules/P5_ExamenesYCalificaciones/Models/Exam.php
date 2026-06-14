<?php

namespace App\Modules\P5_ExamenesYCalificaciones\Models;

use App\Modules\P2_GestionPostulantes\Models\Postulant;
use App\Modules\P5_ExamenesYCalificaciones\Models\Subject;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Examen individual.
 * Módulo: P5_ExamenesYCalificaciones
 *
 * Cada postulante rinde 3 exámenes por materia.
 * Notas válidas: 0 a 100 puntos.
 * CU10 — Gestionar calificaciones
 */
class Exam extends Model
{
    protected $fillable = [
        'postulant_id',
        'subject_id',
        'exam_number',
        'grade',
    ];

    protected $casts = [
        'grade'       => 'decimal:2',
        'exam_number' => 'integer',
    ];

    /**
     * Relación con el postulante al que pertenece la nota.
     */
    public function postulant(): BelongsTo
    {
        return $this->belongsTo(Postulant::class, 'postulant_id');
    }

    /**
     * Relación con la materia evaluada.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
