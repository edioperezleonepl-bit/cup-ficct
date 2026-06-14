import React, { useState, useMemo, useEffect, useRef } from 'react';

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
  // Pago
  pagoRealizado: boolean;
  transaccionPagoId: string | null;
  montoPagado: number;
  observacionesRequisitos?: string | null;
  comprobantePago?: string | null;
}

export const PostulantManagementView: React.FC = () => {
  // Lista de postulantes obtenida del backend
  const [postulants, setPostulants] = useState<Postulant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  // Estados para Carga Masiva (CSV)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [csvErrors, setCsvErrors] = useState<any[]>([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Estados para Simulación de Pasarela de Pagos QR
  const [selectedPostulantForPayment, setSelectedPostulantForPayment] = useState<Postulant | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<string | null>(null);
  const [generatingPayment, setGeneratingPayment] = useState<boolean>(false);
  const [confirmingPayment, setConfirmingPayment] = useState<boolean>(false);

  // Estados para Detalle de Expediente (Observaciones y Comprobante) (CU18/19)
  const [selectedPostulantForDetails, setSelectedPostulantForDetails] = useState<Postulant | null>(null);
  const [observations, setObservations] = useState<string>('');
  const [savingObs, setSavingObs] = useState<boolean>(false);
  const [uploadingReceipt, setUploadingReceipt] = useState<boolean>(false);
  const fileReceiptRef = useRef<HTMLInputElement>(null);

  const handleSaveObservations = async () => {
    if (!selectedPostulantForDetails) return;
    setSavingObs(true);
    try {
      const response = await fetch(`/api/postulants/${selectedPostulantForDetails.id}/observations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ observaciones: observations })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert('Observaciones guardadas con éxito.');
        setPostulants(prev => 
          prev.map(p => p.id === selectedPostulantForDetails.id ? { ...p, observacionesRequisitos: observations } : p)
        );
        setSelectedPostulantForDetails(prev => prev ? { ...prev, observacionesRequisitos: observations } : null);
      } else {
        alert(result.message || 'Error al guardar observaciones.');
      }
    } catch (err) {
      alert('Error de red al guardar observaciones.');
    } finally {
      setSavingObs(false);
    }
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPostulantForDetails || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('receipt', file);

    setUploadingReceipt(true);
    try {
      const response = await fetch(`/api/postulants/${selectedPostulantForDetails.id}/upload-receipt`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: formData
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert('Comprobante de pago subido con éxito.');
        setPostulants(prev => 
          prev.map(p => p.id === selectedPostulantForDetails.id ? { ...p, comprobantePago: result.path } : p)
        );
        setSelectedPostulantForDetails(prev => prev ? { ...prev, comprobantePago: result.path } : null);
      } else {
        alert(result.message || 'Error al subir comprobante.');
      }
    } catch (err) {
      alert('Error de red al intentar subir el comprobante.');
    } finally {
      setUploadingReceipt(false);
      if (fileReceiptRef.current) {
        fileReceiptRef.current.value = '';
      }
    }
  };

  const handleOpenPaymentModal = async (p: Postulant) => {
    setSelectedPostulantForPayment(p);
    setQrUrl(null);
    setTxnId(null);
    setGeneratingPayment(true);
    
    try {
      const response = await fetch('/api/postulants/pay/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ postulant_id: p.id })
      });
      
      const result = await response.json();
      if (response.ok && result.success) {
        setQrUrl(result.qr_url);
        setTxnId(result.transaction_id);
      } else {
        alert(result.message || 'Error al generar código QR de pago.');
        setSelectedPostulantForPayment(null);
      }
    } catch (err) {
      alert('Error de red al intentar conectar con la pasarela de pagos.');
      setSelectedPostulantForPayment(null);
    } finally {
      setGeneratingPayment(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPostulantForPayment || !txnId) return;
    
    setConfirmingPayment(true);
    try {
      const response = await fetch('/api/postulants/pay/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          postulant_id: selectedPostulantForPayment.id,
          transaction_id: txnId,
          amount: 100.00
        })
      });
      
      const result = await response.json();
      if (response.ok && result.success) {
        alert('Pago simulado con éxito. Postulante habilitado en el sistema.');
        setPostulants(prev => 
          prev.map(p => p.id === selectedPostulantForPayment.id ? result.postulant : p)
        );
        setSelectedPostulantForPayment(null);
      } else {
        alert(result.message || 'Error al confirmar pago.');
      }
    } catch (err) {
      alert('Error de red al confirmar pago.');
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    setCsvErrors([]);
    setImportSuccessMessage(null);
    
    try {
      const response = await fetch('/api/postulants/import-csv', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setImportSuccessMessage(result.message);
        fetchPostulants();
      } else {
        if (response.status === 422 && result.errors) {
          setCsvErrors(result.errors);
        } else {
          alert(result.message || 'Error al importar archivo CSV.');
        }
      }
    } catch (err) {
      alert('Error de red al intentar subir el archivo CSV.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Cargar postulantes de la base de datos al montar el componente
  useEffect(() => {
    fetchPostulants();
  }, []);

  const fetchPostulants = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/postulants');
      if (response.ok) {
        const data = await response.json();
        setPostulants(data);
      } else {
        console.error('Error al cargar postulantes');
      }
    } catch (err) {
      console.error('Error de red al cargar postulantes', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar postulantes en base a búsqueda reactiva [CU-04.4]
  const filteredPostulants = useMemo(() => {
    return postulants.filter(p => 
      p.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ci.includes(searchTerm)
    );
  }, [postulants, searchTerm]);

  // Guardar postulante (Crear o Modificar) [CU-04.2] / [CU-04.3]
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ci || !nombres || !apellidos || !correo) {
      alert('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    const postulantData = {
      ci,
      nombres,
      apellidos,
      correo,
      carreraOpcion1,
      carreraOpcion2,
      reqTituloBachiller: reqTitulo,
    };

    if (isEditing && currentId !== null) {
      // Modificar postulante [CU-04.3]
      try {
        const response = await fetch(`/api/postulants/${currentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
          },
          body: JSON.stringify(postulantData),
        });

        const result = await response.json();
        if (response.ok && result.success) {
          setPostulants(prev => 
            prev.map(p => p.id === currentId ? result.postulant : p)
          );
          alert('Postulante y requisitos modificados correctamente.');
          resetForm();
        } else {
          alert(result.message || 'Error al modificar postulante.');
        }
      } catch (err) {
        alert('Error de red al intentar modificar postulante.');
      }
    } else {
      // Registrar postulante [CU-04.2]
      try {
        const response = await fetch('/api/postulants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
          },
          body: JSON.stringify(postulantData),
        });

        const result = await response.json();
        if (response.ok && result.success) {
          setPostulants(prev => [...prev, result.postulant]);
          alert('Postulante registrado correctamente.');
          resetForm();
        } else {
          alert(result.message || 'Error al registrar postulante.');
        }
      } catch (err) {
        alert('Error de red al intentar registrar postulante.');
      }
    }
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
  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de que desea eliminar permanentemente a este postulante?')) {
      try {
        const response = await fetch(`/api/postulants/${id}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
          },
        });

        const result = await response.json();
        if (response.ok && result.success) {
          setPostulants(prev => prev.filter(p => p.id !== id));
          alert('Postulante eliminado correctamente.');
        } else {
          alert(result.message || 'Error al eliminar postulante.');
        }
      } catch (err) {
        alert('Error de red al intentar eliminar postulante.');
      }
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

      {/* Sección de Carga Masiva (CSV) */}
      <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-4 shadow-inner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              📥 Carga Masiva de Postulantes
            </h3>
            <p className="text-xxs text-slate-400">
              Sube un archivo CSV con las columnas: <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded font-mono">ci, nombres, apellidos, correo, carreraOpcion1, carreraOpcion2, [titulo_bachiller]</code>.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleCsvUpload}
              accept=".csv"
              className="hidden" 
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-indigo-400/20 flex items-center gap-2 shadow-lg"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <span>📄</span> Subir Archivo CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensaje de Éxito */}
        {importSuccessMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-between animate-fade-in">
            <span>🎉 {importSuccessMessage}</span>
            <button onClick={() => setImportSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-400">✕</button>
          </div>
        )}

        {/* Listado de Errores de Validación */}
        {csvErrors.length > 0 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
              <span className="text-rose-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                ⚠️ Errores de Validación Encontrados ({csvErrors.length})
              </span>
              <button 
                onClick={() => setCsvErrors([])} 
                className="text-rose-400 hover:text-rose-300 text-xs font-bold"
              >
                Limpiar Errores
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-rose-500/20 scrollbar-track-transparent">
              {csvErrors.map((err, idx) => (
                <div key={idx} className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 flex flex-col md:flex-row md:items-start justify-between gap-2 text-[11px]">
                  <div className="space-y-0.5">
                    <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-black mr-2 text-[9px]">
                      Fila {err.row}
                    </span>
                    <span className="text-slate-300 font-semibold mr-2">CI: {err.ci}</span>
                    <span className="text-slate-400">({err.postulant})</span>
                  </div>
                  <ul className="text-rose-400/95 list-disc list-inside md:text-right space-y-0.5">
                    {err.errors.map((msg: string, eIdx: number) => (
                      <li key={eIdx} className="inline-block md:block md:after:content-none after:content-[',_'] last:after:content-none">{msg}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Listado y Búsqueda [CU-04.1] / [CU-04.4] */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Postulantes Registrados
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black rounded-full">
                {filteredPostulants.length}
              </span>
            </h3>
            
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
                  <th className="p-4 w-12 text-center">N°</th>
                  <th className="p-4">Postulante (CI)</th>
                  <th className="p-4">Opciones de Carrera</th>
                  <th className="p-4">Requisitos Entregados</th>
                  <th className="p-4 text-center">Pago (CUP)</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase tracking-wider">
                      Cargando expedientes de postulantes...
                    </td>
                  </tr>
                ) : filteredPostulants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      No se encontraron postulantes registrados.
                    </td>
                  </tr>
                ) : (
                  filteredPostulants.map((p, idx) => (
                    <tr key={p.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                      <td className="p-4 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
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
                      <td className="p-4 text-center">
                        {p.pagoRealizado ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black uppercase">
                              ✓ PAGADO
                            </span>
                            <span className="text-[8px] text-slate-500 font-mono truncate max-w-[100px]" title={p.transaccionPagoId || ''}>
                              {p.transaccionPagoId}
                            </span>
                          </div>
                        ) : p.reqTituloBachiller ? (
                          <button
                            onClick={() => handleOpenPaymentModal(p)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-black uppercase transition-all shadow-md border border-indigo-400/20"
                          >
                            Pagar QR
                          </button>
                        ) : (
                          <span className="px-2 py-1 bg-slate-800 text-slate-400 border border-slate-750 rounded text-[10px] font-semibold uppercase cursor-not-allowed inline-block" title="Debe cumplir los requisitos físicos antes de pagar">
                            Bloqueado 🔒
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedPostulantForDetails(p);
                              setObservations(p.observacionesRequisitos || '');
                            }}
                            className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded transition-all border border-indigo-500/20"
                          >
                            Expediente
                          </button>
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
                  ))
                )}
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

      {/* Modal de Simulación de Pago QR */}
      {selectedPostulantForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => setSelectedPostulantForPayment(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-all text-sm font-bold"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                Pasarela de Pagos (CUP)
              </span>
              <h3 className="text-lg font-black text-white">Pago de Matrícula CUP</h3>
              <p className="text-xxs text-slate-400">
                Postulante: <strong className="text-slate-200">{selectedPostulantForPayment.nombres} {selectedPostulantForPayment.apellidos}</strong>
              </p>
              <p className="text-xxs text-slate-400">
                CI: <strong className="text-slate-200">{selectedPostulantForPayment.ci}</strong>
              </p>
            </div>

            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-slate-800 shadow-inner">
              {generatingPayment ? (
                <div className="w-48 h-48 flex flex-col items-center justify-center gap-3 bg-slate-950/5 rounded-xl">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Generando QR...</span>
                </div>
              ) : qrUrl ? (
                <div className="space-y-3 flex flex-col items-center">
                  <img src={qrUrl} alt="Simulador QR Pago" className="w-48 h-48 object-contain rounded-lg" />
                  <span className="text-[9px] text-slate-500 font-mono select-all">Ref: {txnId}</span>
                </div>
              ) : (
                <div className="text-rose-400 text-xs py-12">Error al generar QR.</div>
              )}
            </div>

            <div className="text-center space-y-1">
              <span className="text-xxs text-slate-500 font-bold block uppercase tracking-wider">Monto a Cancelar</span>
              <span className="text-2xl font-black text-emerald-400">100.00 Bs</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={confirmingPayment || !txnId}
                onClick={handleConfirmPayment}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-emerald-400/20 flex items-center justify-center gap-2"
              >
                {confirmingPayment ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando Pago...
                  </>
                ) : (
                  <>
                    <span>💳</span> Simular Confirmación Bancaria
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedPostulantForPayment(null)}
                className="w-full py-2.5 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                Cancelar Transacción
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Detalle de Expediente (CU18/19) */}
      {selectedPostulantForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setSelectedPostulantForDetails(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-all text-sm font-bold"
            >
              ✕
            </button>

            <div className="border-b border-slate-800 pb-3">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                Expediente Digital del Postulante
              </span>
              <h3 className="text-lg font-black text-white mt-2">
                {selectedPostulantForDetails.apellidos}, {selectedPostulantForDetails.nombres}
              </h3>
              <p className="text-xxs text-slate-400 mt-1">
                CI: <strong className="text-slate-350">{selectedPostulantForDetails.ci}</strong> | Correo: <strong className="text-slate-350">{selectedPostulantForDetails.correo}</strong>
              </p>
              <p className="text-xxs text-slate-400">
                Opciones: 1ra: <strong className="text-indigo-400">{selectedPostulantForDetails.carreraOpcion1}</strong> | 2da: <strong className="text-indigo-400">{selectedPostulantForDetails.carreraOpcion2}</strong>
              </p>
            </div>

            {/* Checklist de Requisitos Físicos */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Requisitos Entregados</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-3 rounded-xl border text-center font-semibold text-xxs ${
                  selectedPostulantForDetails.reqTituloBachiller 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-950/40 border-slate-850 text-slate-550'
                }`}>
                  Título Bachiller {selectedPostulantForDetails.reqTituloBachiller ? '✓' : '✗'}
                </div>
                <div className={`p-3 rounded-xl border text-center font-semibold text-xxs ${
                  selectedPostulantForDetails.reqCertificadoNacimiento 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-950/40 border-slate-850 text-slate-550'
                }`}>
                  Cert. Nacimiento {selectedPostulantForDetails.reqCertificadoNacimiento ? '✓' : '✗'}
                </div>
                <div className={`p-3 rounded-xl border text-center font-semibold text-xxs ${
                  selectedPostulantForDetails.reqCiFisico 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-950/40 border-slate-850 text-slate-550'
                }`}>
                  CI Físico {selectedPostulantForDetails.reqCiFisico ? '✓' : '✗'}
                </div>
              </div>
            </div>

            {/* Observaciones (CU18) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Observaciones sobre Requisitos [CU-18]</h4>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Escriba observaciones de documentos físicos (faltantes, ilegibles, etc.)..."
                className="w-full h-20 bg-slate-950 border border-slate-850 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                disabled={savingObs}
                onClick={handleSaveObservations}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-500 disabled:bg-indigo-850 text-white text-xxs font-black uppercase tracking-wider rounded-xl transition-all border border-indigo-400/20 shadow"
              >
                {savingObs ? 'Guardando...' : '💾 Guardar Observaciones'}
              </button>
            </div>

            {/* Comprobante de Pago Digital (CU19) */}
            <div className="space-y-3 pt-3 border-t border-slate-850">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Comprobante de Pago Digital [CU-19]</h4>
              
              {selectedPostulantForDetails.comprobantePago ? (
                <div className="p-4 bg-slate-955 border border-slate-850 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xxs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      ✓ Comprobante Digital Cargado
                    </span>
                    <a
                      href={selectedPostulantForDetails.comprobantePago}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-750 text-[10px] font-black uppercase rounded-lg transition-all"
                    >
                      👁️ Ver Archivo
                    </a>
                  </div>
                  
                  {/* Vista previa si es imagen */}
                  {/\.(jpg|jpeg|png|gif)$/i.test(selectedPostulantForDetails.comprobantePago) && (
                    <img 
                      src={selectedPostulantForDetails.comprobantePago} 
                      alt="Comprobante Pago" 
                      className="w-full max-h-40 object-contain rounded-xl border border-slate-800 bg-slate-900" 
                    />
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-center space-y-3">
                  <p className="text-xxs text-slate-500 font-bold uppercase tracking-wider">
                    Sin comprobante digital cargado
                  </p>
                  
                  <div className="flex flex-col items-center gap-3">
                    <input
                      type="file"
                      ref={fileReceiptRef}
                      onChange={handleUploadReceipt}
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingReceipt}
                      onClick={() => fileReceiptRef.current?.click()}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-750 flex items-center gap-2 shadow"
                    >
                      {uploadingReceipt ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <span>📂</span> Subir Comprobante Digital
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedPostulantForDetails(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PostulantManagementView;
