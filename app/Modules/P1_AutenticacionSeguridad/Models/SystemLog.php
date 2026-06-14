<?php

namespace App\Modules\P1_AutenticacionSeguridad\Models;

use App\Modules\P1_AutenticacionSeguridad\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Bitácora del Sistema (Auditoría).
 * Módulo: P1_AutenticacionSeguridad
 * CU17 — Gestionar bitácora del sistema
 */
class SystemLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'details',
        'ip_address',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Helper estático para registrar auditoría en la bitácora (CU17).
     */
    public static function log(string $action, string $details): void
    {
        try {
            self::create([
                'user_id'    => auth()->id(),
                'action'     => $action,
                'details'    => $details,
                'ip_address' => request()->ip(),
            ]);
        } catch (\Exception $e) {
            logger("Error en bitácora: " . $e->getMessage());
        }
    }
}
