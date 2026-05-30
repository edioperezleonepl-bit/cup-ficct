import React, { useState, useMemo } from 'react';

interface CareerOption {
  id: number;
  name: string;
}

export const RegisterPostulantForm: React.FC = () => {
  const careersList: CareerOption[] = [
    { id: 1, name: 'Ingeniería Informática' },
    { id: 2, name: 'Ingeniería de Sistemas' },
    { id: 3, name: 'Ingeniería en Redes y Telecomunicaciones' },
    { id: 4, name: 'Ingeniería en Diseño y Animación Digital' }
  ];

  const [formData, setFormData] = useState({
    ci: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    sexo: 'M',
    direccion: '',
    telefono: '',
    correo_electronico: '',
    colegio_procedencia: '',
    ciudad: 'Santa Cruz de la Sierra',
    carrera_opcion1_id: '',
    carrera_opcion2_id: '',
    titulo_bachiller: false,
    otros: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (!formData.ci.trim()) errs.ci = 'El CI es obligatorio y único.';
    if (!formData.nombres.trim()) errs.nombres = 'Los nombres son obligatorios.';
    if (!formData.apellidos.trim()) errs.apellidos = 'Los apellidos son obligatorios.';
    if (!formData.fecha_nacimiento) errs.fecha_nacimiento = 'La fecha de nacimiento es obligatoria.';
    if (!formData.direccion.trim()) errs.direccion = 'La dirección física es obligatoria.';
    if (!formData.telefono.trim()) errs.telefono = 'El teléfono de contacto es obligatorio.';
    
    if (!formData.correo_electronico.trim()) {
      errs.correo_electronico = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(formData.correo_electronico)) {
      errs.correo_electronico = 'El formato de correo electrónico no es válido.';
    }

    if (!formData.colegio_procedencia.trim()) errs.colegio_procedencia = 'El colegio de procedencia es obligatorio.';
    if (!formData.carrera_opcion1_id) errs.carrera_opcion1_id = 'Debes seleccionar tu primera opción de carrera.';
    if (!formData.carrera_opcion2_id) errs.carrera_opcion2_id = 'Debes seleccionar tu segunda opción de carrera.';
    if (formData.carrera_opcion1_id && formData.carrera_opcion2_id && formData.carrera_opcion1_id === formData.carrera_opcion2_id) {
      errs.carrera_opcion2_id = 'La segunda opción de carrera debe ser diferente a la primera.';
    }

    return errs;
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((k) => { allTouched[k] = true; });
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) {
      alert('Por favor, corrige las validaciones en rojo antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/postulants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg(`¡Postulante ${formData.nombres} registrado con éxito! CI: ${formData.ci}`);
        setFormData({
          ci: '',
          nombres: '',
          apellidos: '',
          fecha_nacimiento: '',
          sexo: 'M',
          direccion: '',
          telefono: '',
          correo_electronico: '',
          colegio_procedencia: '',
          ciudad: 'Santa Cruz de la Sierra',
          carrera_opcion1_id: '',
          carrera_opcion2_id: '',
          titulo_bachiller: false,
          otros: '',
        });
        setTouched({});
      }, 1200);
    } catch (err) {
      setIsSubmitting(false);
      alert('Error en el registro del postulante.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
          Admisión CUP FICCT
        </span>
        <h2 className="text-2xl font-black text-white mt-2">Formulario de Registro de Postulantes</h2>
        <p className="text-xs text-slate-400 mt-1">
          Ingresa los datos personales del estudiante. La validación se ejecuta en tiempo real en el navegador.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl">
          ✓ {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Cédula de Identidad (CI) *</label>
            <input
              type="text"
              name="ci"
              value={formData.ci}
              onChange={handleChange}
              onBlur={() => handleBlur('ci')}
              placeholder="Ej. 1234567"
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                touched.ci && errors.ci ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            />
            {touched.ci && errors.ci && <p className="text-xs text-rose-400 font-medium">{errors.ci}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Nombres *</label>
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              onBlur={() => handleBlur('nombres')}
              placeholder="Ej. Juan Carlos"
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                touched.nombres && errors.nombres ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            />
            {touched.nombres && errors.nombres && <p className="text-xs text-rose-400 font-medium">{errors.nombres}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Apellidos *</label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              onBlur={() => handleBlur('apellidos')}
              placeholder="Ej. Perez Gomez"
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                touched.apellidos && errors.apellidos ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            />
            {touched.apellidos && errors.apellidos && <p className="text-xs text-rose-400 font-medium">{errors.apellidos}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Correo Electrónico *</label>
            <input
              type="email"
              name="correo_electronico"
              value={formData.correo_electronico}
              onChange={handleChange}
              onBlur={() => handleBlur('correo_electronico')}
              placeholder="juan@gmail.com"
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                touched.correo_electronico && errors.correo_electronico ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            />
            {touched.correo_electronico && errors.correo_electronico && <p className="text-xs text-rose-400 font-medium">{errors.correo_electronico}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Fecha de Nacimiento *</label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleChange}
              onBlur={() => handleBlur('fecha_nacimiento')}
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                touched.fecha_nacimiento && errors.fecha_nacimiento ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            />
            {touched.fecha_nacimiento && errors.fecha_nacimiento && <p className="text-xs text-rose-400 font-medium">{errors.fecha_nacimiento}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sexo *</label>
            <select
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer"
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Teléfono / Celular *</label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              onBlur={() => handleBlur('telefono')}
              placeholder="Ej. 78945612"
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                touched.telefono && errors.telefono ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            />
            {touched.telefono && errors.telefono && <p className="text-xs text-rose-400 font-medium">{errors.telefono}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Colegio de Procedencia *</label>
            <input
              type="text"
              name="colegio_procedencia"
              value={formData.colegio_procedencia}
              onChange={handleChange}
              onBlur={() => handleBlur('colegio_procedencia')}
              placeholder="Ej. Colegio Nacional Florida"
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                touched.colegio_procedencia && errors.colegio_procedencia ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            />
            {touched.colegio_procedencia && errors.colegio_procedencia && <p className="text-xs text-rose-400 font-medium">{errors.colegio_procedencia}</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Dirección *</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              onBlur={() => handleBlur('direccion')}
              placeholder="Ej. Calle Charcas #250, Barrio Lindo"
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${
                touched.direccion && errors.direccion ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            />
            {touched.direccion && errors.direccion && <p className="text-xs text-rose-400 font-medium">{errors.direccion}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Carrera - 1ra Opción (Prioridad) *</label>
            <select
              name="carrera_opcion1_id"
              value={formData.carrera_opcion1_id}
              onChange={handleChange}
              onBlur={() => handleBlur('carrera_opcion1_id')}
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer ${
                touched.carrera_opcion1_id && errors.carrera_opcion1_id ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            >
              <option value="">-- Seleccione Carrera --</option>
              {careersList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {touched.carrera_opcion1_id && errors.carrera_opcion1_id && <p className="text-xs text-rose-400 font-medium">{errors.carrera_opcion1_id}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Carrera - 2da Opción (Redirección) *</label>
            <select
              name="carrera_opcion2_id"
              value={formData.carrera_opcion2_id}
              onChange={handleChange}
              onBlur={() => handleBlur('carrera_opcion2_id')}
              className={`w-full bg-slate-950 border text-white rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer ${
                touched.carrera_opcion2_id && errors.carrera_opcion2_id ? 'border-rose-500' : 'border-slate-850 focus:border-emerald-500'
              }`}
            >
              <option value="">-- Seleccione Carrera --</option>
              {careersList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {touched.carrera_opcion2_id && errors.carrera_opcion2_id && <p className="text-xs text-rose-400 font-medium">{errors.carrera_opcion2_id}</p>}
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-850 rounded-xl md:col-span-2">
            <input
              type="checkbox"
              id="titulo_bachiller"
              name="titulo_bachiller"
              checked={formData.titulo_bachiller}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="titulo_bachiller" className="text-xs font-semibold text-slate-300 select-none cursor-pointer">
              ¿Ha presentado Título de Bachiller en físico o digital legalizado?
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold tracking-wide rounded-xl px-6 py-4 transition-all duration-200 disabled:opacity-50 border border-emerald-400/20"
        >
          {isSubmitting ? 'Guardando Postulante...' : 'Registrar Postulante Oficial'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPostulantForm;
