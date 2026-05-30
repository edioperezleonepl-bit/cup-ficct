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

        // 4. Sembrar cuenta de Alumno (Postulante)
        User::create([
            'name' => 'Rene Copa (Alumno)',
            'email' => 'alumno@ficct.uagrm.edu.bo',
            'password' => bcrypt('7636'),
            'role' => 'alumno',
        ]);

        // Sembrar registro de postulante vinculado al Alumno
        $postulant = \App\Models\Postulant::create([
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
            'carrera_opcion1_id' => $c1->id,
            'carrera_opcion2_id' => $c2->id,
            'carrera_admitida_id' => $c1->id,
            'estado_admision' => 'ADMITIDO',
            'grupo_id' => null,
        ]);

        // Sembrar 3 exámenes por materia para el alumno
        $subjectsList = \App\Models\Subject::all();
        foreach ($subjectsList as $sub) {
            \App\Models\Exam::create([
                'postulant_id' => $postulant->id,
                'subject_id' => $sub->id,
                'exam_number' => 1,
                'grade' => 75.00
            ]);
            \App\Models\Exam::create([
                'postulant_id' => $postulant->id,
                'subject_id' => $sub->id,
                'exam_number' => 2,
                'grade' => 80.00
            ]);
            \App\Models\Exam::create([
                'postulant_id' => $postulant->id,
                'subject_id' => $sub->id,
                'exam_number' => 3,
                'grade' => 85.00
            ]);

            // Crear el promedio de materia
            \App\Models\SubjectAverage::create([
                'postulant_id' => $postulant->id,
                'subject_id' => $sub->id,
                'average' => 80.00,
                'status' => 'APROBADO'
            ]);
        }
    }
}
