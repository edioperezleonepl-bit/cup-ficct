<?php

namespace App\Services;

use App\Models\Postulant;
use App\Models\Career;
use App\Models\Subject;
use App\Models\Exam;
use App\Models\SubjectAverage;
use Illuminate\Support\Facades\DB;
use Exception;

class ResultProcessorService
{
    /**
     * Calcula los promedios individuales por materia y el estado académico
     * preliminar (APROBADO/REPROBADO) para todos los postulantes.
     */
    public function processAllAverages(): array
    {
        return DB::transaction(function () {
            $postulants = Postulant::with('exams')->get();
            $subjects = Subject::all();
            $processedCount = 0;
            $warnings = [];

            foreach ($postulants as $postulant) {
                $subjectAverages = [];
                $hasMissingExams = false;

                foreach ($subjects as $subject) {
                    // Obtener los 3 exámenes para esta materia
                    $exams = $postulant->exams->where('subject_id', $subject->id);

                    if ($exams->count() < 3) {
                        $hasMissingExams = true;
                        $warnings[] = "Postulante CI {$postulant->ci} no tiene registrados exactamente 3 exámenes para la materia '{$subject->name}'.";
                        continue;
                    }

                    // Calcular promedio de la materia
                    $sum = $exams->sum('grade');
                    $average = $sum / 3;
                    $status = $average >= 60 ? 'APROBADO' : 'REPROBADO';

                    // Guardar o actualizar promedio de materia
                    SubjectAverage::updateOrCreate(
                        [
                            'postulant_id' => $postulant->id,
                            'subject_id' => $subject->id,
                        ],
                        [
                            'average' => $average,
                            'status' => $status,
                        ]
                    );

                    $subjectAverages[] = $average;
                }

                // Si tiene todas las materias procesadas, calculamos su estado general
                if (!$hasMissingExams && count($subjectAverages) === $subjects->count()) {
                    $generalAverage = array_sum($subjectAverages) / count($subjectAverages);
                    
                    if ($generalAverage < 60) {
                        $postulant->update([
                            'estado_admision' => 'REPROBADO',
                            'carrera_admitida_id' => null
                        ]);
                    } else {
                        $postulant->update([
                            'estado_admision' => 'PENDIENTE',
                            'carrera_admitida_id' => null
                        ]);
                    }
                    $processedCount++;
                } else {
                    $postulant->update([
                        'estado_admision' => 'PENDIENTE',
                        'carrera_admitida_id' => null
                    ]);
                }
            }

            return [
                'success' => true,
                'message' => "Se calcularon los promedios de {$processedCount} postulantes correctamente.",
                'warnings' => $warnings,
            ];
        });
    }

    /**
     * Algoritmo de Control de Cupos de Carrera:
     * Procesa a los postulantes académicamente APROBADOS en orden de mérito (de mayor a menor promedio general)
     * y los admite en su primera opción, o si está llena, los redirige automáticamente a su segunda opción.
     */
    public function allocateCareerSeats(): array
    {
        return DB::transaction(function () {
            // 1. Resetear contadores de admitidos de todas las carreras
            Career::query()->update(['admitted_count' => 0]);

            // 2. Obtener todas las carreras indexadas para optimizar consultas en memoria
            $careers = Career::all()->keyBy('id');

            // 3. Obtener postulantes que no han reprobado (estado 'PENDIENTE')
            $postulants = Postulant::with('subjectAverages')
                ->where('estado_admision', 'PENDIENTE')
                ->get();

            // Calcular y adjuntar promedio general para ordenar en memoria
            $qualifiedPostulants = [];
            foreach ($postulants as $postulant) {
                $averages = $postulant->subjectAverages;
                
                if ($averages->count() === 4) {
                    $generalAverage = $averages->avg('average');
                    
                    if ($generalAverage >= 60) {
                        $postulant->general_average = $generalAverage;
                        $qualifiedPostulants[] = $postulant;
                    }
                }
            }

            // Ordenar postulantes de mayor a menor promedio general (Orden de Mérito Estricto)
            usort($qualifiedPostulants, function ($a, $b) {
                return $b->general_average <=> $a->general_average;
            });

            $admittedCount = 0;
            $rejectedCount = 0;
            $log = [];

            foreach ($qualifiedPostulants as $postulant) {
                $op1 = $careers->get($postulant->carrera_opcion1_id);
                $op2 = $careers->get($postulant->carrera_opcion2_id);

                if (!$op1 || !$op2) {
                    throw new Exception("Carrera no encontrada para el postulante CI: {$postulant->ci}");
                }

                // Intentar admitir en primera opción
                if ($op1->admitted_count < $op1->capacity) {
                    $postulant->carrera_admitida_id = $op1->id;
                    $postulant->estado_admision = 'ADMITIDO';
                    $postulant->save();

                    $op1->admitted_count++;
                    $op1->save();

                    $admittedCount++;
                    $log[] = "Postulante CI {$postulant->ci} (Promedio: " . round($postulant->general_average, 2) . ") admitido en su 1ra opción: {$op1->name}.";
                } 
                // Si la primera opción está llena, intentar con la segunda opción automáticamente
                elseif ($op2->admitted_count < $op2->capacity) {
                    $postulant->carrera_admitida_id = $op2->id;
                    $postulant->estado_admision = 'ADMITIDO';
                    $postulant->save();

                    $op2->admitted_count++;
                    $op2->save();

                    $admittedCount++;
                    $log[] = "Postulante CI {$postulant->ci} (Promedio: " . round($postulant->general_average, 2) . ") redirigido y admitido en su 2da opción: {$op2->name} (1ra opción llena).";
                } 
                // Si ambas opciones están llenas, el estado es NO_ADMITIDO
                else {
                    $postulant->carrera_admitida_id = null;
                    $postulant->estado_admision = 'NO_ADMITIDO';
                    $postulant->save();

                    $rejectedCount++;
                    $log[] = "Postulante CI {$postulant->ci} (Promedio: " . round($postulant->general_average, 2) . ") NO ADMITIDO. Cupos agotados en ambas opciones: {$op1->name} y {$op2->name}.";
                }
            }

            return [
                'success' => true,
                'admitted_count' => $admittedCount,
                'no_seats_count' => $rejectedCount,
                'log' => $log
            ];
        });
    }
}
