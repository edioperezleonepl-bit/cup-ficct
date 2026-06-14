<?php

namespace App\Modules\P1_AutenticacionSeguridad\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P1_AutenticacionSeguridad\Models\User;
use App\Modules\P1_AutenticacionSeguridad\Models\SystemLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * CU01 — Gestionar autenticación de usuarios
 * Módulo: P1_AutenticacionSeguridad
 *
 * Permite a los usuarios del sistema (Administrador, Coordinador,
 * Docente, Autoridad, Postulante) iniciar y cerrar sesión de forma segura.
 */
class AuthController extends Controller
{
    /**
     * Inicia la sesión de un usuario (Admin/Docente/Autoridad/Coordinador).
     *
     * POST /api/login
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            $user = Auth::user();

            SystemLog::log('INICIO_SESION', "El usuario '{$user->name}' ({$user->email}) inició sesión con rol '{$user->role}'.");

            return response()->json([
                'success' => true,
                'message' => 'Sesión iniciada con éxito.',
                'user'    => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'El correo electrónico o la contraseña son incorrectos.',
        ], 401);
    }

    /**
     * Cierra la sesión activa del usuario.
     *
     * POST /api/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $user = Auth::user();
        if ($user) {
            SystemLog::log('CIERRE_SESION', "El usuario '{$user->name}' ({$user->email}) cerró su sesión.");
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente.',
        ]);
    }

    /**
     * Verifica en tiempo de ejecución si existe una sesión activa persistente.
     * Útil al refrescar la página en React.
     *
     * GET /api/auth-check
     */
    public function check(Request $request): JsonResponse
    {
        if (Auth::check()) {
            $user = Auth::user();

            return response()->json([
                'isAuthenticated' => true,
                'user'            => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                ],
            ]);
        }

        return response()->json([
            'isAuthenticated' => false,
        ]);
    }

    /**
     * Retorna la lista de todos los usuarios registrados en el sistema (CU02).
     *
     * GET /api/users
     */
    public function usersList(): JsonResponse
    {
        $users = User::all()->map(function ($u) {
            // Asignar permisos estáticos simulados según el rol para consistencia
            $perms = match($u->role) {
                'admin'        => ['Acceso Total', 'Modificar Notas', 'Redirección Cupos'],
                'docente'      => ['Ver Carga Horaria', 'Registrar Asistencia', 'Registrar Notas'],
                'alumno'       => ['Ver Notas Propias', 'Ver Estado Admisión'],
                'autoridades'  => ['Ver Reportes CUP', 'Ver Dashboard'],
                'coordinador'  => ['Registrar Postulante', 'Cargar Notas'],
                default        => [],
            };
            return [
                'id'          => $u->id,
                'name'        => $u->name,
                'email'       => $u->email,
                'role'        => $u->role,
                'permissions' => $perms,
            ];
        });

        return response()->json([
            'success' => true,
            'users'   => $users,
        ]);
    }

    /**
     * Actualiza el rol de un usuario (CU02).
     *
     * PUT /api/users/{id}/role
     */
    public function updateRole(Request $request, $id): JsonResponse
    {
        $request->validate([
            'role' => 'required|string|in:admin,docente,alumno,autoridades,coordinador',
        ]);

        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $oldRole = $user->role;
        $user->update([
            'role' => $request->input('role'),
        ]);

        SystemLog::log('ROL_USUARIO_MODIFICADO', "Rol de usuario '{$user->name}' cambiado de '{$oldRole}' a '{$user->role}'.");

        return response()->json([
            'success' => true,
            'message' => 'Rol actualizado con éxito.',
        ]);
    }
}
