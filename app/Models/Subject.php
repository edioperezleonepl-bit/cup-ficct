<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $fillable = [
        'name',
    ];

    /**
     * Relación con los exámenes de esta materia.
     */
    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class, 'subject_id');
    }

    /**
     * Relación con los promedios de esta materia.
     */
    public function averages(): HasMany
    {
        return $this->hasMany(SubjectAverage::class, 'subject_id');
    }
}
