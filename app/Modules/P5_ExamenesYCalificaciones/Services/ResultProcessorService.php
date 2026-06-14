<?php

namespace App\Modules\P5_ExamenesYCalificaciones\Services;

use App\Modules\P2_GestionPostulantes\Models\Postulant;
use App\Modules\P4_CarrerasYGrupos\Models\Career;
use App\Modules\P5_ExamenesYCalificaciones\Models\Subject;
use App\Modules\P5_ExamenesYCalificaciones\Models\Exam;
use App\Modules\P5_ExamenesYCalificaciones\Models\SubjectAverage;
use App\Modules\P5_ExamenesYCalificaciones\Models\Setting;
use Illuminate\Support\Facades\DB;
use Exception;

/**
 * CU11 — Procesar resultados académicos
 * CU08 — Asignar carrera según cupos disponibles
 * CU20 — Gestionar lista de espera
 * Módulo: P5_ExamenesYCalificaciones
 */
class ResultProcessorService
{
    /**
     * Calcula los promedios individuales por materia y el estado académico
     * preliminar (APROBADO/REPROBADO) para todos los postulantes.
     * Aprobación: promedio >= passing_grade (CU21).
     */
    public function processAllAverages(): array
    {
        return DB::transaction(function () {
            $postulants     = Postulant::with('exams')->get();
            $subjects       = Subject::all();
            $processedCount = 0;
            $warnings       = [];

            $passingGrade = (float) Setting::getValue('passing_grade', 60.0);

            foreach ($postulants as $postulant) {
                $subjectAverages = [];
                $hasMissingExams = false;

                foreach ($subjects as $subject) {
                    $exams = $postulant->exams->where('subject_id', $subject->id);

                    if ($exams->count() < 3) {
                        $hasMissingExams = true;
                        $warnings[]      = "Postulante CI {$postulant->ci} no tiene registrados exactamente 3 exámenes para la materia '{$subject->name}'.";
                        continue;
                    }

                    $average = $exams->sum('grade') / 3;
                    $status  = $average >= $passingGrade ? 'APROBADO' : 'REPROBADO';

                    SubjectAverage::updateOrCreate(
                        [
                            'postulant_id' => $postulant->id,
                            'subject_id'   => $subject->id,
                        ],
                        [
                            'average' => $average,
                            'status'  => $status,
                        ]
                    );

                    $subjectAverages[] = $average;
                }

                if (!$hasMissingExams && count($subjectAverages) === $subjects->count()) {
                    $generalAverage = array_sum($subjectAverages) / count($subjectAverages);

                    $postulant->update([
                        'estado_admision'    => $generalAverage < $passingGrade ? 'REPROBADO' : 'PENDIENTE',
                        'carrera_admitida_id' => null,
                    ]);
                    $processedCount++;
                } else {
                    $postulant->update([
                        'estado_admision'    => 'PENDIENTE',
                        'carrera_admitida_id' => null,
                    ]);
                }
            }

            return [
                'success'  => true,
                'message'  => "Se calcularon los promedios de {$processedCount} postulantes correctamente.",
                'warnings' => $warnings,
            ];
        });
    }

    /**
     * Algoritmo de Control de Cupos de Carrera:
     * Procesa a los postulantes académicamente APROBADOS en orden de mérito.
     * Si no hay cupos en ambas opciones, los coloca en LISTA_ESPERA (CU20).
     */
    public function allocateCareerSeats(): array
    {
        return DB::transaction(function () {
            Career::query()->update(['admitted_count' => 0]);
            $careers = Career::all()->keyBy('id');

            $passingGrade = (float) Setting::getValue('passing_grade', 60.0);

            $postulants = Postulant::with('subjectAverages')
                ->where('estado_admision', 'PENDIENTE')
                ->get();

            $qualifiedPostulants = [];
            foreach ($postulants as $postulant) {
                $averages = $postulant->subjectAverages;

                if ($averages->count() === 4) {
                    $generalAverage = $averages->avg('average');

                    if ($generalAverage >= $passingGrade) {
                        $postulant->general_average = $generalAverage;
                        $qualifiedPostulants[]      = $postulant;
                    }
                }
            }

            usort($qualifiedPostulants, fn($a, $b) => $b->general_average <=> $a->general_average);

            $admittedCount = 0;
            $waitlistCount = 0;
            $log           = [];

            foreach ($qualifiedPostulants as $postulant) {
                $op1 = $careers->get($postulant->carrera_opcion1_id);
                $op2 = $careers->get($postulant->carrera_opcion2_id);

                if (!$op1 || !$op2) {
                    throw new Exception("Carrera no encontrada para el postulante CI: {$postulant->ci}");
                }

                if ($op1->admitted_count < $op1->capacity) {
                    $postulant->carrera_admitida_id = $op1->id;
                    $postulant->estado_admision     = 'ADMITIDO';
                    $postulant->save();
                    $op1->admitted_count++;
                    $op1->save();
                    $admittedCount++;
                    $log[] = "Postulante CI {$postulant->ci} (Promedio: " . round($postulant->general_average, 2) . ") admitido en su 1ra opción: {$op1->name}.";

                } elseif ($op2->admitted_count < $op2->capacity) {
                    $postulant->carrera_admitida_id = $op2->id;
                    $postulant->estado_admision     = 'ADMITIDO';
                    $postulant->save();
                    $op2->admitted_count++;
                    $op2->save();
                    $admittedCount++;
                    $log[] = "Postulante CI {$postulant->ci} (Promedio: " . round($postulant->general_average, 2) . ") redirigido a su 2da opción: {$op2->name} (1ra opción llena).";

                // Si no hay cupos en ambas opciones → LISTA_ESPERA (CU20)
                } else {
                    $postulant->carrera_admitida_id = null;
                    $postulant->estado_admision     = 'LISTA_ESPERA';
                    $postulant->save();
                    $waitlistCount++;
                    $log[] = "Postulante CI {$postulant->ci} (Promedio: " . round($postulant->general_average, 2) . ") colocado en LISTA DE ESPERA (sin cupos disponibles).";
                }
            }

            return [
                'success'        => true,
                'admitted_count' => $admittedCount,
                'no_seats_count' => $waitlistCount,
                'log'            => $log,
            ];
        });
    }
}
