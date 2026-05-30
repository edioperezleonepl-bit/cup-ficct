<?php

namespace App\Http\Controllers;

use App\Models\Postulant;
use App\Models\Subject;
use App\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class GradeController extends Controller
{
    /**
     * Registra o actualiza de manera reactiva y masiva las notas de un postulante.
     * 
     * POST /api/exams/grades
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'postulant_id' => 'required|exists:postulants,id',
            'grades' => 'required|array',
            'grades.*' => 'required|array|size:3',
            'grades.*.*' => 'required|numeric|min:0|max:100',
        ]);

        try {
            return DB::transaction(function () use ($validated) {
                $postulantId = $validated['postulant_id'];
                $subjects = Subject::all()->keyBy('name');

                if ($subjects->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Las materias base no han sido inicializadas en la base de datos.'
                    ], 400);
                }

                $insertedGrades = [];

                foreach ($validated['grades'] as $subjectName => $gradesArray) {
                    $subject = $subjects->get($subjectName);

                    if (!$subject) {
                        return response()->json([
                            'success' => false,
                            'message' => "La materia '{$subjectName}' no es válida."
                        ], 400);
                    }

                    foreach ($gradesArray as $index => $gradeValue) {
                        $examNumber = $index + 1;

                        $exam = Exam::updateOrCreate(
                            [
                                'postulant_id' => $postulantId,
                                'subject_id' => $subject->id,
                                'exam_number' => $examNumber,
                            ],
                            [
                                'grade' => $gradeValue
                            ]
                        );

                        $insertedGrades[] = [
                            'subject' => $subjectName,
                            'exam_number' => $examNumber,
                            'grade' => floatval($gradeValue)
                        ];
                    }
                }

                $postulant = Postulant::find($postulantId);
                $postulant->update([
                    'estado_admision' => 'PENDIENTE',
                    'carrera_admitida_id' => null
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Notas del postulante registradas exitosamente.',
                    'data' => [
                        'postulant_id' => $postulantId,
                        'grades' => $insertedGrades
                    ]
                ]);
            });
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar las notas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene las notas cargadas de un postulante.
     * 
     * GET /api/exams/grades/{postulant_id}
     */
    public function show(int $postulantId): JsonResponse
    {
        try {
            $postulant = Postulant::find($postulantId);

            if (!$postulant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Postulante no encontrado.'
                ], 404);
            }

            $exams = Exam::where('postulant_id', $postulantId)
                ->with('subject')
                ->get();

            $formattedGrades = [
                'Computación' => [null, null, null],
                'Matemáticas' => [null, null, null],
                'Inglés' => [null, null, null],
                'Física' => [null, null, null],
            ];

            foreach ($exams as $exam) {
                $subjectName = $exam->subject->name;
                $idx = $exam->exam_number - 1;

                if (array_key_exists($subjectName, $formattedGrades) && $idx >= 0 && $idx < 3) {
                    $formattedGrades[$subjectName][$idx] = floatval($exam->grade);
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'postulant_id' => $postulantId,
                    'grades' => $formattedGrades
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las notas: ' . $e->getMessage()
            ], 500);
        }
    }
}
