'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch, setAuthToken } from '@/lib/api';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();

  const returnUrl = searchParams?.get('returnUrl') || '/';
  const successMsg = searchParams?.get('registered') === 'true'
      ? 'Usuario registrado correctamente. Ahora inicia sesión.'
      : '';

  const handleAutoFill = () => {
    setEmail('admin@example.com');
    setPassword('admin123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.token || data.access_token;

        if (token) {
          // Guardar en sessionStorage + Cookie
          setAuthToken(token);

          // Navegación mediante window.location para forzar recarga de cookies en el middleware
          window.location.href = returnUrl || '/';
        } else {
          setError('Credenciales inválidas');
        }
      } else {
        setError('Credenciales inválidas');
      }
    } catch (err: unknown) {
      console.error('Error en login:', err);
      const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xl w-full max-w-md space-y-5">

          {/* Header Branding GDEV */}
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-white text-lg shadow-md mx-auto">
              G
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Gdev POS <span className="text-sky-600 font-semibold">Lite</span></h1>
              <p className="text-xs text-slate-500">GDEV Software Solutions Enterprise Ecosystem</p>
            </div>
          </div>

          {/* ⚡ Tarjeta de Accesos Rápidos Demo */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                🚀 Acceso Demo
              </span>
              <button
                  type="button"
                  onClick={handleAutoFill}
                  className="text-[10px] font-bold bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                Autollenar
              </button>
            </div>
            <div className="grid grid-cols-1 gap-0.5 text-xs text-slate-600 font-mono bg-white p-2.5 rounded-lg border border-slate-200/60">
              <p><span className="text-slate-400 font-sans">Email:</span> <strong className="text-slate-800">admin@example.com</strong></p>
              <p><span className="text-slate-400 font-sans">Pass:</span> <strong className="text-slate-800">admin123</strong></p>
            </div>
          </div>

          {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                {error}
              </div>
          )}
          {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                {successMsg}
              </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  required
                  disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  required
                  disabled={isSubmitting}
              />
            </div>
          </div>

          <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full p-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider shadow-md ${
                  isSubmitting
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-sky-600/20'
              }`}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>

          <p className="text-center text-xs text-slate-500 pt-2">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-sky-600 hover:underline font-bold">
              Regístrate aquí
            </Link>
          </p>
        </form>
      </div>
  );
}