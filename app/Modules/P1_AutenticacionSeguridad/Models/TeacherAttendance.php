<?php

namespace App\Modules\P1_AutenticacionSeguridad\Models;

use App\Modules\P4_CarrerasYGrupos\Models\AcademicAssignment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Asistencia de Docentes.
 * Módulo: P1_AutenticacionSeguridad
 * CU22 — Gestionar asistencia docente
 */
class TeacherAttendance extends Model
{
    protected $table = 'teacher_attendances';

    protected $fillable = [
        'assignment_id',
        'date',
        'status',
        'comments',
    ];

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(AcademicAssignment::class, 'assignment_id');
    }
}
