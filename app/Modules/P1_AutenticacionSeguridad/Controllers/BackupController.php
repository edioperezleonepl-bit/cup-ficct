<?php

namespace App\Modules\P1_AutenticacionSeguridad\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P1_AutenticacionSeguridad\Models\SystemLog;

/**
 * CU26 — Gestionar respaldo de información
 * Módulo: P1_AutenticacionSeguridad
 */
class BackupController extends Controller
{
    /**
     * Descarga el archivo de base de datos SQLite como respaldo de seguridad.
     */
    public function download()
    {
        $dbPath = database_path('database.sqlite');

        if (!file_exists($dbPath)) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró el archivo de base de datos para realizar el respaldo.',
            ], 404);
        }

        SystemLog::log('RESPALDO_INFORMACION_DESCARGADO', 'Copia de seguridad de la base de datos generada y descargada.');

        return response()->download($dbPath, 'backup_cup_ficct_' . date('Y_m_d_His') . '.sqlite');
    }
}
