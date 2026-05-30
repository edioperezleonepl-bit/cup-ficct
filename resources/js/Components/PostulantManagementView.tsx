import React, { useState, useMemo, useEffect } from 'react';

// ============================================================================
// CASOS DE USO:
// - [CU-04] Gestionar Postulantes (CRUD: Listar, Buscar, Registrar, Editar, Eliminar)
// - [CU-06] Gestionar Requisitos del Postulante (Checking de requisitos obligatorios)
// ============================================================================

interface Postulant {
  id: number;
  ci: string;
  nombres: string;
  apellidos: string;
  correo: string;
  carreraOpcion1: string;
  carreraOpcion2: string;
  // Requisitos [CU-06]
  reqTituloBachiller: boolean;
  reqCertificadoNacimiento: boolean;
  reqCiFisico: boolean;
}

export const PostulantManagementView: React.FC = () => {
  // Lista inicial de postulantes sembrada [CU-04.1] Listar
  const [postulants, setPostulants] = useState<Postulant[]>([
    {
      id: 1,
      ci: '1234567',
      nombres: 'Rene',
      apellidos: 'Copa Justiniano',
      correo: 'alumno@ficct.uagrm.edu.bo',
      carreraOpcion1: 'Ingeniería Informática',
      carreraOpcion2: 'Ingeniería de Sistemas',
      reqTituloBachiller: true,
      reqCertificadoNacimiento: true,
      reqCiFisico: true,
    },
    {
      id: 2,
      ci: '8765432',
      nombres: 'Sebastian',
      apellidos: 'Arteaga Melgar',
      correo: 'seb@gmail.com',
      carreraOpcion1: 'Ingeniería Informática',
      carreraOpcion2: 'Ingeniería de Sistemas',
      reqTituloBachiller: false,
      reqCertificadoNacimiento: true,
      reqCiFisico: false,
    }
  ]);

  // Estados del Formulario (Crear/Editar) [CU-04.2] Registrar / [CU-04.3] Editar
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [ci, setCi] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [carreraOpcion1, setCarreraOpcion1] = useState('Ingeniería Informática');
  const [carreraOpcion2, setCarreraOpcion2] = useState('Ingeniería de Sistemas');
  
  // Requisitos [CU-06]
  const [reqTitulo, setReqTitulo] = useState(false);
  const [reqCertificado, setReqCertificado] = useState(false);
  const [reqCiFisico, setReqCiFisico] = useState(false);

  // Búsqueda [CU-04.4] Buscar
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar postulantes en base a búsqueda reactiva [CU-04.4]
  const filteredPostulants = useMemo(() => {
    return postulants.filter(p => 
      p.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ci.includes(searchTerm)
    );
  }, [postulants, searchTerm]);

  // Guardar postulante (Crear o Modificar) [CU-04.2] / [CU-04.3]
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ci || !nombres || !apellidos || !correo) {
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    if (isEditing && currentId !== null) {
      // Modificar postulante [CU-04.3]
      setPostulants(prev => 
        prev.map(p => p.id === currentId ? {
          ...p,
          ci,
          nombres,
          apellidos,
          correo,
          carreraOpcion1,
          carreraOpcion2,
          reqTituloBachiller: reqTitulo,
          reqCertificadoNacimiento: reqCertificado,
          reqCiFisico: reqCiFisico
        } : p)
      );
      alert('Postulante y requisitos modificados correctamente.');
    } else {
      // Registrar postulante [CU-04.2]
      const newPostulant: Postulant = {
        id: Date.now(),
        ci,
        nombres,
        apellidos,
        correo,
        carreraOpcion1,
        carreraOpcion2,
        reqTituloBachiller: reqTitulo,
        reqCertificadoNacimiento: reqCertificado,
        reqCiFisico: reqCiFisico
      };
      setPostulants(prev => [...prev, newPostulant]);
      alert('Postulante registrado correctamente.');
    }

    resetForm();
  };

  // Cargar datos en el formulario para editar [CU-04.3]
  const startEdit = (p: Postulant) => {
    setIsEditing(true);
    setCurrentId(p.id);
    setCi(p.ci);
    setNombres(p.nombres);
    setApellidos(p.apellidos);
    setCorreo(p.correo);
    setCarreraOpcion1(p.carreraOpcion1);
    setCarreraOpcion2(p.carreraOpcion2);
    setReqTitulo(p.reqTituloBachiller);
    setReqCertificado(p.reqCertificadoNacimiento);
    setReqCiFisico(p.reqCiFisico);
  };

  // Eliminar postulante [CU-04.5] Eliminar
  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de que desea eliminar permanentemente a este postulante?')) {
      setPostulants(prev => prev.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setCi('');
    setNombres('');
    setApellidos('');
    setCorreo('');
    setCarreraOpcion1('Ingeniería Informática');
    setCarreraOpcion2('Ingeniería de Sistemas');
    setReqTitulo(false);
    setReqCertificado(false);
    setReqCiFisico(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Caso de Uso */}
      <div className="border-b border-slate-800 pb-4">
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
          Casos de Uso: [CU-04] Gestionar Postulantes & [CU-06] Requisitos
        </span>
        <h2 className="text-2xl font-black text-white mt-2">Expedientes de Postulantes</h2>
        <p className="text-xs text-slate-400 mt-1">
          Administra el registro completo, búsqueda y los documentos/requisitos físicos obligatorios del postulante.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Listado y Búsqueda [CU-04.1] / [CU-04.4] */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Postulantes Registrados</h3>
            
            {/* Buscador reactivo [CU-04.4] */}
            <input
              type="text"
              placeholder="Buscar por Nombres, Apellidos o CI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto bg-slate-950/40 rounded-2xl border border-slate-850">
            <table className="w-full text-left text-xs text-slate-400 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Postulante (CI)</th>
                  <th className="p-4">Opciones de Carrera</th>
                  <th className="p-4">Requisitos Entregados</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPostulants.map((p) => (
                  <tr key={p.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                    <td className="p-4">
                      <p className="font-bold text-slate-300">{p.apellidos}, {p.nombres}</p>
                      <span className="text-[10px] text-slate-500">CI: {p.ci} | {p.correo}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-[10px] text-slate-400"><strong>1ra:</strong> {p.carreraOpcion1}</p>
                      <p className="text-[10px] text-slate-400"><strong>2da:</strong> {p.carreraOpcion2}</p>
                    </td>
                    <td className="p-4">
                      {/* Checkboxes de Requisitos [CU-06] */}
                      <div className="flex flex-col gap-1 text-[9px] font-semibold">
                        <span className={p.reqTituloBachiller ? 'text-emerald-400' : 'text-rose-400'}>
                          {p.reqTituloBachiller ? '✓' : '✗'} Título Bachiller
                        </span>
                        <span className={p.reqCertificadoNacimiento ? 'text-emerald-400' : 'text-rose-400'}>
                          {p.reqCertificadoNacimiento ? '✓' : '✗'} Cert. Nacimiento
                        </span>
                        <span className={p.reqCiFisico ? 'text-emerald-400' : 'text-rose-400'}>
                          {p.reqCiFisico ? '✓' : '✗'} Cédula Física
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition-all border border-emerald-500/20"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition-all border border-rose-500/20"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulario Lateral [CU-04.2] / [CU-04.3] y Requisitos [CU-06] */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isEditing ? 'Modificar Expediente' : 'Registrar Expediente'}
            </h3>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">CI (Único) *</label>
              <input
                type="text"
                required
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">Nombres *</label>
              <input
                type="text"
                required
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">Apellidos *</label>
              <input
                type="text"
                required
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">Correo Electrónico *</label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">1ra Opción Carrera</label>
              <select
                value={carreraOpcion1}
                onChange={(e) => setCarreraOpcion1(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
              >
                <option value="Ingeniería Informática">Ingeniería Informática</option>
                <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                <option value="Ingeniería en Redes y Telecomunicaciones">Ingeniería en Redes y Telecomunicaciones</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold block uppercase">2da Opción Carrera</label>
              <select
                value={carreraOpcion2}
                onChange={(e) => setCarreraOpcion2(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
              >
                <option value="Ingeniería Informática">Ingeniería Informática</option>
                <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                <option value="Ingeniería en Redes y Telecomunicaciones">Ingeniería en Redes y Telecomunicaciones</option>
              </select>
            </div>

            {/* SECCIÓN REQUISITOS [CU-06] */}
            <div className="space-y-2 pt-2 border-t border-slate-850">
              <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">
                Requisitos del Postulante [CU-06]
              </span>
              
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reqTitulo}
                    onChange={(e) => setReqTitulo(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded border-slate-800"
                  />
                  <span>Título de Bachiller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reqCertificado}
                    onChange={(e) => setReqCertificado(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded border-slate-800"
                  />
                  <span>Certificado de Nacimiento</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reqCiFisico}
                    onChange={(e) => setReqCiFisico(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded border-slate-800"
                  />
                  <span>Cédula Identidad (CI) Físico</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all border border-emerald-400/20"
              >
                {isEditing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default PostulantManagementView;
