import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  role: string;
}

interface SystemLog {
  id: number;
  user_id: number | null;
  action: string;
  details: string;
  ip_address: string | null;
  created_at: string;
  user: User | null;
}

export const SystemLogView: React.FC = () => {
  const [logs, setLogs]             = useState<SystemLog[]>([]);
  const [loading, setLoading]       = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system-logs');
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error al cargar bitácora:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    const query = searchQuery.toLowerCase();
    const userName = l.user ? l.user.name.toLowerCase() : 'sistema';
    return (
      l.action.toLowerCase().includes(query) ||
      l.details.toLowerCase().includes(query) ||
      userName.includes(query)
    );
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }

    const csvHeaders = 'Fecha/Hora;Usuario;Rol;Acción;Detalles;Dirección IP\n';
    const csvRows = filteredLogs.map(l => {
      const userName = l.user ? l.user.name : 'Sistema';
      const userRole = l.user ? l.user.role : 'N/A';
      return `"${l.created_at}";"${userName}";"${userRole}";"${l.action}";"${l.details.replace(/"/g, '""')}";"${l.ip_address || ''}"`;
    }).join('\n');

    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bitacora_auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
            CU17 y CU23 — Bitácora de Auditoría y Exportación
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Bitácora de Auditoría del Sistema</h2>
          <p className="text-xs text-slate-400 mt-1">
            Consulte y exporte todos los eventos de seguridad y actividades críticas del proceso de admisión.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl px-4 py-2 transition-all border border-amber-400/20 flex items-center gap-1.5"
          >
            📊 Exportar Excel (CSV)
          </button>
          <button
            onClick={fetchLogs}
            className="bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white text-xs font-bold rounded-xl px-4 py-2 transition-all border border-slate-700"
          >
            ↻ Refrescar
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative w-full sm:w-80">
        <input
          type="text"
          placeholder="Filtrar por usuario, acción o detalle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/40 border border-slate-850 text-white placeholder-slate-500 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500/35"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-slate-950/40 rounded-2xl border border-slate-850">
        <table className="w-full text-left text-xs text-slate-450 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-4">Fecha/Hora</th>
              <th className="p-4">Usuario / Operador</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Acción</th>
              <th className="p-4">Detalles</th>
              <th className="p-4 text-right">Dirección IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider animate-pulse">
                  Cargando bitácora...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-rose-400 font-bold">
                  No se encontraron registros de auditoría.
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => (
                <tr key={l.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                  <td className="p-4 font-mono text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-4 text-slate-300 font-medium">
                    {l.user ? l.user.name : 'Sistema / Auto'}
                    <span className="block text-[10px] text-slate-550 font-normal">{l.user ? l.user.email : 'automatizacion@ficct.edu.bo'}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                      l.user && l.user.role === 'admin'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : l.user && l.user.role === 'docente'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'bg-slate-800 text-slate-450 border-slate-700'
                    }`}>
                      {l.user ? l.user.role : 'sistema'}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-amber-400/90">{l.action}</td>
                  <td className="p-4 text-white font-medium max-w-xs truncate" title={l.details}>
                    {l.details}
                  </td>
                  <td className="p-4 font-mono text-right text-slate-500">{l.ip_address || 'localhost'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default SystemLogView;
