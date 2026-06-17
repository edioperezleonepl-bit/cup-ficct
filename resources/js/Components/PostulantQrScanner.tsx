import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface PostulantInfo {
  id: number;
  ci: string;
  nombres: string;
  apellidos: string;
  carrera: string;
  grupo: string;
  aulas: string;
  pago_realizado: boolean;
  titulo_bachiller: boolean;
  estado_admision: string;
  ya_ingreso: boolean;
  ingreso_at: string | null;
  ingreso_status: string | null;
}

interface AttendanceLog {
  id: number;
  postulant_id: number;
  ci: string;
  nombre: string;
  carrera: string;
  grupo: string;
  status: string;
  scanned_at: string;
  scanner_name: string;
  comments: string | null;
}

export const PostulantQrScanner: React.FC = () => {
  const [activeScanner, setActiveScanner] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [postulant, setPostulant] = useState<PostulantInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [attendanceStatus, setAttendanceStatus] = useState<string>('PRESENTE');
  const [comments, setComments] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Initialize QR scanner
  useEffect(() => {
    let html5QrcodeScanner: Html5QrcodeScanner | null = null;
    
    if (activeScanner) {
      const timer = setTimeout(() => {
        const element = document.getElementById("qr-reader-container");
        if (element) {
          html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader-container",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
          );
          html5QrcodeScanner.render(
            (decodedText) => {
              handleQrDecoded(decodedText);
            },
            (error) => {
              // Quietly ignore scan failures to avoid logs spam
            }
          );
        }
      }, 300);
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(err => {
          console.warn("Failed to clear html5QrcodeScanner:", err);
        });
      }
    };
  }, [activeScanner]);

  // Load recent attendances on mount
  useEffect(() => {
    fetchRecentLogs();
  }, []);

  const fetchRecentLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('/api/postulants/attendances');
      const data = await response.json();
      if (data.success) {
        // Sort descending by id to get newest scans first
        const sorted = (data.attendances || []).sort((a: any, b: any) => b.id - a.id);
        setRecentLogs(sorted);
      }
    } catch (err) {
      console.error("Error al cargar asistencias recientes:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleQrDecoded = (text: string) => {
    // Expected format: CUP-POSTULANT-ID:12
    if (text.startsWith("CUP-POSTULANT-ID:")) {
      const idStr = text.replace("CUP-POSTULANT-ID:", "").trim();
      fetchPostulantInfo(idStr);
    } else {
      // Fallback: try using the plain text as CI or ID
      fetchPostulantInfo(text.trim());
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    fetchPostulantInfo(searchQuery.trim());
  };

  const fetchPostulantInfo = async (idOrCi: string) => {
    setLoading(true);
    setErrorMsg(null);
    setPostulant(null);
    setSuccessMsg(null);
    try {
      const response = await fetch(`/api/postulants/${idOrCi}/verify-qr`);
      const data = await response.json();
      if (response.ok && data.success) {
        setPostulant(data.postulant);
        // Desactivar el scanner temporalmente para revisar la ficha
        setActiveScanner(false);
      } else {
        setErrorMsg(data.message || 'Postulante no encontrado.');
      }
    } catch (err) {
      setErrorMsg('Error de red al consultar los datos del postulante.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAttendance = async () => {
    if (!postulant) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch(`/api/postulants/${postulant.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          status: attendanceStatus,
          comments: comments
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`¡Ingreso registrado exitosamente como ${attendanceStatus}!`);
        // Volver a cargar los datos para reflejar que ya ingresó
        setPostulant(prev => prev ? { ...prev, ya_ingreso: true, ingreso_at: data.attendance.scanned_at, ingreso_status: data.attendance.status } : null);
        setComments('');
        fetchRecentLogs();
        
        // Reactivar el scanner después de 2.5 segundos
        setTimeout(() => {
          handleReset();
        }, 2500);
      } else {
        setErrorMsg(data.message || 'Error al registrar la asistencia.');
      }
    } catch (err) {
      setErrorMsg('Error de red al registrar la asistencia.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPostulant(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setComments('');
    setAttendanceStatus('PRESENTE');
    setActiveScanner(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 shadow-xl">
        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-500/20">
          Módulo de Ingreso Seguro [CU-27]
        </span>
        <h2 className="text-2xl font-black text-white">Control de Acceso y Asistencia por Código QR</h2>
        <p className="text-xs text-slate-400">
          Escanee la credencial del postulante para validar su identidad en tiempo real, comprobar el cumplimiento de requisitos (anti-fraude) y autorizar el ingreso al aula de examen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado Izquierdo: Escáner y Búsqueda */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Scanner Viewport */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cámara Escáner QR</h3>
              <button
                type="button"
                onClick={() => setActiveScanner(!activeScanner)}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border transition-all ${
                  activeScanner 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {activeScanner ? 'Apagar Cámara' : 'Encender Cámara'}
              </button>
            </div>

            {activeScanner ? (
              <div className="relative border border-slate-850 rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center min-h-[300px] p-2">
                {/* Animación del visor */}
                <div className="absolute inset-0 border-[3px] border-indigo-500/10 pointer-events-none rounded-2xl"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-500/40 animate-pulse pointer-events-none shadow-md shadow-indigo-500/30"></div>
                
                <div id="qr-reader-container" className="w-full max-w-[320px] mx-auto overflow-hidden bg-transparent"></div>
              </div>
            ) : (
              <div className="border border-slate-850 rounded-2xl bg-slate-950 flex flex-col items-center justify-center min-h-[300px] p-6 text-center text-slate-500 space-y-3">
                <span className="text-4xl">📷</span>
                <p className="text-xs font-medium uppercase tracking-wider">Cámara desactivada</p>
                <p className="text-xxs text-slate-650 max-w-[200px]">Encienda la cámara o utilice la búsqueda manual para registrar asistencia.</p>
              </div>
            )}

            {/* Búsqueda Manual Fallback */}
            <form onSubmit={handleManualSearch} className="pt-2 space-y-2 border-t border-slate-850">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Búsqueda / Registro Manual</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ingrese ID o CI del postulante..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/30"
                />
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl px-4 py-2.5 border border-indigo-500/20 shadow-md transition-all shrink-0"
                >
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Lado Derecho: Ficha de Verificación / Resultados */}
        <div className="lg:col-span-7">
          
          {/* Ficha de Validación */}
          {loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 shadow-xl flex flex-col items-center justify-center space-y-4 min-h-[445px]">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Obteniendo expediente del postulante...</p>
            </div>
          )}

          {!loading && !postulant && !errorMsg && (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-12 shadow-xl flex flex-col items-center justify-center text-center space-y-4 min-h-[445px]">
              <div className="w-16 h-16 rounded-full bg-slate-950/60 flex items-center justify-center border border-slate-850">
                <span className="text-3xl text-slate-600">👤</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Esperando Registro de Ingreso</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Escanee un código QR válido o busque de forma manual para verificar los requisitos y estado de admisión del alumno.
                </p>
              </div>
            </div>
          )}

          {!loading && errorMsg && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-4 min-h-[445px]">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Error de Consulta</h4>
                <p className="text-xs text-rose-400 mt-1 max-w-sm mx-auto font-medium">{errorMsg}</p>
                <button
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-750 transition-all"
                >
                  Volver a intentar
                </button>
              </div>
            </div>
          )}

          {!loading && postulant && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden min-h-[445px] flex flex-col justify-between">
              
              {/* Card Header con Estado de Ingreso */}
              <div className={`p-5 flex justify-between items-center border-b border-slate-800 ${
                postulant.ya_ingreso ? 'bg-indigo-950/20' : 'bg-slate-950/30'
              }`}>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ficha de Control de Entrada</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  postulant.ya_ingreso
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {postulant.ya_ingreso ? 'INGRESO REGISTRADO' : 'APTO PARA CONTROL'}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 md:p-8 space-y-6 flex-1">
                
                {/* Alerta de Éxito / Warning */}
                {successMsg && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
                    <span>✅</span> {successMsg}
                  </div>
                )}

                {/* Warning de Requisitos Incompletos (Antifraude) */}
                {(!postulant.pago_realizado || !postulant.titulo_bachiller) && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-xs font-medium space-y-1">
                    <p className="font-bold flex items-center gap-1.5">⚠️ ALERTA DE COMPLIANCE / REQUISITOS:</p>
                    <p className="text-xxs text-amber-400/80">
                      El postulante tiene requisitos obligatorios pendientes. Revise las observaciones físicas antes de autorizar el ingreso.
                    </p>
                  </div>
                )}

                {/* Perfil del Alumno */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-950 border border-slate-750 flex items-center justify-center text-4xl shadow-md shrink-0">
                    🎓
                  </div>
                  <div className="space-y-2.5 text-center sm:text-left flex-1">
                    <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                      {postulant.apellidos}, {postulant.nombres}
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span><strong>Documento (CI):</strong> {postulant.ci}</span>
                      <span><strong>Grupo Asignado:</strong> {postulant.grupo}</span>
                      <span className="col-span-2"><strong>Carrera Opción 1:</strong> {postulant.carrera}</span>
                      <span className="col-span-2"><strong>Aula Examen:</strong> <span className="text-indigo-400 font-bold">{postulant.aulas}</span></span>
                    </div>
                  </div>
                </div>

                {/* Estado de Requisitos y Asistencia Previa (Semáforo) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Pago */}
                  <div className={`p-4 rounded-2xl border text-center ${
                    postulant.pago_realizado 
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                      : 'bg-rose-500/5 border-rose-500/10 text-rose-400'
                  }`}>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Matrícula Pagada</span>
                    <span className="text-sm font-black mt-1 block">
                      {postulant.pago_realizado ? '✅ CONFIRMADO' : '❌ SIN REGISTRO'}
                    </span>
                  </div>

                  {/* Título de Bachiller */}
                  <div className={`p-4 rounded-2xl border text-center ${
                    postulant.titulo_bachiller 
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                      : 'bg-amber-500/5 border-amber-500/10 text-amber-400'
                  }`}>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Título Bachiller</span>
                    <span className="text-sm font-black mt-1 block">
                      {postulant.titulo_bachiller ? '✅ ENTREGADO' : '⚠️ PENDIENTE'}
                    </span>
                  </div>

                  {/* Registro de Asistencia */}
                  <div className={`p-4 rounded-2xl border text-center ${
                    postulant.ya_ingreso 
                      ? 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400' 
                      : 'bg-slate-950/40 border-slate-850 text-slate-400'
                  }`}>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Control Ingreso</span>
                    <span className="text-xs font-black mt-1 block truncate">
                      {postulant.ya_ingreso ? `⌛ EN AULA (${postulant.ingreso_status})` : '⚪ PENDIENTE INGRESO'}
                    </span>
                  </div>
                </div>

                {/* Si ya ingresó, mostrar detalles */}
                {postulant.ya_ingreso && (
                  <div className="p-3 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl text-center text-xs text-indigo-400">
                    Ingreso registrado el <strong>{postulant.ingreso_at}</strong>
                  </div>
                )}

                {/* Formulario de registro (Observaciones y Botón) */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row gap-3">
                    
                    {/* Estado de registro */}
                    <div className="w-full sm:w-40 shrink-0">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Estado Control</label>
                      <select
                        value={attendanceStatus}
                        onChange={(e) => setAttendanceStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/35"
                      >
                        <option value="PRESENTE">PRESENTE</option>
                        <option value="TARDE">TARDE</option>
                        <option value="OBSERVADO">OBSERVADO</option>
                      </select>
                    </div>

                    {/* Comentarios */}
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Observaciones de Ingreso</label>
                      <input
                        type="text"
                        placeholder="Comentarios del control de ingreso (ej. CI físico verificado)..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-white placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/35"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Card Footer con Acciones */}
              <div className="p-5 bg-slate-950/30 border-t border-slate-800 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-750 transition-all text-center"
                >
                  Limpiar / Escanear Siguiente
                </button>
                <button
                  onClick={handleRegisterAttendance}
                  disabled={saving || (postulant.ya_ingreso && attendanceStatus === postulant.ingreso_status)}
                  className={`px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all border shadow-lg text-center ${
                    postulant.ya_ingreso
                      ? 'bg-indigo-650 hover:bg-indigo-600 border-indigo-500/20 text-white'
                      : 'bg-emerald-650 hover:bg-emerald-650 border-emerald-500/20 text-white shadow-emerald-950/20'
                  }`}
                >
                  {saving ? 'Registrando...' : postulant.ya_ingreso ? 'Actualizar Ingreso' : 'Autorizar y Registrar Asistencia'}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Historial de Ingresos de Postulantes */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historial Reciente de Ingresos</h3>
            <p className="text-xxs text-slate-500 mt-0.5">Muestra los alumnos que ingresaron recientemente por puerta y su estado de cumplimiento.</p>
          </div>
          <button
            onClick={fetchRecentLogs}
            disabled={loadingLogs}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 text-slate-400 hover:text-white text-xxs font-bold rounded-lg border border-slate-750 transition-all shrink-0"
          >
            {loadingLogs ? 'Cargando...' : '↻ Refrescar Lista'}
          </button>
        </div>

        <div className="overflow-x-auto bg-slate-950/40 border border-slate-850 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-400 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Fecha / Hora</th>
                <th className="p-4">Postulante (CI)</th>
                <th className="p-4">Carrera Opción 1</th>
                <th className="p-4">Grupo</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Registrado Por</th>
                <th className="p-4">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingLogs && recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 uppercase tracking-widest animate-pulse font-bold">
                    Cargando historial de accesos...
                  </td>
                </tr>
              ) : recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No se han registrado ingresos de postulantes el día de hoy.
                  </td>
                </tr>
              ) : (
                recentLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                    <td className="p-4 font-mono text-[10px] text-slate-500">{log.scanned_at}</td>
                    <td className="p-4">
                      <div className="font-bold text-white text-xs">{log.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">CI: {log.ci}</div>
                    </td>
                    <td className="p-4 text-slate-350">{log.carrera}</td>
                    <td className="p-4 font-bold text-indigo-400">{log.grupo}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase ${
                        log.status === 'PRESENTE'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : log.status === 'TARDE'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-medium">{log.scanner_name}</td>
                    <td className="p-4 text-slate-500 italic text-xxs truncate max-w-[150px]" title={log.comments || ''}>
                      {log.comments || 'Sin observaciones.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default PostulantQrScanner;
