import React, { useState } from 'react';

// ============================================================================
// CU19 — Pasarela de pago Stripe Checkout
// Modal premium para iniciar el proceso de pago con tarjeta vía Stripe.
// ============================================================================

interface Postulant {
  id: number;
  ci: string;
  nombres: string;
  apellidos: string;
  correo: string;
  pagoRealizado: boolean;
}

interface StripePaymentModalProps {
  postulant: Postulant;
  onClose: () => void;
  onPaymentInitiated: () => void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  postulant,
  onClose,
  onPaymentInitiated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ postulant_id: postulant.id }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.checkout_url) {
        onPaymentInitiated();
        // Redirigir a Stripe Checkout
        window.location.href = result.checkout_url;
      } else {
        setError(result.message || 'No se pudo iniciar el pago. Intenta nuevamente.');
        setLoading(false);
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl w-full max-w-md shadow-[0_0_60px_rgba(99,102,241,0.15)] overflow-hidden">

        {/* Franja superior decorativa */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

        {/* Botón cerrar */}
        {!loading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-sm z-10"
          >
            ✕
          </button>
        )}

        <div className="p-7 space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                Pasarela de Pago Segura
              </span>
            </div>
            <h2 className="text-xl font-black text-white">Pago de Matrícula CUP</h2>
            <p className="text-xs text-slate-400">
              Procesado de forma segura por{' '}
              <span className="text-violet-400 font-bold">Stripe</span>
            </p>
          </div>

          {/* Tarjeta de resumen */}
          <div className="bg-slate-900/80 border border-slate-700/40 rounded-2xl p-5 space-y-4">

            {/* Info del postulante */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {postulant.nombres.charAt(0)}{postulant.apellidos.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {postulant.nombres} {postulant.apellidos}
                </p>
                <p className="text-[10px] text-slate-500">CI: {postulant.ci} · {postulant.correo}</p>
              </div>
            </div>

            <div className="h-px bg-slate-800" />

            {/* Descripción del servicio */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-200">Inscripción Pre-Universitaria</p>
                <p className="text-[10px] text-slate-500">Curso CUP — FICCT UAGRM</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-white">$14.50</p>
                <p className="text-[10px] text-slate-500">≈ 100 Bs</p>
              </div>
            </div>

            <div className="h-px bg-slate-800" />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total a pagar</span>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-400">$14.50 USD</span>
              </div>
            </div>
          </div>

          {/* Íconos de métodos de pago */}
          <div className="flex items-center justify-center gap-3">
            <span className="text-[10px] text-slate-500 font-semibold">Aceptamos:</span>
            {['VISA', 'MC', 'AMEX', 'DISCOVER'].map(brand => (
              <span
                key={brand}
                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-[9px] font-black text-slate-400 tracking-wider"
              >
                {brand}
              </span>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Botón principal */}
          <button
            onClick={handleStripeCheckout}
            disabled={loading}
            className="w-full relative overflow-hidden py-4 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            style={{
              background: loading
                ? 'linear-gradient(135deg, #4338ca, #7c3aed)'
                : 'linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)',
            }}
          >
            {/* Shimmer effect */}
            {!loading && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
              />
            )}

            <span className="relative flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirigiendo a Stripe...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.208c0 4.114 2.494 5.53 6.5 6.977 2.613.958 3.482 1.686 3.482 2.72 0 1.012-.912 1.594-2.477 1.594-2.405 0-5.056-.958-7.073-2.24l-.982 5.54C5.033 23.14 7.972 24 11.3 24c2.67 0 4.897-.621 6.467-1.804 1.634-1.24 2.502-3.054 2.502-5.217 0-4.22-2.548-5.702-6.293-7.049V9.15z"/>
                  </svg>
                  Pagar $14.50 con Stripe
                </>
              )}
            </span>
          </button>

          {/* Nota de seguridad */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600">
            <span>🔒</span>
            <span>Pago encriptado SSL · No guardamos datos de tarjeta</span>
          </div>

          {/* Tarjeta de prueba hint */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl text-center">
            <p className="text-[10px] text-amber-400/80 font-semibold">
              🧪 Modo prueba — Tarjeta de test: <code className="font-mono bg-slate-900 px-1 rounded">4242 4242 4242 4242</code>
            </p>
            <p className="text-[9px] text-slate-600 mt-0.5">Fecha: cualquiera futura · CVV: cualquier 3 dígitos</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StripePaymentModal;
