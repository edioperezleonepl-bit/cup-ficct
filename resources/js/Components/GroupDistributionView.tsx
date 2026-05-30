import React, { useState, useMemo } from 'react';

interface GroupData {
  id: number;
  name: string;
  count: number;
}

export const GroupDistributionView: React.FC = () => {
  const [totalPostulants, setTotalPostulants] = useState<number>(141);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [simulatedGroups, setSimulatedGroups] = useState<GroupData[]>([]);

  const calculatedGroupsCount = useMemo(() => {
    if (totalPostulants <= 0) return 0;
    return Math.ceil(totalPostulants / 70);
  }, [totalPostulants]);

  const handleSimulateDistribution = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      let remaining = totalPostulants;
      const groups: GroupData[] = [];

      for (let i = 1; i <= calculatedGroupsCount; i++) {
        const currentGroupCount = Math.min(remaining, 70);
        groups.push({
          id: i,
          name: `Grupo ${i}`,
          count: currentGroupCount
        });
        remaining -= currentGroupCount;
      }

      setSimulatedGroups(groups);
      setIsProcessing(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
          Módulo de Grupos (Asignación Automática)
        </span>
        <h2 className="text-2xl font-black text-white mt-2">Distribución de Grupos Habilitados</h2>
        <p className="text-xs text-slate-400 mt-1">
          Lógica matemática: <strong>CEIL(TotalInscritos / 70)</strong> con capacidad máxima estricta de 70 alumnos por grupo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulador de Aforo</h3>
          
          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 font-semibold block">Total de Alumnos Inscritos</label>
            <input
              type="number"
              min="0"
              value={totalPostulants}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setTotalPostulants(isNaN(val) ? 0 : val);
              }}
              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all font-bold"
            />
          </div>

          <div className="space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xxs text-slate-400">
            <p className="font-bold text-slate-300">Reglas de Ejemplo del Examen:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>70 inscritos = 1 grupo</li>
              <li>71 inscritos = 2 grupos</li>
              <li>140 inscritos = 2 grupos</li>
              <li>141 inscritos = 3 grupos</li>
            </ul>
          </div>

          <button
            onClick={handleSimulateDistribution}
            disabled={isProcessing || totalPostulants <= 0}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl py-3 transition-all duration-200 border border-amber-400/20 disabled:opacity-40"
          >
            {isProcessing ? 'Procesando...' : 'Ejecutar Distribución'}
          </button>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Fórmula Utilizada</span>
              <p className="text-sm font-mono text-amber-400 font-black">CEIL({totalPostulants} / 70)</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Grupos Requeridos</span>
              <p className="text-xl font-extrabold text-white">{calculatedGroupsCount} {calculatedGroupsCount === 1 ? 'Grupo' : 'Grupos'}</p>
            </div>
          </div>

          {simulatedGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {simulatedGroups.map((g) => (
                <div key={g.id} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">{g.name}</span>
                    <span className="text-xxs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                      Capacidad Max: 70
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          g.count >= 70 ? 'bg-rose-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${(g.count / 70) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>{g.count} Alumnos asignados</span>
                      <span>{Math.round((g.count / 70) * 100)}% Lleno</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              Haz clic en "Ejecutar Distribución" para visualizar la carga de alumnos por grupo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDistributionView;
