import React, { useState } from 'react';

// ============================================================================
// CASO DE USO: [CU-08] Gestionar Docente
// ============================================================================

interface Teacher {
  id: number;
  name: string;
  email: string;
  assignedSubject: string;
  assignedGroup: string;
}

export const TeacherManagementView: React.FC = () => {
  // Lista inicial de docentes
  const [teachers, setTeachers] = useState<Teacher[]>([
    { id: 1, name: 'Docente Auxiliar', email: 'docente@ficct.uagrm.edu.bo', assignedSubject: 'Computación', assignedGroup: 'Grupo 1' },
    { id: 2, name: 'Ing. Carlos Perez', email: 'cperez@uagrm.edu.bo', assignedSubject: 'Matemáticas', assignedGroup: 'Grupo 3' },
    { id: 3, name: 'Lic. Laura Ortiz', email: 'lortiz@uagrm.edu.bo', assignedSubject: 'Física', assignedGroup: 'Grupo 2' },
  ]);

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [newSubject, setNewSubject] = useState<string>('Computación');
  const [newGroup, setNewGroup] = useState<string>('Grupo 1');

  // Modificar la asignación de materia y grupo al docente [CU-08.1]
  const handleUpdateAssignment = (teacherId: number) => {
    setTeachers(prev => 
      prev.map(t => t.id === teacherId ? { ...t, assignedSubject: newSubject, assignedGroup: newGroup } : t)
    );
    setSelectedTeacher(null);
    alert('Asignación docente actualizada exitosamente.');
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Caso de Uso */}
      <div className="border-b border-slate-800 pb-4">
        <span className="px-3 py-1 bg-sky-500/10 text-sky-400 text-xs font-bold uppercase tracking-widest rounded-full border border-sky-500/20">
          Caso de Uso: [CU-08] Gestionar Docente
        </span>
        <h2 className="text-2xl font-black text-white mt-2">Gestión y Asignación de Docentes</h2>
        <p className="text-xs text-slate-400 mt-1">
          Mapea las asignaturas evaluadas del CUP y asigna los correspondientes grupos de aforo a los docentes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabla de Docentes [CU-08.2] Listar */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Planificación Académica</h3>
          
          <div className="overflow-x-auto bg-slate-950/40 rounded-2xl border border-slate-850">
            <table className="w-full text-left text-xs text-slate-400 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Docente</th>
                  <th className="p-4">Materia Asignada</th>
                  <th className="p-4 text-center">Grupo de Aforo</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                    <td className="p-4">
                      <p className="font-bold text-slate-300">{t.name}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{t.email}</span>
                    </td>
                    <td className="p-4 font-bold text-indigo-400">{t.assignedSubject}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px] font-semibold">
                        {t.assignedGroup}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedTeacher(t);
                          setNewSubject(t.assignedSubject);
                          setNewGroup(t.assignedGroup);
                        }}
                        className="px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 text-[10px] font-black uppercase rounded-lg border border-sky-500/20 transition-all"
                      >
                        Reasignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Reasignación [CU-08.3] Modificar */}
        <div className="lg:col-span-1">
          {selectedTeacher ? (
            <div className="p-6 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ajustar Carga Horaria</h3>
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Docente</span>
                <p className="text-sm font-bold text-white leading-tight">{selectedTeacher.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Asignatura CUP</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Computación">Computación</option>
                  <option value="Matemáticas">Matemáticas</option>
                  <option value="Inglés">Inglés</option>
                  <option value="Física">Física</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Grupo Asignado</label>
                <select
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Grupo 1">Grupo 1</option>
                  <option value="Grupo 2">Grupo 2</option>
                  <option value="Grupo 3">Grupo 3</option>
                  <option value="Grupo 4">Grupo 4</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeacher(null)}
                  className="flex-1 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold py-2 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAssignment(selectedTeacher.id)}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2 rounded-xl transition-all border border-sky-400/20"
                >
                  Actualizar
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs py-20">
              Selecciona "Reasignar" en algún docente para modificar su planificación horaria.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TeacherManagementView;
