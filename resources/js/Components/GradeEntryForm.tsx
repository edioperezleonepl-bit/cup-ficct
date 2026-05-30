import React, { useState, useEffect, useMemo } from 'react';

export interface PostulantInfo {
  id: number;
  ci: string;
  nombres: string;
  apellidos: string;
  carrera_opcion1: string;
  carrera_opcion2: string;
}

export type SubjectName = 'Computación' | 'Matemáticas' | 'Inglés' | 'Física';

export interface SubjectGrades {
  [key: string]: [number | '', number | '', number | ''];
}

interface GradeEntryFormProps {
  postulant?: PostulantInfo;
  onSuccess?: () => void;
}

const SUBJECT_LIST: SubjectName[] = ['Computación', 'Matemáticas', 'Inglés', 'Física'];

export const GradeEntryForm: React.FC<GradeEntryFormProps> = ({ postulant, onSuccess }) => {
  const [selectedPostulant, setSelectedPostulant] = useState<PostulantInfo | null>(postulant || null);
  const [postulantInputId, setPostulantInputId] = useState<string>(postulant ? String(postulant.id) : '');
  const [loadingPostulant, setLoadingPostulant] = useState<boolean>(false);
  const [errorPostulant, setErrorPostulant] = useState<string | null>(null);

  const [grades, setGrades] = useState<SubjectGrades>({
    Computación: ['', '', ''],
    Matemáticas: ['', '', ''],
    Inglés: ['', '', ''],
    Física: ['', '', ''],
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (selectedPostulant) {
      fetchGradesForPostulant(selectedPostulant.id);
    }
  }, [selectedPostulant]);

  const fetchGradesForPostulant = async (id: number) => {
    setLoadingPostulant(true);
    setErrorPostulant(null);
    try {
      const response = await fetch(`/api/exams/grades/${id}`);
      const result = await response.json();
      if (result.success && result.data && result.data.grades) {
        const apiGrades = result.data.grades;
        const newGrades: SubjectGrades = { ...grades };
        
        SUBJECT_LIST.forEach((subj) => {
          if (apiGrades[subj]) {
            newGrades[subj] = apiGrades[subj].map((g: any) => (g === null ? '' : g)) as [number | '', number | '', number | ''];
          }
        });
        setGrades(newGrades);
      }
    } catch (err) {
      console.error("Error al obtener notas:", err);
      setErrorPostulant("No se pudieron precargar las notas previas.");
    } finally {
      setLoadingPostulant(false);
    }
  };

  const buscarPostulantePorCIoId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postulantInputId.trim()) return;

    setLoadingPostulant(true);
    setErrorPostulant(null);
    setSelectedPostulant(null);
    setGrades({
      Computación: ['', '', ''],
      Matemáticas: ['', '', ''],
      Inglés: ['', '', ''],
      Física: ['', '', ''],
    });

    try {
      const response = await fetch(`/api/exams/postulant-summary/${postulantInputId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        const pData = result.data.postulant;
        setSelectedPostulant({
          id: pData.id,
          ci: pData.ci,
          nombres: pData.nombres,
          apellidos: pData.apellidos,
          carrera_opcion1: pData.carrera_opcion1,
          carrera_opcion2: pData.carrera_opcion2,
        });

        const apiGrades = result.data.raw_exams;
        const loadedGrades: SubjectGrades = {
          Computación: ['', '', ''],
          Matemáticas: ['', '', ''],
          Inglés: ['', '', ''],
          Física: ['', '', ''],
        };

        if (apiGrades && apiGrades.length > 0) {
          apiGrades.forEach((g: any) => {
            const subject = g.subject as SubjectName;
            const index = g.exam_number - 1;
            if (loadedGrades[subject] && index >= 0 && index < 3) {
              loadedGrades[subject][index] = g.grade;
            }
          });
          setGrades(loadedGrades);
        }
      } else {
        setErrorPostulant("No se encontró ningún postulante con ese CI o ID.");
      }
    } catch (err) {
      setErrorPostulant("Ocurrió un error al buscar el postulante.");
    } finally {
      setLoadingPostulant(false);
    }
  };

  const handleGradeChange = (subject: SubjectName, index: number, val: string) => {
    if (val === '') {
      setGrades((prev) => {
        const nextSubj = [...prev[subject]] as [number | '', number | '', number | ''];
        nextSubj[index] = '';
        return { ...prev, [subject]: nextSubj };
      });
      return;
    }

    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 100) return;

    setGrades((prev) => {
      const nextSubj = [...prev[subject]] as [number | '', number | '', number | ''];
      nextSubj[index] = num;
      return { ...prev, [subject]: nextSubj };
    });
  };

  const subjectAverages = useMemo(() => {
    const avgs: Record<SubjectName, { average: number | null; isComplete: boolean }> = {
      Computación: { average: null, isComplete: false },
      Matemáticas: { average: null, isComplete: false },
      Inglés: { average: null, isComplete: false },
      Física: { average: null, isComplete: false },
    };

    SUBJECT_LIST.forEach((subj) => {
      const row = grades[subj];
      const numbers = row.filter((g): g is number => g !== '');
      
      if (numbers.length === 3) {
        const average = numbers.reduce((sum, n) => sum + n, 0) / 3;
        avgs[subj] = { average, isComplete: true };
      } else {
        avgs[subj] = { average: numbers.length > 0 ? (numbers.reduce((sum, n) => sum + n, 0) / numbers.length) : null, isComplete: false };
      }
    });

    return avgs;
  }, [grades]);

  const generalStatus = useMemo(() => {
    const avgsArray: number[] = [];
    let allComplete = true;

    SUBJECT_LIST.forEach((subj) => {
      const info = subjectAverages[subj];
      if (info.isComplete && info.average !== null) {
        avgsArray.push(info.average);
      } else {
        allComplete = false;
      }
    });

    if (!allComplete || avgsArray.length < 4) {
      return { average: null, status: 'PENDIENTE', isComplete: false };
    }

    const generalAvg = avgsArray.reduce((sum, a) => sum + a, 0) / 4;
    const finalStatus = generalAvg >= 60 ? 'APROBADO' : 'REPROBADO';

    return {
      average: generalAvg,
      status: finalStatus,
      isComplete: true,
    };
  }, [subjectAverages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostulant) return;

    let incomplete = false;
    SUBJECT_LIST.forEach((subj) => {
      if (!subjectAverages[subj].isComplete) {
        incomplete = true;
      }
    });

    if (incomplete) {
      setNotification({
        type: 'error',
        message: 'Debes completar exactamente las 3 notas para las 4 materias antes de registrar.'
      });
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const response = await fetch('/api/exams/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          postulant_id: selectedPostulant.id,
          grades: grades,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNotification({
          type: 'success',
          message: `¡Notas de ${selectedPostulant.nombres} registradas con éxito! Las carreras de cupos se recalcularán al procesar el cierre.`
        });
        if (onSuccess) onSuccess();
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Error al guardar las notas.'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Ocurrió un error de red al procesar la solicitud.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
      <div className="p-8 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-500/20">
            Módulo de Exámenes & Notas (CUP)
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
            Ingreso y Control de Calificaciones
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Gestión reactiva de notas para la Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones.
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {notification && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <span className="text-xl">
              {notification.type === 'success' ? '✓' : '⚠'}
            </span>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        {!postulant && (
          <form onSubmit={buscarPostulantePorCIoId} className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="postulant_id" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Búsqueda del Postulante (ID o CI)
              </label>
              <input
                id="postulant_id"
                type="text"
                placeholder="Ej. 8765432 o ID del postulante..."
                value={postulantInputId}
                onChange={(e) => setPostulantInputId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loadingPostulant}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-wide rounded-xl px-6 py-3 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 border border-indigo-400/20"
            >
              {loadingPostulant ? 'Buscando...' : 'Cargar Estudiante'}
            </button>
          </form>
        )}

        {errorPostulant && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">
            {errorPostulant}
          </div>
        )}

        {selectedPostulant && (
          <div className="bg-gradient-to-br from-slate-950/60 to-slate-900/60 border border-slate-800/50 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {selectedPostulant.apellidos}, {selectedPostulant.nombres}
                </h3>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded">
                  CI: {selectedPostulant.ci}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span><strong>Opción 1:</strong> {selectedPostulant.carrera_opcion1}</span>
                <span className="text-slate-600">•</span>
                <span><strong>Opción 2:</strong> {selectedPostulant.carrera_opcion2}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/50 border border-slate-800 px-5 py-3 rounded-2xl self-stretch md:self-auto justify-between md:justify-start">
              <div className="text-right">
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest block">
                  Promedio Final CUP
                </span>
                <span className={`text-2xl font-black ${
                  generalStatus.average === null
                    ? 'text-slate-500'
                    : generalStatus.average >= 60
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  {generalStatus.average !== null ? generalStatus.average.toFixed(2) : '--.--'}
                </span>
              </div>
              <div className="h-8 w-[1px] bg-slate-800"></div>
              <div>
                <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest block">
                  Estado Académico
                </span>
                <span className={`px-2.5 py-1 text-xs font-black rounded-lg tracking-wider inline-block mt-0.5 uppercase ${
                  !generalStatus.isComplete
                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                    : generalStatus.status === 'APROBADO'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {!generalStatus.isComplete ? 'PENDIENTE DE NOTAS' : generalStatus.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedPostulant && (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {SUBJECT_LIST.map((subject) => {
                const info = subjectAverages[subject];
                const avgText = info.average !== null ? info.average.toFixed(2) : '--.--';
                
                return (
                  <div
                    key={subject}
                    className="p-6 bg-slate-950/30 border border-slate-800/80 rounded-2xl space-y-4 hover:border-slate-700/80 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                        <h4 className="font-bold text-white text-base tracking-tight">{subject}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xxs text-slate-400 uppercase tracking-wider font-semibold">
                          Promedio:
                        </span>
                        <span className={`text-sm font-bold ${
                          info.average === null
                            ? 'text-slate-500'
                            : info.average >= 60
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}>
                          {avgText}
                        </span>
                        {info.isComplete && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border uppercase ${
                            info.average !== null && info.average >= 60
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            {info.average !== null && info.average >= 60 ? 'OK' : 'REP'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[0, 1, 2].map((idx) => (
                        <div key={idx} className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                            Evaluación {idx + 1}
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="0-100"
                            value={grades[subject][idx]}
                            onChange={(e) => handleGradeChange(subject, idx, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800/80 hover:border-slate-700 focus:border-indigo-500 text-white rounded-xl px-3 py-2.5 text-center text-sm focus:outline-none transition-all font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-slate-400 flex items-start gap-3">
              <span className="text-base text-indigo-400">💡</span>
              <div className="space-y-1">
                <p className="font-bold text-slate-300">Reglas Académicas FICCT para Notas:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Se deben registrar exactamente 3 exámenes por materia para calcular el estado final.</li>
                  <li>Las notas deben estar entre 0 y 100 de forma obligatoria.</li>
                  <li>El promedio de corte para aprobar una materia y el promedio general es de <strong>60 puntos</strong>.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-slate-800 pt-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedPostulant(null);
                  setPostulantInputId('');
                  setGrades({
                    Computación: ['', '', ''],
                    Matemáticas: ['', '', ''],
                    Inglés: ['', '', ''],
                    Física: ['', '', ''],
                  });
                  setNotification(null);
                }}
                className="bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold rounded-xl px-5 py-3 transition-all"
              >
                Cancelar Estudiante
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-wide rounded-xl px-8 py-3 transition-all duration-200 disabled:opacity-50 border border-indigo-400/20"
              >
                {submitting ? 'Guardando Calificaciones...' : 'Registrar Notas Oficiales'}
              </button>
            </div>
          </form>
        )}
        
        {!selectedPostulant && (
          <div className="py-20 text-center space-y-3">
            <div className="text-4xl">🎓</div>
            <h4 className="text-lg font-bold text-slate-300">Sin postulante cargado</h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Ingresa el ID del postulante o su número de Cédula de Identidad en la parte superior para consultar y registrar sus notas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeEntryForm;
