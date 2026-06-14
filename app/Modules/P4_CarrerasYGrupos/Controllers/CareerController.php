<?php

namespace App\Modules\P4_CarrerasYGrupos\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P4_CarrerasYGrupos\Models\Career;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CU07 — Gestionar carreras y cupos
 * CU08 — Asignar carrera según cupos disponibles
 * Módulo: P4_CarrerasYGrupos
 *
 * Permite al Coordinador consultar y configurar los cupos
 * disponibles por carrera en cada gestión académica.
 */
class CareerController extends Controller
{
    /**
     * Obtiene la lista completa de carreras con sus cupos y admitidos.
     *
     * GET /api/careers
     */
    public function index(): JsonResponse
    {
        $careers = Career::select('id', 'name', 'capacity', 'admitted_count')->get();

        // Formatear para coincidir con el frontend (admitted_count → admittedCount)
        $formatted = $careers->map(fn($career) => [
            'id'           => $career->id,
            'name'         => $career->name,
            'capacity'     => $career->capacity,
            'admittedCount' => $career->admitted_count,
        ]);

        return response()->json($formatted);
    }

    /**
     * Actualiza la capacidad de cupos de una carrera específica.
     *
     * PUT /api/careers/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'capacity' => 'required|integer|min:0',
        ]);

        $career = Career::find($id);
        if (!$career) {
            return response()->json([
                'success' => false,
                'message' => 'Carrera no encontrada.',
            ], 404);
        }

        $career->capacity = $request->input('capacity');
        $career->save();

        return response()->json([
            'success' => true,
            'message' => 'Capacidad de cupos actualizada exitosamente.',
            'career'  => [
                'id'           => $career->id,
                'name'         => $career->name,
                'capacity'     => $career->capacity,
                'admittedCount' => $career->admitted_count,
            ],
        ]);
    }
}
