<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('postulants', function (Blueprint $table) {
            $table->boolean('pago_realizado')->default(false)->after('titulo_bachiller');
            $table->string('transaccion_pago_id')->nullable()->after('pago_realizado');
            $table->decimal('monto_pagado', 8, 2)->default(0.00)->after('transaccion_pago_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('postulants', function (Blueprint $table) {
            $table->dropColumn(['pago_realizado', 'transaccion_pago_id', 'monto_pagado']);
        });
    }
};
