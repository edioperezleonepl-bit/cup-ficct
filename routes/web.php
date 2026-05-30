<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\ProcessResultsController;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within the "web" middleware
| group, which contains session state, cookies, and CSRF protection.
|
*/

// Ruta principal para servir la SPA de React
Route::get('/', function () {
    return view('welcome');
});

// Rutas del CUP y Autenticación bajo el prefijo 'api'
// Al estar en web.php, heredan automáticamente el middleware 'StartSession'
Route::prefix('api')->group(function () {
    
    // Autenticación
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/auth-check', [AuthController::class, 'check']);

    // Registro e Ingreso de Notas
    Route::post('/exams/grades', [GradeController::class, 'store']);
    Route::get('/exams/grades/{postulant_id}', [GradeController::class, 'show']);
    
    // Procesamiento y Admisión
    Route::post('/exams/process-averages', [ProcessResultsController::class, 'processAverages']);
    Route::post('/exams/allocate-seats', [ProcessResultsController::class, 'allocateSeats']);
    Route::get('/exams/postulant-summary/{id}', [ProcessResultsController::class, 'getPostulantSummary']);
});
