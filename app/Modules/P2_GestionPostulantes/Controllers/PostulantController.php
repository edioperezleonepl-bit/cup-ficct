<?php

namespace App\Modules\P2_GestionPostulantes\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P2_GestionPostulantes\Models\Postulant;
use App\Modules\P4_CarrerasYGrupos\Models\Career;
use App\Modules\P1_AutenticacionSeguridad\Models\User;
use App\Modules\P1_AutenticacionSeguridad\Models\SystemLog;
use App\Modules\P2_GestionPostulantes\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

/**
 * CU03 — Gestionar postulantes
 * CU04 — Consultar expediente del postulante
 * CU24 — Gestionar carga masiva de datos (importación CSV)
 * Módulo: P2_GestionPostulantes
 *
 * Administra el registro, consulta, modificación, eliminación
 * e importación masiva de postulantes al curso preuniversitario.
 */
class PostulantController extends Controller
{
    /**
     * Lista todos los postulantes con sus carreras de opción.
     *
     * GET /api/postulants
     */
    public function index(): JsonResponse
    {
        $postulants = Postulant::with(['carreraOpcion1', 'carreraOpcion2'])->get();

        $formatted = $postulants->map(function ($p) {
            return [
                'id'                       => $p->id,
                'ci'                       => $p->ci,
                'nombres'                  => $p->nombres,
                'apellidos'                => $p->apellidos,
                'correo'                   => $p->correo_electronico,
                'carreraOpcion1'           => $p->carreraOpcion1 ? $p->carreraOpcion1->name : '',
                'carreraOpcion2'           => $p->carreraOpcion2 ? $p->carreraOpcion2->name : '',
                'reqTituloBachiller'       => (bool) $p->titulo_bachiller,
                'reqCertificadoNacimiento' => true, // Simulados — no en BD física aún
                'reqCiFisico'              => true,  // Simulados — no en BD física aún
                'pagoRealizado'            => (bool) $p->pago_realizado,
                'transaccionPagoId'        => $p->transaccion_pago_id,
                'montoPagado'              => (float) $p->monto_pagado,
                'observacionesRequisitos'  => $p->observaciones_requisitos,
                'comprobantePago'          => $p->comprobante_pago,
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Registra un nuevo postulante y crea su cuenta de usuario en el sistema.
     *
     * POST /api/postulants
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'ci'            => 'required|string|unique:postulants,ci',
            'nombres'       => 'required|string',
            'apellidos'     => 'required|string',
            'correo'        => 'required|email|unique:postulants,correo_electronico',
            'carreraOpcion1' => 'required|string',
            'carreraOpcion2' => 'required|string',
        ]);

        $c1 = Career::where('name', $request->input('carreraOpcion1'))->first();
        $c2 = Career::where('name', $request->input('carreraOpcion2'))->first();

        // Crear la cuenta del Alumno asociada si no existe
        $email = $request->input('correo');
        $user  = User::where('email', $email)->first();
        if (!$user) {
            User::create([
                'name'     => $request->input('nombres') . ' ' . $request->input('apellidos') . ' (Alumno)',
                'email'    => $email,
                'password' => bcrypt('7636'),
                'role'     => 'alumno',
            ]);
        }

        $postulant = Postulant::create([
            'ci'                 => $request->input('ci'),
            'nombres'            => $request->input('nombres'),
            'apellidos'          => $request->input('apellidos'),
            'fecha_nacimiento'   => '2005-01-01',
            'sexo'               => 'M',
            'direccion'          => 'S/D',
            'telefono'           => '00000000',
            'correo_electronico' => $email,
            'colegio_procedencia' => 'S/D',
            'ciudad'             => 'Santa Cruz',
            'titulo_bachiller'   => (bool) $request->input('reqTituloBachiller'),
            'carrera_opcion1_id' => $c1 ? $c1->id : 1,
            'carrera_opcion2_id' => $c2 ? $c2->id : 2,
            'estado_admision'    => 'PENDIENTE',
        ]);

        SystemLog::log('POSTULANTE_REGISTRADO', "Postulante {$postulant->nombres} {$postulant->apellidos} (CI: {$postulant->ci}) registrado.");

        return response()->json([
            'success'   => true,
            'message'   => 'Postulante y cuenta de usuario creados exitosamente.',
            'postulant' => [
                'id'                       => $postulant->id,
                'ci'                       => $postulant->ci,
                'nombres'                  => $postulant->nombres,
                'apellidos'                => $postulant->apellidos,
                'correo'                   => $postulant->correo_electronico,
                'carreraOpcion1'           => $c1 ? $c1->name : '',
                'carreraOpcion2'           => $c2 ? $c2->name : '',
                'reqTituloBachiller'       => (bool) $postulant->titulo_bachiller,
                'reqCertificadoNacimiento' => true,
                'reqCiFisico'              => true,
                'pagoRealizado'            => (bool) $postulant->pago_realizado,
                'transaccionPagoId'        => $postulant->transaccion_pago_id,
                'montoPagado'              => (float) $postulant->monto_pagado,
            ],
        ]);
    }

    /**
     * Modifica los datos de un postulante existente.
     *
     * PUT /api/postulants/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'ci'            => 'required|string|unique:postulants,ci,' . $id,
            'nombres'       => 'required|string',
            'apellidos'     => 'required|string',
            'correo'        => 'required|email|unique:postulants,correo_electronico,' . $id,
            'carreraOpcion1' => 'required|string',
            'carreraOpcion2' => 'required|string',
        ]);

        $postulant = Postulant::find($id);
        if (!$postulant) {
            return response()->json([
                'success' => false,
                'message' => 'Postulante no encontrado.',
            ], 404);
        }

        $c1 = Career::where('name', $request->input('carreraOpcion1'))->first();
        $c2 = Career::where('name', $request->input('carreraOpcion2'))->first();

        // Actualizar el correo en la cuenta del usuario si corresponde
        $oldEmail = $postulant->correo_electronico;
        $newEmail = $request->input('correo');
        if ($oldEmail !== $newEmail) {
            $user = User::where('email', $oldEmail)->first();
            if ($user) {
                $user->email = $newEmail;
                $user->name  = $request->input('nombres') . ' ' . $request->input('apellidos') . ' (Alumno)';
                $user->save();
            }
        }

        $postulant->update([
            'ci'                 => $request->input('ci'),
            'nombres'            => $request->input('nombres'),
            'apellidos'          => $request->input('apellidos'),
            'correo_electronico' => $newEmail,
            'titulo_bachiller'   => (bool) $request->input('reqTituloBachiller'),
            'carrera_opcion1_id' => $c1 ? $c1->id : $postulant->carrera_opcion1_id,
            'carrera_opcion2_id' => $c2 ? $c2->id : $postulant->carrera_opcion2_id,
        ]);

        SystemLog::log('POSTULANTE_ACTUALIZADO', "Expediente del postulante CI: {$postulant->ci} actualizado.");

        return response()->json([
            'success'   => true,
            'message'   => 'Expediente de postulante actualizado exitosamente.',
            'postulant' => [
                'id'                       => $postulant->id,
                'ci'                       => $postulant->ci,
                'nombres'                  => $postulant->nombres,
                'apellidos'                => $postulant->apellidos,
                'correo'                   => $postulant->correo_electronico,
                'carreraOpcion1'           => $c1 ? $c1->name : '',
                'carreraOpcion2'           => $c2 ? $c2->name : '',
                'reqTituloBachiller'       => (bool) $postulant->titulo_bachiller,
                'reqCertificadoNacimiento' => true,
                'reqCiFisico'              => true,
                'pagoRealizado'            => (bool) $postulant->pago_realizado,
                'transaccionPagoId'        => $postulant->transaccion_pago_id,
                'montoPagado'              => (float) $postulant->monto_pagado,
            ],
        ]);
    }

    /**
     * Elimina un postulante y su cuenta de usuario vinculada.
     *
     * DELETE /api/postulants/{id}
     */
    public function destroy($id): JsonResponse
    {
        $postulant = Postulant::find($id);
        if (!$postulant) {
            return response()->json([
                'success' => false,
                'message' => 'Postulante no encontrado.',
            ], 404);
        }

        // Eliminar cuenta de usuario vinculada
        $user = User::where('email', $postulant->correo_electronico)->first();
        if ($user) {
            $user->delete();
        }

        $ci = $postulant->ci;
        $postulant->delete();

        SystemLog::log('POSTULANTE_ELIMINADO', "Postulante CI: {$ci} eliminado.");

        return response()->json([
            'success' => true,
            'message' => 'Postulante eliminado exitosamente.',
        ]);
    }

    /**
     * Importa postulantes de manera masiva mediante un archivo CSV.
     * CU24 — Gestionar carga masiva de datos
     *
     * POST /api/postulants/import-csv
     */
    public function importCsv(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        $rows    = [];
        $headers = [];
        $bom     = '';

        if (($handle = fopen($path, 'r')) !== false) {
            // Verificar si hay BOM (Byte Order Mark) UTF-8
            $bom = fread($handle, 3);
            if ($bom !== "\xEF\xBB\xBF") {
                rewind($handle);
            }

            // Detectar el separador (coma o punto y coma)
            $firstLine = fgets($handle);
            rewind($handle);
            if ($bom === "\xEF\xBB\xBF") {
                fread($handle, 3);
            }

            $commas    = substr_count($firstLine, ',');
            $semicolons = substr_count($firstLine, ';');
            $separator = ($semicolons > $commas) ? ';' : ',';

            // Obtener y limpiar cabeceras
            $headers = fgetcsv($handle, 1000, $separator);
            if (!$headers) {
                fclose($handle);
                return response()->json([
                    'success' => false,
                    'message' => 'El archivo CSV está vacío o no tiene un formato válido.',
                ], 422);
            }

            $headers = array_map(fn($h) => trim(str_replace(['"', "'"], '', $h)), $headers);

            // Mapear cabeceras a índices
            $headerMap = [];
            foreach ($headers as $index => $header) {
                $hClean = strtolower(trim($header));
                match (true) {
                    $hClean === 'ci'
                        => $headerMap['ci'] = $index,
                    in_array($hClean, ['nombres', 'nombre', 'first_name', 'firstname'])
                        => $headerMap['nombres'] = $index,
                    in_array($hClean, ['apellidos', 'apellido', 'last_name', 'lastname'])
                        => $headerMap['apellidos'] = $index,
                    in_array($hClean, ['correo', 'correo_electronico', 'email'])
                        => $headerMap['correo'] = $index,
                    in_array($hClean, ['carreraopcion1', 'carrera_opcion1', 'carrera 1', 'opcion 1', 'opcion1'])
                        => $headerMap['carreraOpcion1'] = $index,
                    in_array($hClean, ['carreraopcion2', 'carrera_opcion2', 'carrera 2', 'opcion 2', 'opcion2'])
                        => $headerMap['carreraOpcion2'] = $index,
                    in_array($hClean, ['titulo_bachiller', 'titulo bachiller', 'bachiller'])
                        => $headerMap['titulo_bachiller'] = $index,
                    default => null,
                };
            }

            // Validar cabeceras requeridas
            $requiredKeys = ['ci', 'nombres', 'apellidos', 'correo', 'carreraOpcion1', 'carreraOpcion2'];
            $missingKeys  = array_diff($requiredKeys, array_keys($headerMap));

            if (!empty($missingKeys)) {
                fclose($handle);
                return response()->json([
                    'success' => false,
                    'message' => 'El archivo CSV no contiene todas las columnas requeridas. Falta: ' . implode(', ', $missingKeys),
                ], 422);
            }

            // Leer filas de datos
            while (($row = fgetcsv($handle, 1000, $separator)) !== false) {
                if (count($row) === 1 && empty($row[0])) continue;
                $rows[] = $row;
            }
            fclose($handle);
        }

        if (empty($rows)) {
            return response()->json([
                'success' => false,
                'message' => 'El archivo CSV no contiene registros de datos.',
            ], 422);
        }

        $allCareers = Career::all();
        $findCareer = function ($name) use ($allCareers) {
            $nameClean = strtolower(trim($name));
            return $allCareers->first(fn($c) => strtolower(trim($c->name)) === $nameClean);
        };

        $errors       = [];
        $validatedRows = [];
        $csvCis       = [];
        $csvEmails    = [];

        foreach ($rows as $rowIndex => $rowData) {
            $rowNumber = $rowIndex + 2;

            if (count($rowData) < count($headers)) {
                $rowData = array_pad($rowData, count($headers), '');
            }

            $ci               = trim($rowData[$headerMap['ci']] ?? '');
            $nombres          = trim($rowData[$headerMap['nombres']] ?? '');
            $apellidos        = trim($rowData[$headerMap['apellidos']] ?? '');
            $correo           = trim($rowData[$headerMap['correo']] ?? '');
            $carreraOp1Name   = trim($rowData[$headerMap['carreraOpcion1']] ?? '');
            $carreraOp2Name   = trim($rowData[$headerMap['carreraOpcion2']] ?? '');
            $tbVal            = isset($headerMap['titulo_bachiller']) ? trim($rowData[$headerMap['titulo_bachiller']] ?? '') : '';
            $tituloBachiller  = in_array(strtolower($tbVal), ['1', 'true', 'si', 'sí', 'yes', 't', 'ok']);

            $rowErrors = [];

            // Validación de CI
            if (empty($ci)) {
                $rowErrors[] = 'El campo CI es obligatorio.';
            } elseif (in_array($ci, $csvCis)) {
                $rowErrors[] = "El CI '{$ci}' está duplicado dentro del archivo CSV.";
            } else {
                $csvCis[] = $ci;
                if (Postulant::where('ci', $ci)->exists()) {
                    $rowErrors[] = "El postulante con CI '{$ci}' ya está registrado.";
                }
            }

            if (empty($nombres))   $rowErrors[] = 'El campo nombres es obligatorio.';
            if (empty($apellidos)) $rowErrors[] = 'El campo apellidos es obligatorio.';

            // Validación de correo
            if (empty($correo)) {
                $rowErrors[] = 'El campo correo es obligatorio.';
            } elseif (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                $rowErrors[] = "El correo '{$correo}' no tiene un formato válido.";
            } elseif (in_array($correo, $csvEmails)) {
                $rowErrors[] = "El correo '{$correo}' está duplicado dentro del archivo CSV.";
            } else {
                $csvEmails[] = $correo;
                if (Postulant::where('correo_electronico', $correo)->exists()) {
                    $rowErrors[] = "El correo '{$correo}' ya está registrado para otro postulante.";
                }
            }

            // Validación de carreras
            $c1 = $c2 = null;
            if (empty($carreraOp1Name)) {
                $rowErrors[] = 'La carrera Opción 1 es obligatoria.';
            } else {
                $c1 = $findCareer($carreraOp1Name);
                if (!$c1) $rowErrors[] = "La carrera Opción 1 '{$carreraOp1Name}' no existe en el sistema.";
            }

            if (empty($carreraOp2Name)) {
                $rowErrors[] = 'La carrera Opción 2 es obligatoria.';
            } else {
                $c2 = $findCareer($carreraOp2Name);
                if (!$c2) $rowErrors[] = "La carrera Opción 2 '{$carreraOp2Name}' no existe en el sistema.";
            }

            if (!empty($rowErrors)) {
                $errors[] = [
                    'row'       => $rowNumber,
                    'ci'        => $ci ?: 'N/A',
                    'postulant' => ($nombres || $apellidos) ? "{$nombres} {$apellidos}" : 'N/A',
                    'errors'    => $rowErrors,
                ];
            } else {
                $validatedRows[] = [
                    'ci'                 => $ci,
                    'nombres'            => $nombres,
                    'apellidos'          => $apellidos,
                    'correo'             => $correo,
                    'carrera_opcion1_id' => $c1->id,
                    'carrera_opcion2_id' => $c2->id,
                    'titulo_bachiller'   => $tituloBachiller,
                ];
            }
        }

        if (!empty($errors)) {
            return response()->json([
                'success' => false,
                'message' => 'Se encontraron errores de validación en el archivo CSV.',
                'errors'  => $errors,
            ], 422);
        }

        try {
            DB::transaction(function () use ($validatedRows) {
                foreach ($validatedRows as $row) {
                    $user = User::where('email', $row['correo'])->first();
                    if (!$user) {
                        User::create([
                            'name'     => $row['nombres'] . ' ' . $row['apellidos'] . ' (Alumno)',
                            'email'    => $row['correo'],
                            'password' => bcrypt('7636'),
                            'role'     => 'alumno',
                        ]);
                    }

                    Postulant::create([
                        'ci'                  => $row['ci'],
                        'nombres'             => $row['nombres'],
                        'apellidos'           => $row['apellidos'],
                        'fecha_nacimiento'    => '2005-01-01',
                        'sexo'                => 'M',
                        'direccion'           => 'S/D',
                        'telefono'            => '00000000',
                        'correo_electronico'  => $row['correo'],
                        'colegio_procedencia' => 'S/D',
                        'ciudad'              => 'Santa Cruz',
                        'titulo_bachiller'    => $row['titulo_bachiller'],
                        'carrera_opcion1_id'  => $row['carrera_opcion1_id'],
                        'carrera_opcion2_id'  => $row['carrera_opcion2_id'],
                        'estado_admision'     => 'PENDIENTE',
                    ]);
                }
            });

            SystemLog::log('POSTULANTES_IMPORTADOS_CSV', "Importación masiva de " . count($validatedRows) . " postulantes.");

            return response()->json([
                'success' => true,
                'message' => 'Se importaron exitosamente ' . count($validatedRows) . ' postulantes.',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar los postulantes en la base de datos: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Guarda observaciones físicas para los requisitos presentados (CU18).
     *
     * POST /api/postulants/{id}/observations
     */
    public function saveObservations(Request $request, $id): JsonResponse
    {
        $request->validate([
            'observaciones' => 'nullable|string',
        ]);

        $postulant = Postulant::find($id);
        if (!$postulant) {
            return response()->json([
                'success' => false,
                'message' => 'Postulante no encontrado.',
            ], 404);
        }

        $postulant->update([
            'observaciones_requisitos' => $request->input('observaciones'),
        ]);

        SystemLog::log('REQUISITOS_OBSERVADOS', "Observaciones de requisitos actualizadas para postulante CI: {$postulant->ci}");

        Notification::create([
            'postulant_id' => $postulant->id,
            'message'      => "Tus requisitos físicos han sido revisados con observaciones: " . ($request->input('observaciones') ?: 'Sin observaciones relevantes.'),
            'type'         => 'system',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Observaciones de requisitos guardadas exitosamente.',
        ]);
    }

    /**
     * Sube un comprobante de pago digital para el postulante (CU19).
     *
     * POST /api/postulants/{id}/upload-receipt
     */
    public function uploadReceipt(Request $request, $id): JsonResponse
    {
        $request->validate([
            'receipt' => 'required|file|mimes:pdf,jpg,jpeg,png|max:4096',
        ]);

        $postulant = Postulant::find($id);
        if (!$postulant) {
            return response()->json([
                'success' => false,
                'message' => 'Postulante no encontrado.',
            ], 404);
        }

        $file = $request->file('receipt');
        $filename = 'comprobante_' . $postulant->ci . '_' . time() . '.' . $file->getClientOriginalExtension();
        
        // Crear carpeta de subidas si no existe
        $uploadPath = public_path('uploads/comprobantes');
        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }
        
        $file->move($uploadPath, $filename);

        $path = '/uploads/comprobantes/' . $filename;
        $postulant->update([
            'comprobante_pago' => $path,
        ]);

        SystemLog::log('COMPROBANTE_SUBIDO', "Comprobante de pago digital subido para postulante CI: {$postulant->ci}");

        Notification::create([
            'postulant_id' => $postulant->id,
            'message'      => "Tu comprobante de pago ha sido adjuntado con éxito y se encuentra pendiente de revisión.",
            'type'         => 'system',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Comprobante subido exitosamente.',
            'path'    => $path,
        ]);
    }
}
