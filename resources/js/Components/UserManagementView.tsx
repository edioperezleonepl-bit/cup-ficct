import React, { useState } from 'react';

// ============================================================================
// CASO DE USO: [CU-03] Gestionar Usuarios, Roles y Permisos
// ============================================================================

interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'alumno' | 'autoridades' | 'coordinador';
  permissions: string[];
}

export const UserManagementView: React.FC = () => {
  // Lista inicial sembrada de usuarios
  const [users, setUsers] = useState<SystemUser[]>([
    { id: 1, name: 'Administrador General', email: 'admin@ficct.uagrm.edu.bo', role: 'admin', permissions: ['Acceso Total', 'Modificar Notas', 'Redirección Cupos'] },
    { id: 2, name: 'Docente Auxiliar', email: 'docente@ficct.uagrm.edu.bo', role: 'docente', permissions: ['Ver Carga Horaria', 'Registrar Asistencia'] },
    { id: 3, name: 'Rene Copa (Alumno)', email: 'alumno@ficct.uagrm.edu.bo', role: 'alumno', permissions: ['Ver Notas Propias', 'Ver Estado Admisión'] },
    { id: 4, name: 'Decano FICCT', email: 'autoridad@ficct.uagrm.edu.bo', role: 'autoridades', permissions: ['Ver Reportes CUP', 'Ver Dashboard'] },
    { id: 5, name: 'Coordinador CUP', email: 'coordinador@ficct.uagrm.edu.bo', role: 'coordinador', permissions: ['Registrar Postulante', 'Cargar Notas'] },
  ]);

  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'docente' | 'alumno' | 'autoridades' | 'coordinador'>('docente');

  // Función para cambiar de rol [CU-03.1]
  const handleRoleChange = (userId: number) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          // Asignar permisos dinámicos según el nuevo rol
          let perms: string[] = [];
          if (newRole === 'admin') perms = ['Acceso Total', 'Modificar Notas', 'Redirección Cupos'];
          else if (newRole === 'docente') perms = ['Ver Carga Horaria', 'Registrar Asistencia'];
          else if (newRole === 'alumno') perms = ['Ver Notas Propias', 'Ver Estado Admisión'];
          else if (newRole === 'autoridades') perms = ['Ver Reportes CUP', 'Ver Dashboard'];
          else if (newRole === 'coordinador') perms = ['Registrar Postulante', 'Cargar Notas'];

          return { ...u, role: newRole, permissions: perms };
        }
        return u;
      })
    );
    setSelectedUser(null);
    alert('Rol y permisos actualizados exitosamente.');
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
      
      {/* Cabecera del Caso de Uso */}
      <div className="border-b border-slate-800 pb-4">
        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-500/20">
          Caso de Uso: [CU-03] Gestionar Usuarios, Roles y Permisos
        </span>
        <h2 className="text-2xl font-black text-white mt-2">Administración de Roles y Permisos</h2>
        <p className="text-xs text-slate-400 mt-1">
          Asigna roles a los usuarios del personal de la FICCT y gestiona sus permisos en caliente en la base de datos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabla de Usuarios [CU-03.2] Listar */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Usuarios Registrados</h3>
          
          <div className="overflow-x-auto bg-slate-950/40 rounded-2xl border border-slate-850">
            <table className="w-full text-left text-xs text-slate-400 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold">
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                    <td className="p-4 font-bold text-slate-300">{u.name}</td>
                    <td className="p-4 font-mono">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        u.role === 'admin' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : u.role === 'docente'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewRole(u.role);
                        }}
                        className="px-3 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-500/20 transition-all"
                      >
                        Editar Rol
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Edición de Rol y Permisos [CU-03.3] Modificar */}
        <div className="lg:col-span-1">
          {selectedUser ? (
            <div className="p-6 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Modificar Usuario</h3>
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Nombre</span>
                <p className="text-sm font-bold text-white">{selectedUser.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-bold block uppercase">Nuevo Rol del Sistema</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="admin">Administrador</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="docente">Docente</option>
                  <option value="autoridades">Autoridades</option>
                  <option value="alumno">Alumno</option>
                </select>
              </div>

              {/* Listar permisos del rol seleccionado [CU-03.4] */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Permisos Asociados al Rol:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUser.permissions.map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px] font-semibold">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold py-2 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRoleChange(selectedUser.id)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl transition-all border border-indigo-400/20"
                >
                  Guardar Rol
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs py-20">
              Selecciona "Editar Rol" en algún usuario para gestionar sus permisos y roles del sistema.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserManagementView;
