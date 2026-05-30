import './bootstrap';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import LoginCard, { UserDetails } from './Components/LoginCard';

// Importar exclusivamente los componentes que resuelven los Casos de Uso solicitados
import UserManagementView from './Components/UserManagementView';       // [CU-03] Gestionar usuarios, roles y permisos
import PostulantManagementView from './Components/PostulantManagementView'; // [CU-04] Gestionar postulantes & [CU-06] Requisitos del postulante
import CareerManagementView from './Components/CareerManagementView';       // [CU-07] Gestionar carreras y cupos
import TeacherManagementView from './Components/TeacherManagementView';     // [CU-08] Gestionar docente

// ============================================================================
// Aplicación Principal de Admisión Universitaria (CUP) - FICCT
// ============================================================================
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  
  // Estado de navegación exclusivo para los Casos de Uso requeridos
  const [activeTab, setActiveTab] = useState<'users' | 'postulants' | 'careers' | 'teachers'>('postulants');

  // Datos específicos del Alumno cargados desde el backend
  const [alumnoData, setAlumnoData] = useState<any>(null);
  const [loadingAlumno, setLoadingAlumno] = useState<boolean>(false);

  // ============================================================================
  // CASO DE USO: [CU-01] Iniciar Sesión (Verificar persistencia al cargar)
  // ============================================================================
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/auth-check');
        const result = await response.json();
        if (result.isAuthenticated && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error al verificar autenticación:", err);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyAuth();
  }, []);

  // ============================================================================
  // CASO DE USO: [CU-05] Consultar expediente del postulante (Cargar datos del Alumno)
  // ============================================================================
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'alumno') {
      cargarResumenAlumno();
    }
  }, [isAuthenticated, user]);

  const cargarResumenAlumno = async () => {
    setLoadingAlumno(true);
    try {
      // René Copa es el postulante ID 1 sembrado
      const response = await fetch('/api/exams/postulant-summary/1');
      const result = await response.json();
      if (result.success && result.data) {
        setAlumnoData(result.data);
      }
    } catch (err) {
      console.error("Error al cargar notas del alumno:", err);
    } finally {
      setLoadingAlumno(false);
    }
  };

  // ============================================================================
  // CASO DE USO: [CU-02] Cerrar Sesión
  // ============================================================================
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        setIsAuthenticated(false);
        setUser(null);
        setAlumnoData(null);
        setActiveTab('postulants');
      }
    } catch (err) {
      alert("Error de red al cerrar sesión.");
    }
  };

  // Pantalla de carga mientras se verifica el estado de la sesión
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Verificando sesión activa...</p>
      </div>
    );
  }

  // ============================================================================
  // CASO DE USO: [CU-01] Iniciar Sesión (Renderizar tarjeta de Login si no está autenticado)
  // ============================================================================
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <LoginCard onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setIsAuthenticated(true);
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Barra de Navegación Premium */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo e Identidad */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white text-lg font-black tracking-wider">CUP</span>
              </div>
              <div>
                <h1 className="text-md font-bold tracking-tight text-white">FICCT - UAGRM</h1>
                <p className="text-xxs text-indigo-400 font-semibold uppercase tracking-widest">Admisión Universitaria</p>
              </div>
            </div>

            {/* Menú de Navegación Exclusivo de Casos de Uso (Tabs) - Oculto para alumnos */}
            {user.role !== 'alumno' && (
              <nav className="hidden lg:flex space-x-1">
                {[
                  { id: 'users', label: '👥 Usuarios [CU-03]', rolesAllowed: ['admin'] },
                  { id: 'postulants', label: '📝 Postulantes [CU-04]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
                  { id: 'careers', label: '🏢 Carreras [CU-07]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
                  { id: 'teachers', label: '🍎 Docentes [CU-08]', rolesAllowed: ['admin', 'coordinador'] },
                ].map((tab) => {
                  if (tab.rolesAllowed && !tab.rolesAllowed.includes(user.role)) return null;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-slate-800 text-white border border-slate-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Usuario Autenticado y Botón de [CU-02] Cerrar Sesión */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:text-right lg:block">
                <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider inline-block mt-1 ${
                  user.role === 'admin' 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : user.role === 'docente' 
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {user.role}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-slate-800/80 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 text-xs font-bold rounded-xl px-4 py-2.5 transition-all duration-200 border border-slate-750 hover:border-rose-500/30 flex items-center gap-1.5"
              >
                <span>Cerrar Sesión</span>
                <span>🚪</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Menú Móvil / Tablet - Oculto para alumnos */}
      {user.role !== 'alumno' && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 flex overflow-x-auto py-2 px-4 gap-2 scrollbar-none">
          {[
            { id: 'users', label: '👥 Usuarios [CU-03]', rolesAllowed: ['admin'] },
            { id: 'postulants', label: '📝 Postulantes [CU-04]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
            { id: 'careers', label: '🏢 Carreras [CU-07]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
            { id: 'teachers', label: '🍎 Docentes [CU-08]', rolesAllowed: ['admin', 'coordinador'] },
          ].map((tab) => {
            if (tab.rolesAllowed && !tab.rolesAllowed.includes(user.role)) return null;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Área de Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ====================================================================
            CASO DE USO: [CU-05] Consultar expediente del postulante (Vista Alumno)
            ==================================================================== */}
        {user.role === 'alumno' ? (
          <div className="space-y-6">
            
            {/* Expediente e Indicador de Admisión */}
            {loadingAlumno ? (
              <div className="p-12 text-center text-slate-500">Cargando expediente...</div>
            ) : alumnoData ? (
              <>
                <div className="p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
                      Caso de Uso: [CU-05] Consultar Expediente
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-white">{alumnoData.postulant.apellidos}, {alumnoData.postulant.nombres}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span><strong>CI:</strong> {alumnoData.postulant.ci}</span>
                      <span className="text-slate-700">•</span>
                      <span><strong>Colegio:</strong> Colegio La Salle</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-start">
                    <div className="text-right">
                      <span className="text-xxs text-slate-500 font-bold block uppercase tracking-wider">Resultado Admisión</span>
                      <p className={`text-lg font-black mt-1 ${
                        alumnoData.postulant.estado_admision === 'ADMITIDO' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {alumnoData.postulant.estado_admision === 'ADMITIDO' 
                          ? `🎉 ADMITIDO - ${alumnoData.postulant.carrera_admitida}` 
                          : 'REPROBADO'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Calificaciones por Materia */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {alumnoData.subject_averages.map((avg: any) => {
                    const exams = alumnoData.raw_exams.filter((e: any) => e.subject === avg.subject);

                    return (
                      <div key={avg.subject} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <h4 className="font-bold text-white text-base">{avg.subject}</h4>
                          <span className={`px-2 py-0.5 text-xs font-black rounded border ${
                            avg.status === 'APROBADO' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            {avg.status} ({avg.average} pts)
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {[1, 2, 3].map((num) => {
                            const exam = exams.find((e: any) => e.exam_number === num);
                            return (
                              <div key={num} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-center">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Examen {num}</span>
                                <span className="text-sm font-black text-white mt-1 block">
                                  {exam ? exam.grade : '--'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Promedio General */}
                <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl flex items-center justify-between shadow-2xl">
                  <div>
                    <h4 className="text-base font-bold text-white">Promedio General de Admisión</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Nota global acumulada sobre las 4 asignaturas obligatorias.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-indigo-400">{alumnoData.postulant.promedio_general} pts</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-rose-400">No se pudieron cargar los datos de admisión.</div>
            )}
          </div>
        ) : user.role === 'docente' ? (
          // ====================================================================
          // CASO DE USO: [CU-08] Gestionar Docente (Carga Horaria y Asistencia del Docente)
          // ====================================================================
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 shadow-xl">
              <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-widest rounded-full border border-sky-500/20">
                Portal Exclusivo de Docentes
              </span>
              <h2 className="text-2xl font-black text-white">Carga Horaria y Asistencia</h2>
              <p className="text-xs text-slate-400">
                De acuerdo a las normativas de la FICCT, el docente registra la asistencia de sus asignaturas asignadas.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tu Carga Horaria Asignada</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-sky-400 font-bold uppercase block">Grupo 1 (Matutino)</span>
                    <p className="text-sm font-bold text-white mt-1">Materia: Computación</p>
                    <p className="text-xs text-slate-500 mt-0.5">Horario: Lu - Mi - Vi | 07:00 - 08:30</p>
                  </div>
                  <button 
                    onClick={() => alert('Simulación: Registro de Asistencia Guardado con Éxito.')}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xxs font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    Registrar Asistencia
                  </button>
                </div>

                <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-sky-400 font-bold uppercase block">Grupo 3 (Vespertino)</span>
                    <p className="text-sm font-bold text-white mt-1">Materia: Matemáticas</p>
                    <p className="text-xs text-slate-500 mt-0.5">Horario: Ma - Ju - Sa | 14:00 - 15:30</p>
                  </div>
                  <button 
                    onClick={() => alert('Simulación: Registro de Asistencia Guardado con Éxito.')}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xxs font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    Registrar Asistencia
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ====================================================================
          // ROL ADMINISTRATIVO: Renderizar Exclusivamente los 4 Casos de Uso
          // ====================================================================
          <div className="transition-all duration-300">
            {activeTab === 'users' && <UserManagementView />}
            {activeTab === 'postulants' && <PostulantManagementView />}
            {activeTab === 'careers' && <CareerManagementView />}
            {activeTab === 'teachers' && <TeacherManagementView />}
          </div>
        )}
      </main>

      {/* Pie de Página */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones - UAGRM.</p>
          <p className="mt-1 text-slate-600">Sistema de Control de Admisión Monolítico Estándar</p>
        </div>
      </footer>

    </div>
  );
};

// Montaje en el DOM
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
