<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubjectAverage extends Model
{
    protected $table = 'subject_averages';

    protected $fillable = [
        'postulant_id',
        'subject_id',
        'average',
        'status',
    ];

    protected $casts = [
        'average' => 'decimal:2',
    ];

    /**
     * Relación con el postulante asociado al promedio.
     */
    public function postulant(): BelongsTo
    {
        return $this->belongsTo(Postulant::class, 'postulant_id');
    }

    /**
     * Relación con la materia correspondiente.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
