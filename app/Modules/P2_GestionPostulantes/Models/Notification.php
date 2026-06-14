<?php

namespace App\Modules\P2_GestionPostulantes\Models;

use App\Modules\P2_GestionPostulantes\Models\Postulant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Notificaciones para Postulantes.
 * Módulo: P2_GestionPostulantes
 * CU25 — Gestionar notificaciones
 */
class Notification extends Model
{
    protected $fillable = [
        'postulant_id',
        'message',
        'type',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function postulant(): BelongsTo
    {
        return $this->belongsTo(Postulant::class, 'postulant_id');
    }
}
