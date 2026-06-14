<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Sembrar Carreras de la FICCT
        $c1 = \App\Models\Career::create(['name' => 'Ingeniería Informática', 'capacity' => 2, 'admitted_count' => 0]);
        $c2 = \App\Models\Career::create(['name' => 'Ingeniería de Sistemas', 'capacity' => 2, 'admitted_count' => 0]);
        $c3 = \App\Models\Career::create(['name' => 'Ingeniería en Redes y Telecomunicaciones', 'capacity' => 2, 'admitted_count' => 0]);
        \App\Models\Career::create(['name' => 'Ingeniería en Diseño y Animación Digital', 'capacity' => 2, 'admitted_count' => 0]);

        // 2. Sembrar Materias del CUP
        \App\Models\Subject::create(['name' => 'Computación']);
        \App\Models\Subject::create(['name' => 'Matemáticas']);
        \App\Models\Subject::create(['name' => 'Inglés']);
        \App\Models\Subject::create(['name' => 'Física']);

        // 3. Sembrar Usuarios del Personal con Roles
        User::create([
            'name' => 'Administrador General',
            'email' => 'admin@ficct.uagrm.edu.bo',
            'password' => bcrypt('7636'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Docente Auxiliar',
            'email' => 'docente@ficct.uagrm.edu.bo',
            'password' => bcrypt('7636'),
            'role' => 'docente',
        ]);

        User::create([
            'name' => 'Decano FICCT',
            'email' => 'autoridad@ficct.uagrm.edu.bo',
            'password' => bcrypt('7636'),
            'role' => 'autoridades',
        ]);

        User::create([
            'name' => 'Coordinador CUP',
            'email' => 'coordinador@ficct.uagrm.edu.bo',
            'password' => bcrypt('7636'),
            'role' => 'coordinador',
        ]);

        // 4. Sembrar cuentas de Alumno (Postulantes)
        User::create([
            'name' => 'Rene Copa (Alumno)',
            'email' => 'alumno@ficct.uagrm.edu.bo',
            'password' => bcrypt('7636'),
            'role' => 'alumno',
        ]);

        User::create([
            'name' => 'Sebastian Arteaga (Alumno)',
            'email' => 'seb@gmail.com',
            'password' => bcrypt('7636'),
            'role' => 'alumno',
        ]);

        // Sembrar registros de postulantes vinculados a los Alumnos
        $postulantsData = [
            [
                'ci' => '1234567',
                'nombres' => 'Rene',
                'apellidos' => 'Copa Justiniano',
                'fecha_nacimiento' => '2005-04-12',
                'sexo' => 'M',
                'direccion' => 'Av. Bush, Calle 4, Nro 45',
                'telefono' => '78945612',
                'correo_electronico' => 'alumno@ficct.uagrm.edu.bo',
                'colegio_procedencia' => 'Colegio La Salle',
                'ciudad' => 'Santa Cruz',
                'titulo_bachiller' => true,
                'pago_realizado' => true,
                'transaccion_pago_id' => 'TXN-SEEDER-RENE',
                'monto_pagado' => 100.00,
                'carrera_opcion1_id' => $c1->id,
                'carrera_opcion2_id' => $c2->id,
                'carrera_admitida_id' => $c1->id,
                'estado_admision' => 'ADMITIDO',
                'grupo_id' => null,
                'grades' => [75.00, 80.00, 85.00],
            ],
            [
                'ci' => '8765432',
                'nombres' => 'Sebastian',
                'apellidos' => 'Arteaga Melgar',
                'fecha_nacimiento' => '2004-08-20',
                'sexo' => 'M',
                'direccion' => 'Av. San Aurelio, Calle 2',
                'telefono' => '71234567',
                'correo_electronico' => 'seb@gmail.com',
                'colegio_procedencia' => 'Colegio La Salle',
                'ciudad' => 'Santa Cruz',
                'titulo_bachiller' => false,
                'pago_realizado' => false,
                'transaccion_pago_id' => null,
                'monto_pagado' => 0.00,
                'carrera_opcion1_id' => $c1->id,
                'carrera_opcion2_id' => $c2->id,
                'carrera_admitida_id' => null,
                'estado_admision' => 'REPROBADO',
                'grupo_id' => null,
                'grades' => [45.00, 50.00, 55.00],
            ]
        ];

        $subjectsList = \App\Models\Subject::all();
        foreach ($postulantsData as $pData) {
            $grades = $pData['grades'];
            unset($pData['grades']);

            $postulant = \App\Models\Postulant::create($pData);

            // Sembrar 3 exámenes por materia para cada postulante
            foreach ($subjectsList as $sub) {
                \App\Models\Exam::create([
                    'postulant_id' => $postulant->id,
                    'subject_id' => $sub->id,
                    'exam_number' => 1,
                    'grade' => $grades[0]
                ]);
                \App\Models\Exam::create([
                    'postulant_id' => $postulant->id,
                    'subject_id' => $sub->id,
                    'exam_number' => 2,
                    'grade' => $grades[1]
                ]);
                \App\Models\Exam::create([
                    'postulant_id' => $postulant->id,
                    'subject_id' => $sub->id,
                    'exam_number' => 3,
                    'grade' => $grades[2]
                ]);

                // Calcular promedio por materia
                $average = array_sum($grades) / 3;
                \App\Models\SubjectAverage::create([
                    'postulant_id' => $postulant->id,
                    'subject_id' => $sub->id,
                    'average' => $average,
                    'status' => $average >= 51 ? 'APROBADO' : 'REPROBADO'
                ]);
            }
        }
    }
}
