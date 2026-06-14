<?php

namespace App\Modules\P2_GestionPostulantes\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P2_GestionPostulantes\Models\Notification;
use App\Modules\P2_GestionPostulantes\Models\Postulant;
use Illuminate\Http\JsonResponse;

/**
 * CU25 — Gestionar notificaciones
 * Módulo: P2_GestionPostulantes
 */
class NotificationController extends Controller
{
    public function myNotifications(): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        $postulant = Postulant::where('correo_electronico', $user->email)->first();
        if (!$postulant) {
            return response()->json([
                'success' => true,
                'notifications' => [],
            ]);
        }

        $notifications = Notification::where('postulant_id', $postulant->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success'       => true,
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead($id): JsonResponse
    {
        $notification = Notification::find($id);
        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada.',
            ], 404);
        }

        $notification->update([
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notificación marcada como leída.',
        ]);
    }
}
