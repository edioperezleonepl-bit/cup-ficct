<?php

namespace App\Modules\P5_ExamenesYCalificaciones\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P5_ExamenesYCalificaciones\Models\Setting;
use App\Modules\P1_AutenticacionSeguridad\Models\SystemLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CU21 — Configurar parámetros académicos
 * Módulo: P5_ExamenesYCalificaciones
 */
class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'settings' => Setting::all(),
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'value' => 'required|string',
        ]);

        $setting = Setting::find($id);
        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Parámetro no encontrado.',
            ], 404);
        }

        $oldVal = $setting->value;
        $setting->update([
            'value' => $request->input('value'),
        ]);

        SystemLog::log('PARAMETRO_ACADEMICO_MODIFICADO', "Parámetro '{$setting->key}' modificado de '{$oldVal}' a '{$setting->value}'.");

        return response()->json([
            'success' => true,
            'message' => "Parámetro '{$setting->key}' actualizado con éxito.",
            'setting' => $setting,
        ]);
    }
}
