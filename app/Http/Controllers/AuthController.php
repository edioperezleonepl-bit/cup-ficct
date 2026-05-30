<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            $user = Auth::user();

            return response()->json([
                'success' => true,
                'message' => 'Sesión iniciada con éxito.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ]
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'El correo electrónico o la contraseña son incorrectos.'
        ], 401);
    }

    /**
     * Cierra la sesión activa del usuario.
     * 
     * POST /api/logout
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente.'
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
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ]
            ]);
        }

        return response()->json([
            'isAuthenticated' => false
        ]);
    }
}
