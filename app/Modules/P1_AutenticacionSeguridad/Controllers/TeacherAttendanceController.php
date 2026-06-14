<?php

namespace App\Modules\P1_AutenticacionSeguridad\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P1_AutenticacionSeguridad\Models\TeacherAttendance;
use App\Modules\P4_CarrerasYGrupos\Models\AcademicAssignment;
use App\Modules\P1_AutenticacionSeguridad\Models\SystemLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CU22 — Gestionar asistencia docente
 * Módulo: P1_AutenticacionSeguridad
 */
class TeacherAttendanceController extends Controller
{
    /**
     * Lista las asistencias registradas del docente autenticado.
     */
    public function myAttendances(): JsonResponse
    {
        $user = auth()->user();
        if (!$user || $user->role !== 'docente') {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado.',
            ], 403);
        }

        // Obtener asignaciones del docente
        $assignments = AcademicAssignment::with(['subject', 'group'])
            ->where('user_id', $user->id)
            ->get();

        $assignmentIds = $assignments->pluck('id');

        $attendances = TeacherAttendance::with('assignment.subject', 'assignment.group')
            ->whereIn('assignment_id', $assignmentIds)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'success'     => true,
            'assignments' => $assignments,
            'attendances' => $attendances,
        ]);
    }

    /**
     * Guarda la asistencia del docente (CU22).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'assignment_id' => 'required|exists:academic_assignments,id',
            'date'          => 'required|date',
            'status'        => 'required|string|in:PRESENTE,AUSENTE,LICENCIA',
            'comments'      => 'nullable|string',
        ]);

        $assignment = AcademicAssignment::with(['subject', 'group', 'teacher'])->find($request->input('assignment_id'));

        // Verificar que pertenezca al docente o sea administrador
        $user = auth()->user();
        if ($user->role !== 'admin' && $user->id !== $assignment->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para marcar asistencia en esta asignación.',
            ], 403);
        }

        $attendance = TeacherAttendance::updateOrCreate(
            [
                'assignment_id' => $request->input('assignment_id'),
                'date'          => $request->input('date'),
            ],
            [
                'status'   => $request->input('status'),
                'comments' => $request->input('comments'),
            ]
        );

        SystemLog::log('ASISTENCIA_DOCENTE_REGISTRADA', "Asistencia registrada el {$attendance->date} como '{$attendance->status}' para docente '{$assignment->teacher->name}' en la materia '{$assignment->subject->name}'.");

        return response()->json([
            'success'    => true,
            'message'    => 'Asistencia guardada exitosamente.',
            'attendance' => $attendance,
        ]);
    }
}
