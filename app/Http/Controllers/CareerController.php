<?php

namespace App\Http\Controllers;

use App\Models\Career;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CareerController extends Controller
{
    /**
     * Obtiene la lista de carreras y sus cupos/admitidos.
     * 
     * GET /api/careers
     */
    public function index(): JsonResponse
    {
        $careers = Career::select('id', 'name', 'capacity', 'admitted_count')->get();
        
        // Formatear para que coincida con el frontend (admitted_count -> admittedCount)
        $formatted = $careers->map(function ($career) {
            return [
                'id' => $career->id,
                'name' => $career->name,
                'capacity' => $career->capacity,
                'admittedCount' => $career->admitted_count,
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Actualiza la capacidad de cupos de una carrera.
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
                'message' => 'Carrera no encontrada.'
            ], 404);
        }

        $career->capacity = $request->input('capacity');
        $career->save();

        return response()->json([
            'success' => true,
            'message' => 'Capacidad de cupos actualizada exitosamente.',
            'career' => [
                'id' => $career->id,
                'name' => $career->name,
                'capacity' => $career->capacity,
                'admittedCount' => $career->admitted_count,
            ]
        ]);
    }
}
