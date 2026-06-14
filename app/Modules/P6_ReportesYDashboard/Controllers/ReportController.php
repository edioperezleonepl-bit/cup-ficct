<?php

namespace App\Modules\P6_ReportesYDashboard\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P2_GestionPostulantes\Models\Postulant;
use App\Modules\P4_CarrerasYGrupos\Models\Career;
use App\Modules\P4_CarrerasYGrupos\Models\Group;
use App\Modules\P5_ExamenesYCalificaciones\Models\SubjectAverage;
use Illuminate\Http\JsonResponse;

/**
 * CU15 — Generar reportes académicos y administrativos
 * CU16 — Consultar dashboard de admisión
 * Módulo: P6_ReportesYDashboard
 *
 * Proporciona al Administrador, Coordinador y Autoridad académica
 * los indicadores y reportes consolidados del proceso de admisión.
 */
class ReportController extends Controller
{
    /**
     * Retorna los indicadores principales del Dashboard de admisión.
     * Incluye: total inscritos, aprobados, reprobados, admitidos,
     * sin cupo, grupos habilitados y distribución por carrera.
     *
     * GET /api/reports/dashboard
     */
    public function dashboard(): JsonResponse
    {
        // ── Totales por estado de admisión ───────────────────────────────────
        $totalInscritos  = Postulant::count();
        $totalAprobados  = Postulant::whereIn('estado_admision', ['PENDIENTE', 'ADMITIDO', 'LISTA_ESPERA'])->count();
        $totalReprobados = Postulant::where('estado_admision', 'REPROBADO')->count();
        $totalAdmitidos  = Postulant::where('estado_admision', 'ADMITIDO')->count();
        $totalNoAdmitidos = Postulant::where('estado_admision', 'NO_ADMITIDO')->count();
        $totalListaEspera = Postulant::where('estado_admision', 'LISTA_ESPERA')->count();

        // ── Grupos habilitados ───────────────────────────────────────────────
        $gruposHabilitados = Group::count();
        $capacidadMaxGrupo = 70;
        $gruposCalculados  = $totalInscritos > 0 ? ceil($totalInscritos / $capacidadMaxGrupo) : 0;

        // ── Carreras con cupos disponibles ───────────────────────────────────
        $careers = Career::select('id', 'name', 'capacity', 'admitted_count')->get();
        $carrerasData = $careers->map(fn($c) => [
            'id'               => $c->id,
            'name'             => $c->name,
            'capacity'         => $c->capacity,
            'admittedCount'    => $c->admitted_count,
            'availableSlots'   => max(0, $c->capacity - $c->admitted_count),
        ]);

        // ── Promedios por materia ────────────────────────────────────────────
        $promediosPorMateria = SubjectAverage::with('subject')
            ->selectRaw('subject_id, AVG(average) as promedio_materia, COUNT(*) as total_evaluados')
            ->groupBy('subject_id')
            ->get()
            ->map(fn($sa) => [
                'materia'          => $sa->subject->name ?? 'Desconocida',
                'promedio'         => round($sa->promedio_materia, 2),
                'total_evaluados'  => $sa->total_evaluados,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'resumen' => [
                    'total_inscritos'   => $totalInscritos,
                    'total_aprobados'   => $totalAprobados,
                    'total_reprobados'  => $totalReprobados,
                    'total_admitidos'   => $totalAdmitidos,
                    'total_no_admitidos' => $totalNoAdmitidos,
                    'total_lista_espera' => $totalListaEspera,
                ],
                'grupos' => [
                    'grupos_en_bd'      => $gruposHabilitados,
                    'grupos_calculados' => $gruposCalculados,
                    'formula'           => "CEIL({$totalInscritos} / {$capacidadMaxGrupo})",
                ],
                'carreras'             => $carrerasData,
                'promedios_por_materia' => $promediosPorMateria,
            ],
        ]);
    }

    /**
     * Retorna la lista completa de postulantes aprobados con su promedio general.
     *
     * GET /api/reports/approved
     */
    public function approvedPostulants(): JsonResponse
    {
        $postulants = Postulant::with(['carreraAdmitida', 'subjectAverages'])
            ->whereIn('estado_admision', ['ADMITIDO', 'PENDIENTE'])
            ->get()
            ->map(function ($p) {
                $promedio = $p->subjectAverages->avg('average') ?? 0;
                return [
                    'id'              => $p->id,
                    'ci'              => $p->ci,
                    'nombres'         => $p->nombres,
                    'apellidos'       => $p->apellidos,
                    'estado_admision' => $p->estado_admision,
                    'carrera_admitida' => $p->carreraAdmitida ? $p->carreraAdmitida->name : 'Pendiente de asignación',
                    'promedio_general' => round($promedio, 2),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $postulants,
        ]);
    }

    /**
     * Retorna la lista completa de postulantes reprobados.
     *
     * GET /api/reports/rejected
     */
    public function rejectedPostulants(): JsonResponse
    {
        $postulants = Postulant::with(['carreraOpcion1', 'subjectAverages'])
            ->where('estado_admision', 'REPROBADO')
            ->get()
            ->map(function ($p) {
                $promedio = $p->subjectAverages->avg('average') ?? 0;
                return [
                    'id'              => $p->id,
                    'ci'              => $p->ci,
                    'nombres'         => $p->nombres,
                    'apellidos'       => $p->apellidos,
                    'carrera_opcion1' => $p->carreraOpcion1 ? $p->carreraOpcion1->name : '',
                    'promedio_general' => round($promedio, 2),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $postulants,
        ]);
    }

    /**
     * Retorna la lista completa de postulantes en lista de espera (CU20).
     *
     * GET /api/reports/waitlist
     */
    public function waitlistPostulants(): JsonResponse
    {
        $postulants = Postulant::with(['carreraOpcion1', 'carreraOpcion2', 'subjectAverages'])
            ->where('estado_admision', 'LISTA_ESPERA')
            ->get()
            ->map(function ($p) {
                $promedio = $p->subjectAverages->avg('average') ?? 0;
                return [
                    'id'              => $p->id,
                    'ci'              => $p->ci,
                    'nombres'         => $p->nombres,
                    'apellidos'       => $p->apellidos,
                    'carrera_opcion1' => $p->carreraOpcion1 ? $p->carreraOpcion1->name : '',
                    'carrera_opcion2' => $p->carreraOpcion2 ? $p->carreraOpcion2->name : '',
                    'promedio_general' => round($promedio, 2),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $postulants,
        ]);
    }
}
