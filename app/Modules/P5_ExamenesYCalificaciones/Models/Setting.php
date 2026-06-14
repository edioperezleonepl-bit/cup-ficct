<?php

namespace App\Modules\P5_ExamenesYCalificaciones\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo de Configuración General de Parámetros Académicos.
 * Módulo: P5_ExamenesYCalificaciones
 * CU21 — Configurar parámetros académicos
 */
class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    /**
     * Helper para obtener un valor por su llave.
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }
}
