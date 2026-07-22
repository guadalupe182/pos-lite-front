'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setSuccess('Usuario registrado correctamente. Redirigiendo al login...');
        setTimeout(() => router.push('/login?registered=true'), 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Error al intentar registrar el usuario');
      }
    } catch {
      setError('Error de conexión con el servidor');
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
              <p className="text-xs text-slate-500">Crear una nueva cuenta de acceso al sistema</p>
            </div>
          </div>

          {/* Banner informativo para accesos de prueba */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
          <span className="font-bold text-sky-800 flex items-center gap-1">
            💡 ¿Solo vienes a probar la demo?
          </span>
            <p className="text-[11px] text-slate-500">
              No necesitas crear un usuario. Usa el acceso rápido listo en la pantalla de{' '}
              <Link href="/login" className="text-sky-600 font-bold hover:underline">
                Inicio de Sesión
              </Link>.
            </p>
          </div>

          {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                {error}
              </div>
          )}
          {success && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                {success}
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
            {isSubmitting ? 'Registrando cuenta...' : 'Crear Cuenta'}
          </button>

          <p className="text-center text-xs text-slate-500 pt-2">
            ¿Ya tienes una cuenta registrada?{' '}
            <Link href="/login" className="text-sky-600 hover:underline font-bold">
              Inicia sesión aquí
            </Link>
          </p>
        </form>
      </div>
  );
}