<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
