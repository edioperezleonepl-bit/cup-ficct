import React, { useState, useEffect } from 'react';

// ============================================================================
// CASO DE USO: [CU-07] Gestionar Carreras y Cupos
// ============================================================================

interface Career {
  id: number;
  name: string;
  capacity: number;
  admittedCount: number;
}

export const CareerManagementView: React.FC = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(0);

  // Cargar carreras de la base de datos al montar el componente
  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/careers');
      if (response.ok) {
        const data = await response.json();
        setCareers(data);
      } else {
        console.error('Error al cargar carreras');
      }
    } catch (err) {
      console.error('Error de red al cargar carreras', err);
    } finally {
      setLoading(false);
    }
  };

  // Modificar la capacidad (cupos) de la carrera [CU-07.1]
  const handleUpdateCapacity = async (careerId: number) => {
    if (newCapacity < 0) {
      alert('La capacidad no puede ser negativa.');
      return;
    }

    try {
      const response = await fetch(`/api/careers/${careerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ capacity: newCapacity }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCareers(prev => 
          prev.map(c => c.id === careerId ? { ...c, capacity: newCapacity } : c)
        );
        setSelectedCareer(null);
        alert('Capacidad de cupos actualizada exitosamente en la base de datos.');
      } else {
        alert(result.message || 'Error al actualizar la capacidad de cupos.');
      }
    } catch (err) {
      alert('Error de red al intentar actualizar la capacidad de cupos.');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Caso de Uso */}
      <div className="border-b border-slate-800 pb-4">
        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
          Caso de Uso: [CU-07] Gestionar Carreras y Cupos
        </span>
        <h2 className="text-2xl font-black text-white mt-2">Gestión de Carreras y Vacantes</h2>
        <p className="text-xs text-slate-400 mt-1">
          Visualiza el aforo actual de las carreras de la FICCT y modifica la capacidad máxima de vacantes habilitadas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabla de Carreras [CU-07.2] Listar */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Aforo de Vacantes</h3>
          
          <div className="overflow-x-auto bg-slate-950/40 rounded-2xl border border-slate-850">
            <table className="w-full text-left text-xs text-slate-400 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Carrera</th>
                  <th className="p-4 text-center">Cupos Totales</th>
                  <th className="p-4 text-center">Admitidos</th>
                  <th className="p-4 text-center">Disponibles</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider">
                      Cargando aforo de vacantes...
                    </td>
                  </tr>
                ) : careers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-rose-400 font-bold uppercase tracking-wider">
                      No se encontraron carreras registradas.
                    </td>
                  </tr>
                ) : (
                  careers.map((c) => {
                    const available = c.capacity - c.admittedCount;
                    const isFull = available <= 0;

                    return (
                      <tr key={c.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                        <td className="p-4 font-bold text-slate-300">{c.name}</td>
                        <td className="p-4 text-center font-bold text-slate-300">{c.capacity}</td>
                        <td className="p-4 text-center text-indigo-400 font-semibold">{c.admittedCount}</td>
                        <td className="p-4 text-center font-black">
                          <span className={isFull ? 'text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20'}>
                            {isFull ? 'LLENO' : `${available} libres`}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => {
                              setSelectedCareer(c);
                              setNewCapacity(c.capacity);
                            }}
                            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 text-[10px] font-black uppercase rounded-lg border border-amber-500/20 transition-all"
                          >
                            Modificar Cupos
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Modificación de Cupos [CU-07.3] Modificar */}
        <div className="lg:col-span-1">
          {selectedCareer ? (
            <div className="p-6 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ajustar Vacantes</h3>
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Carrera</span>
                <p className="text-sm font-bold text-white leading-tight">{selectedCareer.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Capacidad Máxima de Alumnos *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newCapacity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setNewCapacity(isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 text-white font-bold rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCareer(null)}
                  className="flex-1 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold py-2 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateCapacity(selectedCareer.id)}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 rounded-xl transition-all border border-amber-400/20"
                >
                  Actualizar
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs py-20">
              Selecciona "Modificar Cupos" en alguna carrera para ajustar sus vacantes de admisión.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CareerManagementView;
