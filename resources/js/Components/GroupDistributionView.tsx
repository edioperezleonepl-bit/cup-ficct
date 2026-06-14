import React, { useState, useEffect } from 'react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Postulant {
  id: number;
  ci: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  telefono: string;
}

interface GroupData {
  id: number;
  name: string;
  count: number;
  capacity: number;
  percentage: number;
  is_full: boolean;
  postulants?: Postulant[];
}

interface DistributionData {
  total_inscritos: number;
  cantidad_grupos: number;
  capacidad_max: number;
  formula: string;
  grupos: GroupData[];
}

// ── Componente ────────────────────────────────────────────────────────────────

export const GroupDistributionView: React.FC = () => {
  const [data, setData]                     = useState<DistributionData | null>(null);
  const [loading, setLoading]               = useState<boolean>(true);
  const [error, setError]                   = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery]       = useState<string>('');

  // Carga los datos reales desde la BD al montar el componente
  const fetchDistribution = async () => {
    setLoading(true);
    setError(null);
    try {
      const res    = await fetch('/api/groups/distribution');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError('No se pudo obtener la distribución de grupos.');
      }
    } catch {
      setError('Error de red al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistribution();
  }, []);

  // ── Render estados ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 shadow-2xl">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Cargando distribución real de grupos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl space-y-4">
        <p className="text-rose-400 font-semibold">⚠ {error}</p>
        <button
          onClick={fetchDistribution}
          className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl px-5 py-2.5 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  // ── Render principal ────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
            CU12 — Módulo de Grupos (Datos Reales)
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Distribución de Grupos Habilitados</h2>
          <p className="text-xs text-slate-400 mt-1">
            Fórmula aplicada: <span className="font-mono text-amber-400 font-bold">{data.formula}</span>
          </p>
        </div>
        <button
          onClick={() => {
            fetchDistribution();
            setExpandedGroupId(null);
            setSearchQuery('');
          }}
          className="self-start sm:self-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl px-4 py-2 transition-all border border-slate-700 flex items-center gap-2"
        >
          ↻ Actualizar
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Total Inscritos</span>
          <span className="text-3xl font-black text-white">{data.total_inscritos}</span>
          <span className="text-[10px] text-slate-500 block">con pago confirmado</span>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] text-amber-400/70 uppercase tracking-widest font-bold block">Grupos Necesarios</span>
          <span className="text-3xl font-black text-amber-400">{data.cantidad_grupos}</span>
          <span className="text-[10px] text-slate-500 block">CEIL({data.total_inscritos} / {data.capacidad_max})</span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Cap. por Grupo</span>
          <span className="text-3xl font-black text-white">{data.capacidad_max}</span>
          <span className="text-[10px] text-slate-500 block">estudiantes máx.</span>
        </div>
      </div>

      {/* Tabla de ejemplos del documento */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reglas según el documento del sistema:</p>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { inscritos: 70, grupos: 1 },
            { inscritos: 71, grupos: 2 },
            { inscritos: 140, grupos: 2 },
            { inscritos: 141, grupos: 3 },
          ].map((ex) => (
            <div
              key={ex.inscritos}
              className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                ex.inscritos === data.total_inscritos
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <span className="block text-base font-black">{ex.inscritos}</span>
              inscritos → <span className="text-white font-black">{ex.grupos}</span> {ex.grupos === 1 ? 'grupo' : 'grupos'}
            </div>
          ))}
        </div>
      </div>

      {/* Distribución por grupo */}
      {data.cantidad_grupos === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm space-y-2">
          <div className="text-3xl">📋</div>
          <p className="font-semibold text-slate-400">Sin inscritos formales aún</p>
          <p className="text-xs">No hay postulantes con pago confirmado. Los grupos se calcularán automáticamente cuando haya inscritos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Estudiantes por grupo ({data.cantidad_grupos} {data.cantidad_grupos === 1 ? 'grupo' : 'grupos'})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.grupos.map((g) => {
              const isSelected = expandedGroupId === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => {
                    setExpandedGroupId(isSelected ? null : g.id);
                    setSearchQuery('');
                  }}
                  className={`p-4 rounded-2xl border space-y-3 cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5'
                      : g.is_full
                      ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      {g.name}
                      {isSelected && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${
                      g.is_full
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {g.is_full ? 'LLENO' : `Cap. máx: ${g.capacity}`}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          g.is_full ? 'bg-rose-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${g.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span className="text-white font-bold">{g.count}</span>
                      <span>de {g.capacity} alumnos ({g.percentage}%)</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-amber-400 font-bold flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                    <span>{isSelected ? '▼ Ocultar alumnos' : '▶ Ver estudiantes asignados'}</span>
                    <span className="text-slate-500 font-normal">{g.postulants?.length || 0} asignados</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Listado de Estudiantes del Grupo Seleccionado */}
          {expandedGroupId !== null && (() => {
            const selectedGroup = data.grupos.find((g) => g.id === expandedGroupId);
            if (!selectedGroup) return null;

            // Filtrar los estudiantes según searchQuery
            const filteredPostulants = (selectedGroup.postulants || []).filter((p) => {
              const query = searchQuery.toLowerCase();
              return (
                p.nombres.toLowerCase().includes(query) ||
                p.apellidos.toLowerCase().includes(query) ||
                p.ci.toLowerCase().includes(query) ||
                (p.correo_electronico && p.correo_electronico.toLowerCase().includes(query))
              );
            });

            return (
              <div className="mt-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Estudiantes de {selectedGroup.name}
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">
                        {filteredPostulants.length} de {selectedGroup.count} mostrados
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Postulantes ordenados alfabéticamente por apellido
                    </p>
                  </div>
                  
                  {/* Buscador */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o CI..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/40 transition-all font-medium"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {filteredPostulants.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No se encontraron estudiantes que coincidan con la búsqueda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">N°</th>
                          <th className="py-2.5 px-3">Cédula (CI)</th>
                          <th className="py-2.5 px-3">Postulante</th>
                          <th className="py-2.5 px-3">Correo Electrónico</th>
                          <th className="py-2.5 px-3 text-right">Teléfono</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPostulants.map((p, idx) => (
                          <tr key={p.id} className="border-b border-slate-900/60 hover:bg-slate-900/30 transition-all">
                            <td className="py-2.5 px-3 text-slate-500 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono text-amber-400 font-semibold">{p.ci}</td>
                            <td className="py-2.5 px-3 text-white font-medium">{p.apellidos}, {p.nombres}</td>
                            <td className="py-2.5 px-3 text-slate-300 font-mono">{p.correo_electronico || '-'}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-right">{p.telefono || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default GroupDistributionView;


