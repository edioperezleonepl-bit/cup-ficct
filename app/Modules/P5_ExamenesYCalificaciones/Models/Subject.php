<?php

namespace App\Modules\P5_ExamenesYCalificaciones\Models;

use App\Modules\P5_ExamenesYCalificaciones\Models\Exam;
use App\Modules\P5_ExamenesYCalificaciones\Models\SubjectAverage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo de Materia del Curso Preuniversitario.
 * Módulo: P5_ExamenesYCalificaciones
 *
 * Materias iniciales: Computación, Matemáticas, Inglés, Física.
 * CU09 — Gestionar materias y exámenes
 */
class Subject extends Model
{
    protected $fillable = [
        'name',
    ];

    /**
     * Relación con los exámenes registrados para esta materia.
     */
    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class, 'subject_id');
    }

    /**
     * Relación con los promedios calculados por materia.
     */
    public function averages(): HasMany
    {
        return $this->hasMany(SubjectAverage::class, 'subject_id');
    }
}
