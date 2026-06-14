<?php

namespace App\Modules\P4_CarrerasYGrupos\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P4_CarrerasYGrupos\Models\AcademicAssignment;
use App\Modules\P1_AutenticacionSeguridad\Models\User;
use App\Modules\P1_AutenticacionSeguridad\Models\SystemLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CU14 — Gestionar asignación académica
 * Módulo: P4_CarrerasYGrupos
 */
class AcademicAssignmentController extends Controller
{
    public function index(): JsonResponse
    {
        $assignments = AcademicAssignment::with(['teacher', 'subject', 'group'])->get();
        return response()->json([
            'success' => true,
            'assignments' => $assignments,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_id'    => 'required|exists:users,id',
            'subject_id' => 'required|exists:subjects,id',
            'group_id'   => 'required|exists:groups,id',
            'classroom'  => 'required|string',
            'schedule'   => 'required|string',
        ]);

        // Validar que el usuario sea docente
        $teacher = User::find($request->input('user_id'));
        if ($teacher->role !== 'docente') {
            return response()->json([
                'success' => false,
                'message' => 'El usuario seleccionado debe tener el rol de docente.',
            ], 422);
        }

        $assignment = AcademicAssignment::create([
            'user_id'    => $request->input('user_id'),
            'subject_id' => $request->input('subject_id'),
            'group_id'   => $request->input('group_id'),
            'classroom'  => $request->input('classroom'),
            'schedule'   => $request->input('schedule'),
        ]);

        $assignment->load(['teacher', 'subject', 'group']);

        SystemLog::log('ASIGNACION_ACADEMICA_CREADA', "Docente '{$assignment->teacher->name}' asignado a la materia '{$assignment->subject->name}' en el '{$assignment->group->name}'.");

        return response()->json([
            'success'    => true,
            'message'    => 'Asignación académica registrada con éxito.',
            'assignment' => $assignment,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $assignment = AcademicAssignment::find($id);
        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'Asignación no encontrada.',
            ], 404);
        }

        $assignment->load(['teacher', 'subject', 'group']);
        $teacherName = $assignment->teacher ? $assignment->teacher->name : 'N/A';
        $subName     = $assignment->subject ? $assignment->subject->name : 'N/A';

        $assignment->delete();

        SystemLog::log('ASIGNACION_ACADEMICA_ELIMINADA', "Asignación eliminada del docente '{$teacherName}' en la materia '{$subName}'.");

        return response()->json([
            'success' => true,
            'message' => 'Asignación académica eliminada con éxito.',
        ]);
    }
}
