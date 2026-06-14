<?php

namespace App\Modules\P4_CarrerasYGrupos\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P2_GestionPostulantes\Models\Postulant;
use App\Modules\P4_CarrerasYGrupos\Models\Group;
use App\Modules\P5_ExamenesYCalificaciones\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * CU12 — Gestionar grupos del curso preuniversitario
 * Módulo: P4_CarrerasYGrupos
 *
 * Calcula, asigna y retorna la distribución real de grupos basada en
 * los postulantes formalmente inscritos (pago confirmado).
 * Fórmula: CantidadGrupos = CEIL(total_inscritos / max_group_capacity)
 */
class GroupController extends Controller
{
    /**
     * Retorna la distribución de grupos calculada a partir de los
     * postulantes realmente inscritos (con pago confirmado).
     *
     * GET /api/groups/distribution
     */
    public function distribution(): JsonResponse
    {
        $result = DB::transaction(function () {
            // 1. Obtener todos los postulantes formalmente inscritos (pago confirmado) ordenados alfabéticamente
            $postulants = Postulant::where('pago_realizado', true)
                ->orderBy('apellidos')
                ->orderBy('nombres')
                ->get();

            $totalInscritos = $postulants->count();

            // Cargar capacidad máxima del grupo configurable (CU21)
            $maxPerGroup = (int) Setting::getValue('max_group_capacity', 70);

            // Fórmula: CEIL(total_inscritos / max_group_capacity)
            $cantidadGrupos = $totalInscritos > 0
                ? (int) ceil($totalInscritos / $maxPerGroup)
                : 0;

            // 2. Limpiar asignaciones previas para evitar inconsistencias
            Postulant::query()->update(['grupo_id' => null]);
            Group::query()->update(['student_count' => 0]);

            $grupos = [];

            // 3. Crear grupos y asignar los postulantes
            for ($i = 1; $i <= $cantidadGrupos; $i++) {
                $group = Group::firstOrCreate(['name' => "Grupo {$i}"]);
                
                // Obtener rebanada de postulantes
                $slice = $postulants->slice(($i - 1) * $maxPerGroup, $maxPerGroup);
                $sliceCount = $slice->count();

                if ($sliceCount > 0) {
                    // Actualizar grupo_id de postulantes en la rebanada
                    Postulant::whereIn('id', $slice->pluck('id'))->update(['grupo_id' => $group->id]);
                }

                // Actualizar contador del grupo
                $group->update(['student_count' => $sliceCount]);

                $grupos[] = [
                    'id'         => $group->id,
                    'name'       => $group->name,
                    'count'      => $sliceCount,
                    'capacity'   => $maxPerGroup,
                    'percentage' => round(($sliceCount / $maxPerGroup) * 100, 1),
                    'is_full'    => $sliceCount >= $maxPerGroup,
                    'postulants' => $slice->values()->map(function ($p) {
                        return [
                            'id'                 => $p->id,
                            'ci'                 => $p->ci,
                            'nombres'            => $p->nombres,
                            'apellidos'          => $p->apellidos,
                            'correo_electronico' => $p->correo_electronico,
                            'telefono'           => $p->telefono,
                        ];
                    })->toArray(),
                ];
            }

            return [
                'total_inscritos'  => $totalInscritos,
                'cantidad_grupos'  => $cantidadGrupos,
                'capacidad_max'    => $maxPerGroup,
                'formula'          => "CEIL({$totalInscritos} / {$maxPerGroup})",
                'grupos'           => $grupos,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    }
}

