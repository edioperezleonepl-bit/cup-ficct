<?php

namespace App\Modules\P5_ExamenesYCalificaciones\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P5_ExamenesYCalificaciones\Services\ResultProcessorService;
use App\Modules\P2_GestionPostulantes\Models\Postulant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Exception;

/**
 * CU11 — Procesar resultados académicos
 * CU08 — Asignar carrera según cupos disponibles
 * Módulo: P5_ExamenesYCalificaciones
 *
 * Orquesta el cálculo de promedios, asignación de cupos y
 * consulta del expediente académico de cada postulante.
 */
class ProcessResultsController extends Controller
{
    protected ResultProcessorService $resultProcessorService;

    public function __construct(ResultProcessorService $resultProcessorService)
    {
        $this->resultProcessorService = $resultProcessorService;
    }

    /**
     * Procesa y calcula los promedios y estados preliminares para todos los postulantes.
     *
     * POST /api/exams/process-averages
     */
    public function processAverages(Request $request): JsonResponse
    {
        try {
            $result = $this->resultProcessorService->processAllAverages();

            return response()->json([
                'success'  => true,
                'message'  => $result['message'],
                'warnings' => $result['warnings'],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al calcular los promedios académicos: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Asigna automáticamente las carreras por orden de mérito (mayor a menor promedio).
     *
     * POST /api/exams/allocate-seats
     */
    public function allocateSeats(Request $request): JsonResponse
    {
        try {
            $result = $this->resultProcessorService->allocateCareerSeats();

            return response()->json([
                'success' => true,
                'message' => 'Proceso de asignación de cupos finalizado con éxito.',
                'data'    => [
                    'admitted_count'  => $result['admitted_count'],
                    'no_seats_count'  => $result['no_seats_count'],
                    'log'             => $result['log'],
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error durante el algoritmo de asignación de cupos: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retorna el detalle académico completo y estado de admisión de un postulante.
     * Soporta búsqueda por ID, CI, o 'my' (usuario autenticado).
     *
     * GET /api/exams/postulant-summary/{id}
     */
    public function getPostulantSummary($id): JsonResponse
    {
        try {
            // Soporte para el postulante autenticado
            if ($id === 'my') {
                $user = Auth::user();
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Usuario no autenticado.',
                    ], 401);
                }

                $postulant = Postulant::where('correo_electronico', $user->email)->first();
                if (!$postulant) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No se encontró un expediente de postulante para esta cuenta (' . $user->email . ').',
                    ], 444);
                }
                $id = $postulant->id;
            }

            $postulant = Postulant::with([
                'exams.subject',
                'subjectAverages.subject',
                'carreraOpcion1',
                'carreraOpcion2',
                'carreraAdmitida',
                'grupo',
            ])->where('id', $id)
              ->orWhere('ci', $id)
              ->first();

            if (!$postulant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Postulante no encontrado.',
                ], 404);
            }

            // Calcular promedio general en tiempo de ejecución
            $generalAverage = $postulant->subjectAverages->avg('average') ?? 0;

            return response()->json([
                'success' => true,
                'data'    => [
                    'postulant'       => [
                        'id'              => $postulant->id,
                        'ci'              => $postulant->ci,
                        'nombres'         => $postulant->nombres,
                        'apellidos'       => $postulant->apellidos,
                        'estado_admision' => $postulant->estado_admision,
                        'carrera_opcion1' => $postulant->carreraOpcion1 ? $postulant->carreraOpcion1->name : null,
                        'carrera_opcion2' => $postulant->carreraOpcion2 ? $postulant->carreraOpcion2->name : null,
                        'carrera_admitida' => $postulant->carreraAdmitida ? $postulant->carreraAdmitida->name : null,
                        'grupo'           => $postulant->grupo ? $postulant->grupo->name : null,
                        'promedio_general' => round($generalAverage, 2),
                    ],
                    'subject_averages' => $postulant->subjectAverages->map(fn($avg) => [
                        'subject' => $avg->subject->name,
                        'average' => round($avg->average, 2),
                        'status'  => $avg->status,
                    ]),
                    'raw_exams'       => $postulant->exams->map(fn($exam) => [
                        'subject'     => $exam->subject->name,
                        'exam_number' => $exam->exam_number,
                        'grade'       => $exam->grade,
                    ]),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el resumen académico: ' . $e->getMessage(),
            ], 500);
        }
    }
}
