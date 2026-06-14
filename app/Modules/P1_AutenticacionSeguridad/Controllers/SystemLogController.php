<?php

namespace App\Modules\P1_AutenticacionSeguridad\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P1_AutenticacionSeguridad\Models\SystemLog;
use Illuminate\Http\JsonResponse;

/**
 * CU17 — Gestionar bitácora del sistema
 * Módulo: P1_AutenticacionSeguridad
 */
class SystemLogController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = SystemLog::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'logs' => $logs,
        ]);
    }
}
