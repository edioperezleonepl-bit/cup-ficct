<?php

namespace App\Modules\P4_CarrerasYGrupos\Models;

use App\Modules\P2_GestionPostulantes\Models\Postulant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo de Carrera Universitaria.
 * Módulo: P4_CarrerasYGrupos
 *
 * Gestiona los cupos disponibles y los postulantes admitidos por carrera.
 * CU07 — Gestionar carreras y cupos
 * CU08 — Asignar carrera según cupos disponibles
 */
class Career extends Model
{
    protected $fillable = [
        'name',
        'capacity',
        'admitted_count',
    ];

    /**
     * Relación con los postulantes que eligieron esta carrera como primera opción.
     */
    public function postulantsOption1(): HasMany
    {
        return $this->hasMany(Postulant::class, 'carrera_opcion1_id');
    }

    /**
     * Relación con los postulantes que eligieron esta carrera como segunda opción.
     */
    public function postulantsOption2(): HasMany
    {
        return $this->hasMany(Postulant::class, 'carrera_opcion2_id');
    }

    /**
     * Relación con los postulantes finalmente admitidos en esta carrera.
     */
    public function admittedPostulants(): HasMany
    {
        return $this->hasMany(Postulant::class, 'carrera_admitida_id');
    }

    /**
     * Verifica si la carrera aún cuenta con cupos disponibles.
     */
    public function hasAvailableSeats(): bool
    {
        return $this->admitted_count < $this->capacity;
    }
}
