<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CU19 — Gestionar comprobantes y pasarela de pago (Stripe)
 * Agrega campos necesarios para integración con Stripe Checkout.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('postulants', function (Blueprint $table) {
            $table->string('stripe_session_id')->nullable()->after('transaccion_pago_id')
                  ->comment('ID de sesión de Stripe Checkout');
            $table->string('stripe_payment_intent_id')->nullable()->after('stripe_session_id')
                  ->comment('ID del PaymentIntent de Stripe');
            $table->string('stripe_payment_status')->nullable()->default('pending')->after('stripe_payment_intent_id')
                  ->comment('Estado del pago: pending | paid | failed');
        });
    }

    public function down(): void
    {
        Schema::table('postulants', function (Blueprint $table) {
            $table->dropColumn(['stripe_session_id', 'stripe_payment_intent_id', 'stripe_payment_status']);
        });
    }
};
