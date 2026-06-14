<?php

namespace App\Http\Controllers;

use App\Models\Postulant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    /**
     * Genera una orden de pago con un QR simulado.
     * 
     * POST /api/postulants/pay/generate
     */
    public function generatePayment(Request $request): JsonResponse
    {
        $request->validate([
            'postulant_id' => 'required|exists:postulants,id',
        ]);

        $postulant = Postulant::find($request->input('postulant_id'));

        // Validar el requisito obligatorio de Título de Bachiller antes de permitir el pago
        if (!$postulant->titulo_bachiller) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede procesar el pago. El postulante debe entregar primero su Título de Bachiller físico.'
            ], 422);
        }

        // Generar una ID de transacción única y simular una URL de QR
        $transactionId = 'TXN-' . strtoupper(uniqid());
        $qrCodeSimulated = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Monto:100Bs|ID:" . $transactionId;

        return response()->json([
            'success' => true,
            'transaction_id' => $transactionId,
            'amount' => 100.00,
            'qr_url' => $qrCodeSimulated,
            'message' => 'Orden de pago y código QR generados exitosamente.'
        ]);
    }

    /**
     * Confirma el pago de la pasarela y actualiza la base de datos.
     * 
     * POST /api/postulants/pay/confirm
     */
    public function confirmPayment(Request $request): JsonResponse
    {
        $request->validate([
            'postulant_id' => 'required|exists:postulants,id',
            'transaction_id' => 'required|string',
            'amount' => 'required|numeric'
        ]);

        $postulant = Postulant::find($request->input('postulant_id'));

        $postulant->update([
            'pago_realizado' => true,
            'transaccion_pago_id' => $request->input('transaction_id'),
            'monto_pagado' => $request->input('amount')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pago confirmado exitosamente. Postulante habilitado.',
            'postulant' => [
                'id' => $postulant->id,
                'ci' => $postulant->ci,
                'nombres' => $postulant->nombres,
                'apellidos' => $postulant->apellidos,
                'correo' => $postulant->correo_electronico,
                'carreraOpcion1' => $postulant->carreraOpcion1 ? $postulant->carreraOpcion1->name : '',
                'carreraOpcion2' => $postulant->carreraOpcion2 ? $postulant->carreraOpcion2->name : '',
                'reqTituloBachiller' => (bool)$postulant->titulo_bachiller,
                'reqCertificadoNacimiento' => true,
                'reqCiFisico' => true,
                'pagoRealizado' => true,
                'transaccionPagoId' => $postulant->transaccion_pago_id,
                'montoPagado' => (float)$postulant->monto_pagado,
            ]
        ]);
    }
}
