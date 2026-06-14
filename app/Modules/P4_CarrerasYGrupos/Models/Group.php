<?php

namespace App\Modules\P4_CarrerasYGrupos\Models;

use App\Modules\P2_GestionPostulantes\Models\Postulant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo de Grupo del Curso Preuniversitario.
 * Módulo: P4_CarrerasYGrupos
 *
 * Cada grupo tiene capacidad máxima de 70 estudiantes.
 * La cantidad de grupos se calcula automáticamente:
 *   CantidadGrupos = CEIL(total_inscritos / 70)
 *
 * CU12 — Gestionar grupos del curso preuniversitario
 */
class Group extends Model
{
    protected $fillable = [
        'name',
        'student_count',
    ];

    /**
     * Relación con los postulantes asignados a este grupo.
     */
    public function postulants(): HasMany
    {
        return $this->hasMany(Postulant::class, 'grupo_id');
    }

    /**
     * Verifica si el grupo ya alcanzó la capacidad máxima de 70 estudiantes.
     */
    public function isFull(): bool
    {
        return $this->student_count >= 70;
    }
}
