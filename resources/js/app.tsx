import './bootstrap';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import LoginCard, { UserDetails } from './Components/LoginCard';

// Importar exclusivamente los componentes que resuelven los Casos de Uso solicitados
import UserManagementView from './Components/UserManagementView';       // [CU-03] Gestionar usuarios, roles y permisos
import PostulantManagementView from './Components/PostulantManagementView'; // [CU-04] Gestionar postulantes & [CU-06] Requisitos del postulante
import CareerManagementView from './Components/CareerManagementView';       // [CU-07] Gestionar carreras y cupos
import GroupDistributionView from './Components/GroupDistributionView';       // [CU-12] Distribución de grupos
import TeacherManagementView from './Components/TeacherManagementView';     // [CU-08] Gestionar docente
import GradeEntryForm from './Components/GradeEntryForm';                 // Módulo de Notas
import SettingManagementView from './Components/SettingManagementView';   // [CU-21] Configuración del Sistema & [CU-26] Respaldo
import AcademicAssignmentView from './Components/AcademicAssignmentView'; // [CU-14] Asignación Académica
import SystemLogView from './Components/SystemLogView';                   // [CU-17] Bitácora del Sistema
import DashboardOverview from './Components/DashboardOverview';           // [CU-15/16/20/23] Dashboard y Reportes
import PostulantQrScanner from './Components/PostulantQrScanner';           // Control de Asistencia QR [CU-27]

