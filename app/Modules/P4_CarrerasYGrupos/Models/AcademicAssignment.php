<?php

namespace App\Modules\P4_CarrerasYGrupos\Models;

use App\Modules\P1_AutenticacionSeguridad\Models\User;
use App\Modules\P5_ExamenesYCalificaciones\Models\Subject;
use App\Modules\P4_CarrerasYGrupos\Models\Group;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Asignación Académica de Docentes a grupos, materias, horarios y aulas.
 * Módulo: P4_CarrerasYGrupos
 * CU14 — Gestionar asignación académica
 */
class AcademicAssignment extends Model
{
    protected $fillable = [
        'user_id',
        'subject_id',
        'group_id',
        'classroom',
        'schedule',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'group_id');
    }
}
