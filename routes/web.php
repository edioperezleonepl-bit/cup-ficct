<?php

use Illuminate\Support\Facades\Route;

// ── M1: Autenticación y Seguridad ──────────────────────────────────────────
use App\Modules\P1_AutenticacionSeguridad\Controllers\AuthController;
use App\Modules\P1_AutenticacionSeguridad\Controllers\SystemLogController;
use App\Modules\P1_AutenticacionSeguridad\Controllers\TeacherAttendanceController;
use App\Modules\P1_AutenticacionSeguridad\Controllers\BackupController;

// ── M2: Gestión de Postulantes ─────────────────────────────────────────────
use App\Modules\P2_GestionPostulantes\Controllers\PostulantController;
use App\Modules\P2_GestionPostulantes\Controllers\NotificationController;

// ── M3: Requisitos y Pagos ─────────────────────────────────────────────────
use App\Modules\P3_RequisitosYPagos\Controllers\PaymentController;

// ── M4: Carreras y Grupos ──────────────────────────────────────────────
use App\Modules\P4_CarrerasYGrupos\Controllers\CareerController;
use App\Modules\P4_CarrerasYGrupos\Controllers\GroupController;
use App\Modules\P4_CarrerasYGrupos\Controllers\AcademicAssignmentController;

// ── M5: Exámenes y Calificaciones ─────────────────────────────────────────
use App\Modules\P5_ExamenesYCalificaciones\Controllers\GradeController;
use App\Modules\P5_ExamenesYCalificaciones\Controllers\ProcessResultsController;
use App\Modules\P5_ExamenesYCalificaciones\Controllers\SettingController;

// ── M6: Reportes y Dashboard ───────────────────────────────────────────────
use App\Modules\P6_ReportesYDashboard\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| Web Routes — Sistema CUP-FICCT
|--------------------------------------------------------------------------
|
| Rutas organizadas por módulo siguiendo los casos de uso del documento
| del sistema. Al estar en web.php heredan el middleware 'StartSession'
| (sesiones, cookies y protección CSRF).
|
*/

// Ruta principal para servir la SPA de React
Route::get('/', function () {
    return view('welcome');
});

Route::prefix('api')->group(function () {

    // ── M1: CU01 — Autenticación de usuarios ──────────────────────────────
    Route::post('/login',      [AuthController::class, 'login']);
    Route::post('/logout',     [AuthController::class, 'logout']);
    Route::get('/auth-check',  [AuthController::class, 'check']);
    Route::get('/users',       [AuthController::class, 'usersList']);
    Route::put('/users/{id}/role', [AuthController::class, 'updateRole']);

    // ── M2: CU03/CU04/CU24 — Gestión y carga masiva de postulantes ────────
    Route::get('/postulants',              [PostulantController::class, 'index']);
    Route::post('/postulants',             [PostulantController::class, 'store']);
    Route::post('/postulants/import-csv',  [PostulantController::class, 'importCsv']);
    Route::get('/postulants/attendances',  [PostulantController::class, 'listAttendances']);
    Route::put('/postulants/{id}',         [PostulantController::class, 'update']);
    Route::delete('/postulants/{id}',      [PostulantController::class, 'destroy']);
    Route::get('/postulants/{id}/credential', [PostulantController::class, 'generateCredential']);
    Route::get('/postulants/{id}/verify-qr', [PostulantController::class, 'verifyQr']);
    Route::post('/postulants/{id}/attendance', [PostulantController::class, 'registerAttendance']);


    // ── M3: CU06/CU19 — Pagos e inscripción ───────────────────────────────
    Route::post('/postulants/pay/generate', [PaymentController::class, 'generatePayment']);
    Route::post('/postulants/pay/confirm',  [PaymentController::class, 'confirmPayment']);

    // ── M4: CU07/CU08 — Carreras y cupos ──────────────────────────────────
    Route::get('/careers',       [CareerController::class, 'index']);
    Route::put('/careers/{id}',  [CareerController::class, 'update']);

    // ── M4: CU12 — Distribución real de grupos desde BD ───────────────────
    Route::get('/groups/distribution', [GroupController::class, 'distribution']);

    // ── M5: CU10 — Gestión de calificaciones ──────────────────────────────
    Route::post('/exams/grades',               [GradeController::class, 'store']);
    Route::get('/exams/grades/{postulant_id}', [GradeController::class, 'show']);

    // ── M5: CU11/CU08 — Procesamiento de resultados y asignación de cupos ─
    Route::post('/exams/process-averages',          [ProcessResultsController::class, 'processAverages']);
    Route::post('/exams/allocate-seats',            [ProcessResultsController::class, 'allocateSeats']);
    Route::get('/exams/postulant-summary/{id}',     [ProcessResultsController::class, 'getPostulantSummary']);

    // ── M6: CU15/CU16/CU20 — Reportes, Dashboard y Lista de Espera ──────────
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/approved',  [ReportController::class, 'approvedPostulants']);
    Route::get('/reports/rejected',  [ReportController::class, 'rejectedPostulants']);
    Route::get('/reports/waitlist',  [ReportController::class, 'waitlistPostulants']);

    // ── Nuevos Casos de Uso (Ciclos 1 y 2) ─────────────────────────────────
    // CU17: Bitácora del sistema
    Route::get('/system-logs', [SystemLogController::class, 'index']);

    // CU14: Asignación académica
    Route::get('/academic-assignments', [AcademicAssignmentController::class, 'index']);
    Route::post('/academic-assignments', [AcademicAssignmentController::class, 'store']);
    Route::delete('/academic-assignments/{id}', [AcademicAssignmentController::class, 'destroy']);

    // CU21: Configuración de parámetros académicos
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings/{id}', [SettingController::class, 'update']);

    // CU22: Asistencia docente
    Route::get('/teacher-attendances/my', [TeacherAttendanceController::class, 'myAttendances']);
    Route::post('/teacher-attendances', [TeacherAttendanceController::class, 'store']);

    // CU25: Notificaciones
    Route::get('/notifications/my', [NotificationController::class, 'myNotifications']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // CU26: Respaldo de información
    Route::get('/backup/download', [BackupController::class, 'download']);

    // CU18/CU19: Observaciones y comprobante de postulantes
    Route::post('/postulants/{id}/observations', [PostulantController::class, 'saveObservations']);
    Route::post('/postulants/{id}/upload-receipt', [PostulantController::class, 'uploadReceipt']);

    // ── CU19: Stripe Checkout — Pasarela de pago real ─────────────────────
    Route::post('/stripe/create-session', [PaymentController::class, 'createStripeSession']);
    Route::get('/stripe/status/{postulant_id}', [PaymentController::class, 'getPaymentStatus']);
});

// ── Stripe Webhook (sin CSRF — Stripe no envía token) ─────────────────────
Route::post('/api/stripe/webhook', [PaymentController::class, 'handleWebhook'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

// ── Páginas de retorno de Stripe (redirigen de vuelta a la SPA) ───────────
Route::get('/api/stripe/success', [PaymentController::class, 'paymentSuccess']);
Route::get('/api/stripe/cancel',  [PaymentController::class, 'paymentCancel']);