// ============================================================================
// Aplicación Principal de Admisión Universitaria (CUP) - FICCT
// ============================================================================
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  
  // Estado de navegación exclusivo para los Casos de Uso requeridos
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Datos específicos del Alumno cargados desde el backend
  const [alumnoData, setAlumnoData] = useState<any>(null);
  const [loadingAlumno, setLoadingAlumno] = useState<boolean>(false);

  // Estados de Notificaciones (CU25)
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  // Estados de Docente (CU22)
  const [docenteAssignments, setDocenteAssignments] = useState<any[]>([]);
  const [docenteAttendances, setDocenteAttendances] = useState<any[]>([]);
  const [loadingDocente, setLoadingDocente] = useState<boolean>(false);
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: number]: string }>({});
  const [attendanceComments, setAttendanceComments] = useState<{ [key: number]: string }>({});
  const [submittingAttendance, setSubmittingAttendance] = useState<{ [key: number]: boolean }>({});

  // Establecer pestaña activa por defecto según el rol del usuario autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'docente') {
        setActiveTab('docente-dashboard');
      } else if (user.role === 'admin' || user.role === 'coordinador' || user.role === 'autoridades') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('postulants');
      }
    }
  }, [isAuthenticated, user]);

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
      // Obtener dinámicamente el expediente del alumno autenticado
      const response = await fetch('/api/exams/postulant-summary/my');
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
  // CASO DE USO: [CU-25] Gestionar Notificaciones (Cargar notificaciones del Alumno)
  // ============================================================================
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'alumno') {
      cargarNotificaciones();
    }
  }, [isAuthenticated, user]);

  const cargarNotificaciones = async () => {
    setLoadingNotifications(true);
    try {
      const response = await fetch('/api/notifications/my');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
        );
      }
    } catch (err) {
      console.error("Error al marcar como leída:", err);
    }
  };

  // ============================================================================
  // CASO DE USO: [CU-22] Gestionar Asistencia Docente (Cargar datos del Docente)
  // ============================================================================
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'docente') {
      cargarDatosDocente();
    }
  }, [isAuthenticated, user]);

  const cargarDatosDocente = async () => {
    setLoadingDocente(true);
    try {
      const response = await fetch('/api/teacher-attendances/my');
      const data = await response.json();
      if (data.success) {
        setDocenteAssignments(data.assignments || []);
        setDocenteAttendances(data.attendances || []);
      }
    } catch (err) {
      console.error("Error al cargar datos del docente:", err);
    } finally {
      setLoadingDocente(false);
    }
  };

  const handleRegisterAttendance = async (assignmentId: number) => {
    const status = attendanceStatus[assignmentId] || 'PRESENTE';
    const comments = attendanceComments[assignmentId] || '';

    setSubmittingAttendance(prev => ({ ...prev, [assignmentId]: true }));
    try {
      const response = await fetch('/api/teacher-attendances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          assignment_id: assignmentId,
          date: new Date().toISOString().split('T')[0],
          status,
          comments
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert('Asistencia registrada con éxito.');
        cargarDatosDocente();
      } else {
        alert(result.message || 'Error al registrar asistencia.');
      }
    } catch (err) {
      alert('Error de red al registrar asistencia.');
    } finally {
      setSubmittingAttendance(prev => ({ ...prev, [assignmentId]: false }));
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
                  { id: 'dashboard', label: '📊 Reportes [CU-15/16/20/23]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
                  { id: 'users', label: '👥 Usuarios [CU-03]', rolesAllowed: ['admin'] },
                  { id: 'postulants', label: '📝 Postulantes [CU-04]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
                  { id: 'qr-scanner', label: '📷 Escáner Asistencia [CU-27]', rolesAllowed: ['admin', 'coordinador', 'docente'] },
                  { id: 'careers', label: '🏢 Carreras [CU-07]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
                  { id: 'groups', label: '📦 Grupos [CU-12]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
                  { id: 'teachers', label: '🍎 Docentes [CU-08]', rolesAllowed: ['admin', 'coordinador'] },
                  { id: 'assignments', label: '📅 Asignaciones [CU-14]', rolesAllowed: ['admin', 'coordinador'] },
                  { id: 'grades', label: '🎓 Calificaciones [CU-08]', rolesAllowed: ['admin', 'coordinador', 'docente'] },
                  { id: 'settings', label: '⚙️ Configuración [CU-21/26]', rolesAllowed: ['admin', 'coordinador'] },
                  { id: 'logs', label: '📜 Bitácora [CU-17]', rolesAllowed: ['admin', 'coordinador'] },
                  { id: 'docente-dashboard', label: '📅 Carga Horaria [CU-08]', rolesAllowed: ['docente'] },
                ].map((tab) => {
                  if (tab.rolesAllowed && !tab.rolesAllowed.includes(user.role)) return null;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
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
            { id: 'dashboard', label: '📊 Reportes [CU-15/16/20/23]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
            { id: 'users', label: '👥 Usuarios [CU-03]', rolesAllowed: ['admin'] },
            { id: 'postulants', label: '📝 Postulantes [CU-04]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
            { id: 'qr-scanner', label: '📷 Escáner Asistencia [CU-27]', rolesAllowed: ['admin', 'coordinador', 'docente'] },
            { id: 'careers', label: '🏢 Carreras [CU-07]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
            { id: 'groups', label: '📦 Grupos [CU-12]', rolesAllowed: ['admin', 'coordinador', 'autoridades'] },
            { id: 'teachers', label: '🍎 Docentes [CU-08]', rolesAllowed: ['admin', 'coordinador'] },
            { id: 'assignments', label: '📅 Asignaciones [CU-14]', rolesAllowed: ['admin', 'coordinador'] },
            { id: 'grades', label: '🎓 Calificaciones [CU-08]', rolesAllowed: ['admin', 'coordinador', 'docente'] },
            { id: 'settings', label: '⚙️ Configuración [CU-21/26]', rolesAllowed: ['admin', 'coordinador'] },
            { id: 'logs', label: '📜 Bitácora [CU-17]', rolesAllowed: ['admin', 'coordinador'] },
            { id: 'docente-dashboard', label: '📅 Carga Horaria [CU-08]', rolesAllowed: ['docente'] },
          ].map((tab) => {
            if (tab.rolesAllowed && !tab.rolesAllowed.includes(user.role)) return null;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                        alumnoData.postulant.estado_admision === 'ADMITIDO' 
                          ? 'text-emerald-400' 
                          : alumnoData.postulant.estado_admision === 'LISTA_ESPERA' 
                          ? 'text-amber-400' 
                          : alumnoData.postulant.estado_admision === 'REPROBADO' 
                          ? 'text-rose-400' 
                          : 'text-sky-400'
                      }`}>
                        {alumnoData.postulant.estado_admision === 'ADMITIDO' 
                          ? `🎉 ADMITIDO - ${alumnoData.postulant.carrera_admitida}` 
                          : alumnoData.postulant.estado_admision === 'LISTA_ESPERA' 
                          ? '⏳ LISTA DE ESPERA' 
                          : alumnoData.postulant.estado_admision === 'REPROBADO' 
                          ? '❌ REPROBADO' 
                          : '⏳ EN PROCESO'}
                      </p>
                      {alumnoData.postulant.estado_admision !== 'REPROBADO' && (
                        <a 
                          href={`/api/postulants/${alumnoData.postulant.id}/qr-png`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors border border-indigo-500 shadow-md"
                        >
                          📥 Descargar QR (PNG)
                        </a>
                      )}
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

                {/* Notificaciones y Avisos [CU-25] */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-base">🔔 Centro de Notificaciones [CU-25]</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Avisos importantes sobre la admisión y requisitos.</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xxs font-black rounded-full">
                      {notifications.filter(n => !n.read_at).length} pendientes
                    </span>
                  </div>

                  {loadingNotifications ? (
                    <div className="text-center py-4 text-xs text-slate-500">Cargando avisos...</div>
                  ) : notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No tienes notificaciones en este momento.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.read_at && handleMarkAsRead(n.id)}
                          className={`p-4 rounded-2xl border transition-all flex justify-between items-start gap-4 ${
                            n.read_at
                              ? 'bg-slate-950/20 border-slate-900 text-slate-500 cursor-default'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-white cursor-pointer'
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium">{n.message}</p>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                          {!n.read_at && (
                            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0 mt-1" title="Marcar como leída"></span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-rose-400">No se pudieron cargar los datos de admisión.</div>
            )}
          </div>
        ) : (
          // ====================================================================
          // ROL ADMINISTRATIVO / DOCENTE: Renderizar Casos de Uso según activeTab
          // ====================================================================
          <div className="transition-all duration-300">
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'users' && <UserManagementView />}
            {activeTab === 'postulants' && <PostulantManagementView />}
            {activeTab === 'qr-scanner' && <PostulantQrScanner />}
            {activeTab === 'careers' && <CareerManagementView />}
            {activeTab === 'groups' && <GroupDistributionView />}
            {activeTab === 'teachers' && <TeacherManagementView />}
            {activeTab === 'assignments' && <AcademicAssignmentView />}
            {activeTab === 'grades' && <GradeEntryForm />}
            {activeTab === 'settings' && <SettingManagementView />}
            {activeTab === 'logs' && <SystemLogView />}
            {activeTab === 'docente-dashboard' && (
              // ====================================================================
              // CASO DE USO: [CU-22] Gestionar Asistencia Docente (Panel de Asistencia)
              // ====================================================================
              <div className="space-y-6">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 shadow-xl">
                  <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-widest rounded-full border border-sky-500/20">
                    Portal Exclusivo de Docentes [CU-22]
                  </span>
                  <h2 className="text-2xl font-black text-white">Carga Horaria y Registro de Asistencias</h2>
                  <p className="text-xs text-slate-400">
                    Como docente del curso preuniversitario FICCT, registre diariamente su asistencia real para validar sus horas de dictado.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tus Cargas Académicas Asignadas</h3>
                  
                  {loadingDocente ? (
                    <div className="text-center py-6 text-slate-500 text-xs uppercase tracking-wider animate-pulse">Cargando asignaciones...</div>
                  ) : docenteAssignments.length === 0 ? (
                    <div className="text-center py-6 text-rose-455 font-bold uppercase text-xs">No tienes materias asignadas actualmente.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {docenteAssignments.map((a) => (
                        <div key={a.id} className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded text-[9px] font-black uppercase">
                                {a.group ? a.group.name : 'Grupo N/A'}
                              </span>
                              <p className="text-sm font-bold text-white mt-1.5">Materia: {a.subject ? a.subject.name : 'N/A'}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Horario: {a.schedule} | Aula: {a.classroom}</p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-slate-850">
                            <div className="grid grid-cols-3 gap-2">
                              {['PRESENTE', 'AUSENTE', 'LICENCIA'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setAttendanceStatus(prev => ({ ...prev, [a.id]: st }))}
                                  className={`py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                                    (attendanceStatus[a.id] || 'PRESENTE') === st
                                      ? st === 'PRESENTE'
                                        ? 'bg-emerald-600 border-emerald-500 text-white'
                                        : st === 'AUSENTE'
                                        ? 'bg-rose-600 border-rose-500 text-white'
                                        : 'bg-amber-600 border-amber-500 text-white'
                                      : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>

                            <div className="space-y-1">
                              <input
                                type="text"
                                placeholder="Observaciones / Justificativo..."
                                value={attendanceComments[a.id] || ''}
                                onChange={(e) => setAttendanceComments(prev => ({ ...prev, [a.id]: e.target.value }))}
                                className="w-full bg-slate-900 border border-slate-850 text-white placeholder-slate-550 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                              />
                            </div>

                            <button 
                              onClick={() => handleRegisterAttendance(a.id)}
                              disabled={submittingAttendance[a.id]}
                              className="w-full py-2 bg-sky-650 hover:bg-sky-600 disabled:bg-slate-800 text-white text-xxs font-black uppercase tracking-wider rounded-xl transition-all border border-sky-500/20"
                            >
                              {submittingAttendance[a.id] ? 'Registrando...' : 'Registrar Asistencia'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historial de Asistencias */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historial de Asistencias Registradas</h3>
                  
                  {loadingDocente ? (
                    <div className="text-center py-6 text-slate-500">Cargando historial...</div>
                  ) : docenteAttendances.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">No hay registros de asistencias guardados.</div>
                  ) : (
                    <div className="overflow-x-auto bg-slate-950/40 border border-slate-850 rounded-2xl">
                      <table className="w-full text-left text-xs text-slate-400 border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Materia</th>
                            <th className="p-4">Grupo</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Detalles / Comentarios</th>
                          </tr>
                        </thead>
                        <tbody>
                          {docenteAttendances.map((at) => (
                            <tr key={at.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                              <td className="p-4 font-mono text-slate-350">{at.date}</td>
                              <td className="p-4 text-white font-medium">{at.assignment?.subject ? at.assignment.subject.name : 'N/A'}</td>
                              <td className="p-4 font-bold text-sky-400">{at.assignment?.group ? at.assignment.group.name : 'N/A'}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded border text-[9px] font-black uppercase ${
                                  at.status === 'PRESENTE'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : at.status === 'AUSENTE'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                }`}>
                                  {at.status}
                                </span>
                              </td>
                              <td className="p-4 italic text-slate-400">{at.comments || 'Sin comentarios.'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
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
