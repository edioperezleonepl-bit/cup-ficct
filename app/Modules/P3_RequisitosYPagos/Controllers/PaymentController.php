<?php

namespace App\Modules\P3_RequisitosYPagos\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\P2_GestionPostulantes\Models\Postulant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Stripe\Stripe;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

/**
 * CU06 — Gestionar pagos de inscripción
 * CU19 — Gestionar comprobantes y pasarela de pago (Stripe Checkout)
 * Módulo: P3_RequisitosYPagos
 *
 * Controla la creación de sesiones de Stripe Checkout,
 * la confirmación via Webhook y consulta de estado de pagos.
 */
class PaymentController extends Controller
{
    /**
     * Genera una orden de pago con un QR simulado para el postulante.
     * Mantiene compatibilidad con el sistema anterior.
     *
     * POST /api/postulants/pay/generate
     */
    public function generatePayment(Request $request): JsonResponse
    {
        $request->validate([
            'postulant_id' => 'required|exists:postulants,id',
        ]);

        $postulant = Postulant::find($request->input('postulant_id'));

        // CU05 — Validar requisito obligatorio: Título de Bachiller
        if (!$postulant->titulo_bachiller) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede procesar el pago. El postulante debe entregar primero su Título de Bachiller físico.',
            ], 422);
        }

        // Generar ID de transacción única y simular URL de QR
        $transactionId   = 'TXN-' . strtoupper(uniqid());
        $qrCodeSimulated = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Monto:100Bs|ID:" . $transactionId;

        return response()->json([
            'success'        => true,
            'transaction_id' => $transactionId,
            'amount'         => 100.00,
            'qr_url'         => $qrCodeSimulated,
            'message'        => 'Orden de pago y código QR generados exitosamente.',
        ]);
    }

    /**
     * Confirma el pago desde la pasarela y habilita al postulante en el proceso.
     *
     * POST /api/postulants/pay/confirm
     */
    public function confirmPayment(Request $request): JsonResponse
    {
        $request->validate([
            'postulant_id'   => 'required|exists:postulants,id',
            'transaction_id' => 'required|string',
            'amount'         => 'required|numeric',
        ]);

        $postulant = Postulant::find($request->input('postulant_id'));

        $postulant->update([
            'pago_realizado'      => true,
            'transaccion_pago_id' => $request->input('transaction_id'),
            'monto_pagado'        => $request->input('amount'),
        ]);

        return response()->json([
            'success'   => true,
            'message'   => 'Pago confirmado exitosamente. Postulante habilitado.',
            'postulant' => $this->formatPostulant($postulant->fresh()),
        ]);
    }

    // =========================================================================
    // STRIPE CHECKOUT — CU19 Pasarela de pago real
    // =========================================================================

    /**
     * Crea una sesión de Stripe Checkout para el postulante.
     * Redirige al usuario a la página de pago de Stripe.
     *
     * POST /api/stripe/create-session
     */
    public function createStripeSession(Request $request): JsonResponse
    {
        $request->validate([
            'postulant_id' => 'required|exists:postulants,id',
        ]);

        $postulant = Postulant::find($request->input('postulant_id'));

        // CU05 — Validar requisito: Título de Bachiller
        if (!$postulant->titulo_bachiller) {
            return response()->json([
                'success' => false,
                'message' => 'El postulante debe entregar primero su Título de Bachiller físico.',
            ], 422);
        }

        // Verificar si ya pagó
        if ($postulant->pago_realizado) {
            return response()->json([
                'success' => false,
                'message' => 'Este postulante ya tiene el pago completado.',
            ], 422);
        }

        try {
            Stripe::setApiKey(config('services.stripe.secret'));

            $appUrl = config('app.url');

            // Monto en centavos (USD): 14.50 USD ≈ 100 Bs
            $amountCents = (int) (config('services.stripe.amount_usd', 1450));

            $session = StripeSession::create([
                'payment_method_types' => ['card'],
                'line_items'           => [[
                    'price_data' => [
                        'currency'     => 'usd',
                        'unit_amount'  => $amountCents,
                        'product_data' => [
                            'name'        => 'Matrícula CUP-FICCT',
                            'description' => "Inscripción al Curso Pre-Universitario — {$postulant->nombres} {$postulant->apellidos} (CI: {$postulant->ci})",
                            'images'      => [],
                        ],
                    ],
                    'quantity' => 1,
                ]],
                'mode'                 => 'payment',
                'success_url'          => "{$appUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}&postulant_id={$postulant->id}",
                'cancel_url'           => "{$appUrl}/api/stripe/cancel?postulant_id={$postulant->id}",
                'customer_email'       => $postulant->correo_electronico,
                'metadata'             => [
                    'postulant_id' => $postulant->id,
                    'postulant_ci' => $postulant->ci,
                    'system'       => 'cup-ficct',
                ],
            ]);

            // Guardar la session ID en el postulante
            $postulant->update([
                'stripe_session_id'     => $session->id,
                'stripe_payment_status' => 'pending',
            ]);

            return response()->json([
                'success'     => true,
                'checkout_url' => $session->url,
                'session_id'  => $session->id,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear sesión de pago: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Maneja el retorno exitoso de Stripe Checkout.
     * Verifica el pago y actualiza el postulante.
     *
     * GET /api/stripe/success?session_id=xxx&postulant_id=yyy
     */
    public function paymentSuccess(Request $request)
    {
        $sessionId   = $request->query('session_id');
        $postulantId = $request->query('postulant_id');

        try {
            Stripe::setApiKey(config('services.stripe.secret'));

            $session   = StripeSession::retrieve($sessionId);
            $postulant = Postulant::find($postulantId);

            if ($session && $postulant && $session->payment_status === 'paid') {
                $postulant->update([
                    'pago_realizado'             => true,
                    'transaccion_pago_id'        => $session->payment_intent,
                    'monto_pagado'               => $session->amount_total / 100,
                    'stripe_payment_intent_id'   => $session->payment_intent,
                    'stripe_payment_status'      => 'paid',
                ]);
            }

        } catch (\Exception $e) {
            // Log el error pero redirige al sistema igual
            \Log::error('Stripe success verification failed: ' . $e->getMessage());
        }

        // Redirigir de vuelta al sistema con mensaje de éxito
        return redirect('/?payment=success&postulant=' . $postulantId);
    }

    /**
     * Maneja la cancelación del pago en Stripe.
     *
     * GET /api/stripe/cancel
     */
    public function paymentCancel(Request $request)
    {
        $postulantId = $request->query('postulant_id');

        try {
            $postulant = Postulant::find($postulantId);
            if ($postulant) {
                $postulant->update(['stripe_payment_status' => 'failed']);
            }
        } catch (\Exception $e) {
            \Log::error('Stripe cancel handler failed: ' . $e->getMessage());
        }

        return redirect('/?payment=cancelled');
    }

    /**
     * Webhook de Stripe — confirma pagos automáticamente cuando Stripe notifica.
     * Esta ruta DEBE estar excluida del CSRF middleware.
     *
     * POST /api/stripe/webhook
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $payload   = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $secret    = config('services.stripe.webhook_secret');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (SignatureVerificationException $e) {
            return response()->json(['error' => 'Firma de webhook inválida'], 400);
        }

        // Manejar el evento checkout.session.completed
        if ($event->type === 'checkout.session.completed') {
            $session     = $event->data->object;
            $postulantId = $session->metadata->postulant_id ?? null;

            if ($postulantId) {
                $postulant = Postulant::find($postulantId);
                if ($postulant && $session->payment_status === 'paid') {
                    $postulant->update([
                        'pago_realizado'           => true,
                        'transaccion_pago_id'      => $session->payment_intent,
                        'monto_pagado'             => $session->amount_total / 100,
                        'stripe_payment_intent_id' => $session->payment_intent,
                        'stripe_payment_status'    => 'paid',
                    ]);
                }
            }
        }

        return response()->json(['received' => true]);
    }

    /**
     * Consulta el estado del pago de un postulante.
     *
     * GET /api/stripe/status/{postulant_id}
     */
    public function getPaymentStatus(int $postulantId): JsonResponse
    {
        $postulant = Postulant::findOrFail($postulantId);

        return response()->json([
            'success'               => true,
            'pago_realizado'        => (bool) $postulant->pago_realizado,
            'stripe_payment_status' => $postulant->stripe_payment_status ?? 'pending',
            'transaccion_pago_id'   => $postulant->transaccion_pago_id,
            'monto_pagado'          => (float) $postulant->monto_pagado,
        ]);
    }

    // =========================================================================
    // Helper privado
    // =========================================================================

    private function formatPostulant(Postulant $postulant): array
    {
        return [
            'id'                       => $postulant->id,
            'ci'                       => $postulant->ci,
            'nombres'                  => $postulant->nombres,
            'apellidos'                => $postulant->apellidos,
            'correo'                   => $postulant->correo_electronico,
            'carreraOpcion1'           => $postulant->carreraOpcion1 ? $postulant->carreraOpcion1->name : '',
            'carreraOpcion2'           => $postulant->carreraOpcion2 ? $postulant->carreraOpcion2->name : '',
            'reqTituloBachiller'       => (bool) $postulant->titulo_bachiller,
            'reqCertificadoNacimiento' => true,
            'reqCiFisico'              => true,
            'pagoRealizado'            => (bool) $postulant->pago_realizado,
            'transaccionPagoId'        => $postulant->transaccion_pago_id,
            'montoPagado'              => (float) $postulant->monto_pagado,
            'stripePaymentStatus'      => $postulant->stripe_payment_status ?? 'pending',
        ];
    }
}
