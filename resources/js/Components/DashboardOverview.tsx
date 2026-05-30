import React, { useState } from 'react';

interface SummaryMetrics {
  totalInscribed: number;
  totalApproved: number;
  totalFailed: number;
  totalGroups: number;
}

export const DashboardOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalInscribed: 245,
    totalApproved: 180,
    totalFailed: 65,
    totalGroups: 4
  });

  const [activeReport, setActiveReport] = useState<string>('general');

  return (
    <div className="w-full space-y-8">
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
            <span className="text-xxs text-slate-400 font-bold block uppercase tracking-wider">Carga Masiva</span>
            <p className="text-xs text-slate-300 font-semibold mt-0.5">Importar alumnos (CSV/Excel)</p>
          </div>
          <button 
            onClick={() => alert('Simulación: Carga de archivo CSV/Excel iniciada para generar cuentas de usuario.')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-indigo-400/20"
          >
            Subir Archivo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xxs text-slate-400 font-bold uppercase tracking-wider block">Total Inscritos</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-white">{metrics.totalInscribed}</span>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-bold">100%</span>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xxs text-emerald-400 font-bold uppercase tracking-wider block">Aprobados Academicamente</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-emerald-400">{metrics.totalApproved}</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
              {Math.round((metrics.totalApproved / metrics.totalInscribed) * 100)}%
            </span>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xxs text-rose-400 font-bold uppercase tracking-wider block">Reprobados Académicos</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-rose-400">{metrics.totalFailed}</span>
            <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-bold">
              {Math.round((metrics.totalFailed / metrics.totalInscribed) * 100)}%
            </span>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-xxs text-amber-400 font-bold uppercase tracking-wider block">Grupos Habilitados</span>
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-black text-amber-400">{metrics.totalGroups}</span>
            <span className="text-[10px] text-slate-400 font-semibold">CEIL(N/70)</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Reportes Administrativos Obligatorios</h2>
          <p className="text-xs text-slate-400 mt-0.5">Visualiza los listados clave según especificaciones de la FICCT.</p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {[
            { id: 'general', label: 'Lista General' },
            { id: 'approved', label: 'Aprobados' },
            { id: 'failed', label: 'Reprobados' },
            { id: 'averages', label: 'Promedios Generales' },
            { id: 'subjects', label: 'Estadísticas por Materia' },
            { id: 'teachers', label: 'Docentes por Grupo' },
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
          {activeReport === 'general' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Lista General de Admisión</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="py-2.5">CI</th>
                      <th className="py-2.5">Postulante</th>
                      <th className="py-2.5">1ra Opción</th>
                      <th className="py-2.5">2da Opción</th>
                      <th className="py-2.5">Admitido En</th>
                      <th className="py-2.5">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-900/60 hover:bg-slate-900/10">
                      <td className="py-2.5 font-bold text-slate-300">1029384</td>
                      <td className="py-2.5">Arteaga Melgar, Sebastian</td>
                      <td className="py-2.5">Ing. Informática</td>
                      <td className="py-2.5">Ing. Sistemas</td>
                      <td className="py-2.5 text-indigo-400 font-semibold">Ing. Informática</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-black">ADMITIDO</span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900/60 hover:bg-slate-900/10">
                      <td className="py-2.5 font-bold text-slate-300">9283741</td>
                      <td className="py-2.5">Flores Vaca, Maria Belen</td>
                      <td className="py-2.5">Ing. Redes</td>
                      <td className="py-2.5">Ing. Informática</td>
                      <td className="py-2.5 text-indigo-400 font-semibold">Ing. Informática</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-black">ADMITIDO (OP2)</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'approved' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Reporte de Alumnos Aprobados</h3>
              <p className="text-xs text-slate-500">Muestra los estudiantes que alcanzaron nota de aprobación (Promedio General &gt;= 60).</p>
            </div>
          )}

          {activeReport === 'failed' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Reporte de Alumnos Reprobados</h3>
              <p className="text-xs text-slate-500">Muestra los postulantes con nota inferior a 60 que quedaron fuera del cupo académico.</p>
            </div>
          )}

          {activeReport === 'averages' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Promedios Generales por Mérito</h3>
              <p className="text-xs text-slate-500">Listado de promedios ordenado jerárquicamente de mayor a menor para fines de control de aforo.</p>
            </div>
          )}

          {activeReport === 'subjects' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Estadísticas de Rendimiento por Materia</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl">
                  <span className="text-xxs text-slate-500 font-bold uppercase">Computación</span>
                  <p className="text-lg font-extrabold text-white mt-1">74.5 pts</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl">
                  <span className="text-xxs text-slate-500 font-bold uppercase">Matemáticas</span>
                  <p className="text-lg font-extrabold text-white mt-1">61.2 pts</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl">
                  <span className="text-xxs text-slate-500 font-bold uppercase">Inglés</span>
                  <p className="text-lg font-extrabold text-white mt-1">82.1 pts</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl">
                  <span className="text-xxs text-slate-500 font-bold uppercase">Física</span>
                  <p className="text-lg font-extrabold text-white mt-1">59.8 pts</p>
                </div>
              </div>
            </div>
          )}

          {activeReport === 'teachers' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Carga Horaria y Docentes por Grupo</h3>
              <p className="text-xs text-slate-500">Mapeo de docentes asignados a los correspondientes grupos habilitados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
