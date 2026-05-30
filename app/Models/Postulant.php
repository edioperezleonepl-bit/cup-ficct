<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'carrera_opcion1_id',
        'carrera_opcion2_id',
        'carrera_admitida_id',
        'estado_admision',
        'grupo_id',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'titulo_bachiller' => 'boolean',
    ];

    /**
     * Relación con la primera opción de carrera.
     */
    public function carreraOpcion1(): BelongsTo
    {
        return $this->belongsTo(Career::class, 'carrera_opcion1_id');
    }

    /**
     * Relación con la segunda opción de carrera.
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

    /**
     * Relación con el grupo asignado.
     */
    public function grupo(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'grupo_id');
    }

    /**
     * Relación con los exámenes individuales de las materias.
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
}
