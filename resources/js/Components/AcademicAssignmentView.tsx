import React, { useState, useEffect } from 'react';

interface Teacher {
  id: number;
  name: string;
  email: string;
}

interface Group {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

interface Assignment {
  id: number;
  user_id: number;
  subject_id: number;
  group_id: number;
  classroom: string;
  schedule: string;
  teacher?: Teacher;
  subject?: Subject;
  group?: Group;
}

const SUBJECTS: Subject[] = [
  { id: 1, name: 'Computación' },
  { id: 2, name: 'Matemáticas' },
  { id: 3, name: 'Inglés' },
  { id: 4, name: 'Física' }
];

export const AcademicAssignmentView: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers]       = useState<Teacher[]>([]);
  const [groups, setGroups]           = useState<Group[]>([]);
  
  const [loading, setLoading]         = useState<boolean>(true);
  const [submitting, setSubmitting]   = useState<boolean>(false);

  // Form states
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId]     = useState<string>('');
  const [classroom, setClassroom]                 = useState<string>('');
  const [schedule, setSchedule]                   = useState<string>('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch assignments
      const resAssign = await fetch('/api/academic-assignments');
      const dataAssign = await resAssign.json();
      if (dataAssign.success) {
        setAssignments(dataAssign.assignments);
      }

      // 2. Fetch users to filter teachers
      const resUsers = await fetch('/api/users');
      const dataUsers = await resUsers.json();
      if (dataUsers.success) {
        const filteredTeachers = dataUsers.users.filter((u: any) => u.role === 'docente');
        setTeachers(filteredTeachers);
      }

      // 3. Fetch groups
      const resGroups = await fetch('/api/groups/distribution');
      const dataGroups = await resGroups.json();
      if (dataGroups.success) {
        setGroups(dataGroups.data.grupos);
      }

    } catch (err) {
      console.error('Error al cargar datos de asignación académica:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubjectId || !selectedGroupId || !classroom || !schedule) {
      alert('Por favor complete todos los campos.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/academic-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          user_id: parseInt(selectedTeacherId),
          subject_id: parseInt(selectedSubjectId),
          group_id: parseInt(selectedGroupId),
          classroom,
          schedule,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAssignments(prev => [...prev, result.assignment]);
        // Reset form
        setSelectedTeacherId('');
        setSelectedSubjectId('');
        setSelectedGroupId('');
        setClassroom('');
        setSchedule('');
        alert('Asignación académica registrada exitosamente.');
      } else {
        alert(result.message || 'Error al registrar la asignación.');
      }
    } catch (err) {
      alert('Error de red al intentar guardar la asignación.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta asignación académica?')) return;

    try {
      const response = await fetch(`/api/academic-assignments/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        }
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAssignments(prev => prev.filter(a => a.id !== id));
        alert('Asignación eliminada exitosamente.');
      } else {
        alert(result.message || 'Error al eliminar la asignación.');
      }
    } catch (err) {
      alert('Error de red al intentar eliminar la asignación.');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
          Caso de Uso: [CU-14] Gestionar Asignación Académica
        </span>
        <h2 className="text-2xl font-black text-white mt-2">Carga Académica y Distribución Docente</h2>
        <p className="text-xs text-slate-400 mt-1">
          Vincula a los docentes con las materias correspondientes, asignándoles aulas, horarios y grupos específicos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario de Asignación */}
        <div className="lg:col-span-1 bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nueva Asignación</h3>
          
          <form onSubmit={handleCreateAssignment} className="space-y-3.5">
            {/* Seleccionar Docente */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">Docente *</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500/30 cursor-pointer"
              >
                <option value="">Seleccione un docente...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>

            {/* Seleccionar Materia */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">Materia *</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500/30 cursor-pointer"
              >
                <option value="">Seleccione una materia...</option>
                {SUBJECTS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Seleccionar Grupo */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">Grupo *</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500/30 cursor-pointer"
              >
                <option value="">Seleccione un grupo...</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Aula */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">Aula / Laboratorio *</label>
              <input
                type="text"
                placeholder="Ej. Aula 201, Laboratorio de Física 1"
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500/30"
              />
            </div>

            {/* Horario */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">Horario *</label>
              <input
                type="text"
                placeholder="Ej. Lu-Mi-Vi 07:00-08:30"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500/30"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-wider py-2.5 rounded-xl transition-all border border-amber-400/20"
            >
              {submitting ? 'Asignando...' : 'Asignar Docente'}
            </button>
          </form>
        </div>

        {/* Listado de Asignaciones */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Asignaciones Habilitadas</h3>
          
          <div className="overflow-x-auto bg-slate-950/40 rounded-2xl border border-slate-850">
            <table className="w-full text-left text-xs text-slate-400 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Docente</th>
                  <th className="p-4">Materia</th>
                  <th className="p-4">Grupo</th>
                  <th className="p-4">Aula</th>
                  <th className="p-4">Horario</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider animate-pulse">
                      Cargando asignaciones...
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-rose-450 font-bold uppercase tracking-wider">
                      Sin asignaciones registradas.
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                      <td className="p-4 font-bold text-slate-350">
                        {a.teacher ? a.teacher.name : 'Docente N/A'}
                        <span className="block text-[10px] text-slate-500 font-normal">{a.teacher ? a.teacher.email : ''}</span>
                      </td>
                      <td className="p-4 text-white font-medium">{a.subject ? a.subject.name : 'N/A'}</td>
                      <td className="p-4 font-bold text-amber-400/90">{a.group ? a.group.name : 'N/A'}</td>
                      <td className="p-4 font-mono text-slate-300">{a.classroom}</td>
                      <td className="p-4 font-mono text-slate-300">{a.schedule}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-[10px] font-black uppercase rounded-lg border border-rose-500/20 transition-all"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AcademicAssignmentView;
