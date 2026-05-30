<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Exam extends Model
{
    protected $fillable = [
        'postulant_id',
        'subject_id',
        'exam_number',
        'grade',
    ];

    protected $casts = [
        'grade' => 'decimal:2',
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
