<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('postulants', function (Blueprint $table) {
            $table->text('observaciones_requisitos')->nullable()->comment('Observaciones de la revisión física de documentos (CU18)');
            $table->string('comprobante_pago')->nullable()->comment('Nombre/ruta del comprobante de pago adjuntado (CU19)');
        });
    }

    public function down(): void
    {
        Schema::table('postulants', function (Blueprint $table) {
            $table->dropColumn(['observaciones_requisitos', 'comprobante_pago']);
        });
    }
};
