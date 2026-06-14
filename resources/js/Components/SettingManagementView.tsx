import React, { useState, useEffect } from 'react';

interface Setting {
  id: number;
  key: string;
  value: string;
  description: string;
}

export const SettingManagementView: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
        const initialEdits: { [key: number]: string } = {};
        data.settings.forEach((s: Setting) => {
          initialEdits[s.id] = s.value;
        });
        setEditValues(initialEdits);
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (id: number) => {
    const val = editValues[id];
    if (val === undefined || val.trim() === '') return;

    setSavingId(id);
    try {
      const response = await fetch(`/api/settings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ value: val }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSettings(prev =>
          prev.map(s => s.id === id ? { ...s, value: val } : s)
        );
        alert('Configuración actualizada con éxito.');
      } else {
        alert(result.message || 'Error al actualizar configuración.');
      }
    } catch (err) {
      alert('Error de red al intentar guardar la configuración.');
    } finally {
      setSavingId(null);
    }
  };

  const handleBackupDownload = () => {
    window.open('/api/backup/download', '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
            CU21 y CU26 — Parámetros Académicos y Respaldos
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Configuración del Sistema</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ajusta los parámetros académicos globales y gestiona las copias de seguridad de la base de datos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Parámetros Académicos */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Parámetros de Evaluación y Grupos</h3>
          
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-wider animate-pulse">
              Cargando parámetros...
            </div>
          ) : (
            <div className="space-y-4">
              {settings.map((s) => (
                <div key={s.id} className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-md">
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">{s.key}</span>
                    <p className="text-[11px] text-slate-400 leading-tight">{s.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={editValues[s.id] || ''}
                      onChange={(e) => setEditValues({ ...editValues, [s.id]: e.target.value })}
                      className="w-20 bg-slate-900 border border-slate-800 text-white text-center font-bold rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-amber-500/40"
                    />
                    <button
                      onClick={() => handleUpdateSetting(s.id)}
                      disabled={savingId === s.id}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white text-xxs font-black uppercase tracking-wider rounded-xl transition-all border border-amber-400/20"
                    >
                      {savingId === s.id ? '...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Respaldo de Información (CU26) */}
        <div className="md:col-span-1">
          <div className="p-6 bg-slate-950/60 border border-slate-850 rounded-3xl space-y-4 text-center">
            <div className="text-4xl text-amber-400">💾</div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Copias de Seguridad</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Genera un respaldo completo de la base de datos en formato SQLite para su custodia y continuidad de negocio.
            </p>
            <button
              onClick={handleBackupDownload}
              className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all border border-slate-750 flex items-center justify-center gap-2"
            >
              📥 Descargar Backup
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SettingManagementView;
