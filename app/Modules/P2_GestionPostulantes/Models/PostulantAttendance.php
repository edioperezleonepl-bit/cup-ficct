<?php

namespace App\Modules\P2_GestionPostulantes\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\P1_AutenticacionSeguridad\Models\User;

/**
 * Modelo de Asistencia de Postulantes.
 * Módulo: P2_GestionPostulantes
 * Control de ingreso el día del examen de admisión.
 */
class PostulantAttendance extends Model
{
    protected $table = 'postulant_attendances';

    protected $fillable = [
        'postulant_id',
        'scanned_by',
        'status',
        'scanned_at',
        'comments',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    /**
     * Relación con el Postulante.
     */
    public function postulant(): BelongsTo
    {
        return $this->belongsTo(Postulant::class, 'postulant_id');
    }

    /**
     * Relación con el Usuario que realizó el escaneo (Docente/Coordinador/Admin).
     */
    public function scanner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }
}
