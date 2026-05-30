import React, { useState } from 'react';

export interface UserDetails {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'autoridades' | 'coordinador';
}

interface LoginCardProps {
  onLoginSuccess: (user: UserDetails) => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.message || 'Credenciales de acceso incorrectas.');
      }
    } catch (err) {
      setErrorMsg('Error de red al intentar conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-white text-lg font-black">CUP</span>
        </div>
        <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-indigo-500/20 mt-2">
          Admisión CUP FICCT
        </span>
        <h2 className="text-2xl font-black text-white tracking-tight">Iniciar Sesión</h2>
        <p className="text-xs text-slate-400">Ingresa tus credenciales oficiales de acceso</p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
          <span>⚠</span>
          <p>{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@ficct.uagrm.edu.bo"
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-indigo-500 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl px-6 py-3.5 transition-all duration-200 disabled:opacity-50 border border-indigo-400/20 mt-2"
        >
          {loading ? 'Validando...' : 'Entrar al Sistema'}
        </button>
      </form>

      <div className="pt-2 border-t border-slate-850 text-center space-y-1">
        <p className="text-[10px] text-slate-500">Cuentas de prueba sembradas:</p>
        <div className="text-[9px] text-slate-400 space-y-0.5">
          <p><strong>Admin:</strong> admin@ficct.uagrm.edu.bo (Clave: 7636)</p>
          <p><strong>Docente:</strong> docente@ficct.uagrm.edu.bo (Clave: 7636)</p>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;
