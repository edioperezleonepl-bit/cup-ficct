import React, { useState, useRef } from 'react';

interface SummaryMetrics {
  totalInscribed: number;
  totalApproved: number;
  totalFailed: number;
  totalGroups: number;
}

import React, { useState, useEffect, useRef } from 'react';

interface SummaryMetrics {
  totalInscribed: number;
  totalApproved: number;
  totalFailed: number;
  totalGroups: number;
  totalWaitlist: number;
}

interface CareerData {
  id: number;
  name: string;
  capacity: number;
  admittedCount: number;
  availableSlots: number;
}

interface SubjectAverageData {
  materia: string;
  promedio: number;
  total_evaluados: number;
}

export const DashboardOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalInscribed: 0,
    totalApproved: 0,
    totalFailed: 0,
    totalGroups: 0,
    totalWaitlist: 0
  });

  const [carreras, setCarreras] = useState<CareerData[]>([]);
  const [promediosPorMateria, setPromediosPorMateria] = useState<SubjectAverageData[]>([]);
  const [loadingGeneral, setLoadingGeneral] = useState<boolean>(true);

  const [activeReport, setActiveReport] = useState<string>('general');
  const [reportList, setReportList] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  // Carga masiva (CSV)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeReport === 'approved') {
      fetchReport('/api/reports/approved');
    } else if (activeReport === 'failed') {
      fetchReport('/api/reports/rejected');
    } else if (activeReport === 'waitlist') {
      fetchReport('/api/reports/waitlist');
    } else if (activeReport === 'teachers') {
      fetchReport('/api/academic-assignments');
    } else {
      setReportList([]);
    }
  }, [activeReport]);

  const fetchDashboardData = async () => {
    setLoadingGeneral(true);
    try {
      const response = await fetch('/api/reports/dashboard');
      const data = await response.json();
      if (data.success) {
        const res = data.data.resumen;
        const grp = data.data.grupos;
        setMetrics({
          totalInscribed: res.total_inscritos,
          totalApproved: res.total_admitidos,
          totalFailed: res.total_reprobados,
          totalGroups: grp.grupos_en_bd || grp.grupos_calculados,
          totalWaitlist: res.total_lista_espera || 0
        });
        setCarreras(data.data.carreras || []);
        setPromediosPorMateria(data.data.promedios_por_materia || []);
      }
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoadingGeneral(false);
    }
  };

  const fetchReport = async (url: string) => {
    setLoadingReport(true);
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setReportList(data.data || data.assignments || []);
      }
    } catch (err) {
      console.error('Error al cargar reporte:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    
    try {
      const response = await fetch('/api/postulants/import-csv', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        alert('Éxito: ' + result.message);
        fetchDashboardData();
        if (activeReport !== 'general') {
          setActiveReport('general');
        }
      } else {
        if (response.status === 422 && result.errors) {
          const firstErr = result.errors[0];
          alert(`Error en fila ${firstErr.row} (CI: ${firstErr.ci}): ${firstErr.errors.join(', ')}`);
        } else {
          alert(result.message || 'Error al importar archivo CSV.');
        }
      }
    } catch (err) {
      alert('Error de red al intentar subir el archivo CSV.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Exportar reportes a CSV (CU23)
  const handleExportCSV = () => {
    if (activeReport === 'general' || activeReport === 'subjects') {
      alert('Seleccione el reporte de Aprobados, Reprobados, Lista de Espera o Carga Académica para exportar.');
      return;
    }

    if (reportList.length === 0) {
      alert('No hay registros en la lista actual para exportar.');
      return;
    }

    let csvHeaders = '';
    let csvRows = '';
    let filename = '';

    if (activeReport === 'approved') {
      csvHeaders = 'CI;Nombres;Apellidos;Estado Admisión;Carrera Admitida;Promedio General\n';
      csvRows = reportList.map(r => 
        `"${r.ci}";"${r.nombres}";"${r.apellidos}";"${r.estado_admision}";"${r.carrera_admitida}";"${r.promedio_general}"`
      ).join('\n');
      filename = 'postulantes_aprobados_admitidos';
    } else if (activeReport === 'failed') {
      csvHeaders = 'CI;Nombres;Apellidos;Primera Opción;Promedio General\n';
      csvRows = reportList.map(r => 
        `"${r.ci}";"${r.nombres}";"${r.apellidos}";"${r.carrera_opcion1}";"${r.promedio_general}"`
      ).join('\n');
      filename = 'postulantes_reprobados';
    } else if (activeReport === 'waitlist') {
      csvHeaders = 'CI;Nombres;Apellidos;Primera Opción;Segunda Opción;Promedio General\n';
      csvRows = reportList.map(r => 
        `"${r.ci}";"${r.nombres}";"${r.apellidos}";"${r.carrera_opcion1}";"${r.carrera_opcion2}";"${r.promedio_general}"`
      ).join('\n');
      filename = 'postulantes_lista_espera';
    } else if (activeReport === 'teachers') {
      csvHeaders = 'Docente;Materia;Grupo;Aula;Horario\n';
      csvRows = reportList.map(r => 
        `"${r.teacher?.name || 'N/A'}";"${r.subject?.name || 'N/A'}";"${r.group?.name || 'N/A'}";"${r.classroom || ''}";"${r.schedule || ''}"`
      ).join('\n');
      filename = 'carga_academica_docentes';
    }

    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-8">
      
      {/* Banner de Bienvenida y Carga Masiva */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="space-y-1">
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-500/20">
            Administración Central (CUP)
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Panel de Control FICCT</h1>
          <p className="text-xs text-slate-400">
            Monitoreo en tiempo real de calificaciones, asignación de grupos y cupos de admisión.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex items-center gap-4">
          <div className="text-right">
            <span className="text-xxs text-slate-400 font-bold block uppercase tracking-wider">Carga Masiva (CU24)</span>
            <p className="text-xs text-slate-300 font-semibold mt-0.5">Importar postulantes (CSV)</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleCsvUpload}
            accept=".csv"
            className="hidden" 
          />
          <button 
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-indigo-400/20"
          >
            {uploading ? 'Procesando...' : 'Subir Archivo'}
          </button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider block">Total Inscritos</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-white">{loadingGeneral ? '...' : metrics.totalInscribed}</span>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-bold">100%</span>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xxs text-emerald-400 font-bold uppercase tracking-wider block">Admitidos</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-emerald-400">{loadingGeneral ? '...' : metrics.totalApproved}</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
              {metrics.totalInscribed > 0 ? Math.round((metrics.totalApproved / metrics.totalInscribed) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xxs text-amber-400 font-bold uppercase tracking-wider block">Lista de Espera</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-amber-400">{loadingGeneral ? '...' : metrics.totalWaitlist}</span>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
              {metrics.totalInscribed > 0 ? Math.round((metrics.totalWaitlist / metrics.totalInscribed) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xxs text-rose-400 font-bold uppercase tracking-wider block">Reprobados</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-rose-400">{loadingGeneral ? '...' : metrics.totalFailed}</span>
            <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-bold">
              {metrics.totalInscribed > 0 ? Math.round((metrics.totalFailed / metrics.totalInscribed) * 100) : 0}%
            </span>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xxs text-violet-400 font-bold uppercase tracking-wider block">Grupos Habilitados</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-violet-400">{loadingGeneral ? '...' : metrics.totalGroups}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Max 70 est.</span>
          </div>
        </div>
      </div>

      {/* Reportes Administrativos */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Reportes Académicos y Administrativos</h2>
            <p className="text-xs text-slate-400 mt-0.5">Visualiza y exporta listados clave según especificaciones de la FICCT.</p>
          </div>
          
          {activeReport !== 'general' && activeReport !== 'subjects' && (
            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl px-4 py-2 transition-all border border-emerald-400/20 flex items-center gap-1.5 shadow"
            >
              📥 Exportar a CSV (Excel)
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {[
            { id: 'general', label: 'Cupos Disponibles' },
            { id: 'approved', label: 'Admitidos [CU-15]' },
            { id: 'waitlist', label: 'Lista Espera [CU-20]' },
            { id: 'failed', label: 'Reprobados [CU-15]' },
            { id: 'subjects', label: 'Promedio de Asignaturas' },
            { id: 'teachers', label: 'Carga Horaria Docentes' },
          ].map((rep) => (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeReport === rep.id
                  ? 'bg-indigo-600 text-white border border-indigo-400/20'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-850 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              {rep.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-850">
          
          {/* CUPOS DISPONIBLES */}
          {activeReport === 'general' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Aforo de Cupos por Carrera</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="py-2.5">Carrera</th>
                      <th className="py-2.5 text-center">Capacidad Máxima</th>
                      <th className="py-2.5 text-center">Admitidos</th>
                      <th className="py-2.5 text-center">Cupos Disponibles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carreras.map((c) => (
                      <tr key={c.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                        <td className="py-3 font-bold text-slate-350">{c.name}</td>
                        <td className="py-3 text-center text-slate-400 font-mono">{c.capacity}</td>
                        <td className="py-3 text-center text-indigo-400 font-mono font-bold">{c.admittedCount}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                            c.availableSlots > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {c.availableSlots} cupos
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMITIDOS */}
          {activeReport === 'approved' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Reporte de Estudiantes Admitidos</h3>
              <p className="text-xs text-slate-500">Muestra los postulantes admitidos en su primera o segunda opción de carrera.</p>
              
              {loadingReport ? (
                <div className="py-8 text-center text-slate-500">Cargando reporte de admitidos...</div>
              ) : reportList.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No hay admitidos asignados en el sistema.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-450 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="py-2.5">CI</th>
                        <th className="py-2.5">Postulante</th>
                        <th className="py-2.5">Carrera Admitida</th>
                        <th className="py-2.5 text-right">Promedio General</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportList.map((r) => (
                        <tr key={r.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                          <td className="py-2.5 font-bold font-mono text-slate-300">{r.ci}</td>
                          <td className="py-2.5">{r.apellidos}, {r.nombres}</td>
                          <td className="py-2.5 text-indigo-400 font-bold">{r.carrera_admitida}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-emerald-400">{r.promedio_general} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* LISTA DE ESPERA (CU20) */}
          {activeReport === 'waitlist' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Reporte de Lista de Espera</h3>
              <p className="text-xs text-slate-500">
                Postulantes aprobados con nota &gt;= 60 cuyos cupos de carrera seleccionados ya estaban llenos.
              </p>
              
              {loadingReport ? (
                <div className="py-8 text-center text-slate-500">Cargando lista de espera...</div>
              ) : reportList.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No hay postulantes en lista de espera.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-450 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="py-2.5">CI</th>
                        <th className="py-2.5">Postulante</th>
                        <th className="py-2.5">Opción 1</th>
                        <th className="py-2.5">Opción 2</th>
                        <th className="py-2.5 text-right">Promedio General</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportList.map((r) => (
                        <tr key={r.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                          <td className="py-2.5 font-bold font-mono text-slate-300">{r.ci}</td>
                          <td className="py-2.5">{r.apellidos}, {r.nombres}</td>
                          <td className="py-2.5 text-slate-400">{r.carrera_opcion1}</td>
                          <td className="py-2.5 text-slate-400">{r.carrera_opcion2}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-amber-400">{r.promedio_general} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* REPROBADOS */}
          {activeReport === 'failed' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Reporte de Alumnos Reprobados</h3>
              <p className="text-xs text-slate-500">Muestra los postulantes con nota inferior a la mínima requerida.</p>
              
              {loadingReport ? (
                <div className="py-8 text-center text-slate-500">Cargando reporte de reprobados...</div>
              ) : reportList.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No hay postulantes registrados como reprobados.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-450 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="py-2.5">CI</th>
                        <th className="py-2.5">Postulante</th>
                        <th className="py-2.5">Carrera de Postulación</th>
                        <th className="py-2.5 text-right">Promedio General</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportList.map((r) => (
                        <tr key={r.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                          <td className="py-2.5 font-bold font-mono text-slate-300">{r.ci}</td>
                          <td className="py-2.5">{r.apellidos}, {r.nombres}</td>
                          <td className="py-2.5 text-slate-400">{r.carrera_opcion1}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-rose-450">{r.promedio_general} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RENDIMIENTO POR MATERIA */}
          {activeReport === 'subjects' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Estadísticas de Rendimiento por Materia</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center mt-2">
                {promediosPorMateria.map((pm, idx) => (
                  <div key={idx} className="p-5 bg-slate-900 border border-slate-850 rounded-2xl space-y-1">
                    <span className="text-xxs text-slate-500 font-bold uppercase block">{pm.materia}</span>
                    <p className="text-2xl font-black text-indigo-400 mt-1">{pm.promedio} pts</p>
                    <span className="text-[10px] text-slate-500 block">({pm.total_evaluados} evaluados)</span>
                  </div>
                ))}
                {promediosPorMateria.length === 0 && (
                  <div className="col-span-4 py-8 text-center text-slate-500">Aún no hay calificaciones procesadas.</div>
                )}
              </div>
            </div>
          )}

          {/* CARGA HORARIA / DOCENTES */}
          {activeReport === 'teachers' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Docentes Asignados a Cargas de Grupo</h3>
              
              {loadingReport ? (
                <div className="py-8 text-center text-slate-500">Cargando carga docente...</div>
              ) : reportList.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No hay asignaciones docentes registradas en el sistema.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-450 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="py-2.5">Docente</th>
                        <th className="py-2.5">Materia</th>
                        <th className="py-2.5">Grupo</th>
                        <th className="py-2.5">Aula</th>
                        <th className="py-2.5">Horario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportList.map((r) => (
                        <tr key={r.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                          <td className="py-3 font-bold text-slate-300">{r.teacher?.name}</td>
                          <td className="py-3 text-slate-350">{r.subject?.name}</td>
                          <td className="py-3 font-bold text-indigo-400">{r.group?.name}</td>
                          <td className="py-3 font-mono text-slate-400">{r.classroom}</td>
                          <td className="py-3 font-mono text-slate-400">{r.schedule}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
