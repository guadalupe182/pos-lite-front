'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';

const LICENSE_ACTIVATION_URL = getApiUrl('/api/v1/licenses/activate');

async function getResponseError(response: Response): Promise<string> {
  const fallback = 'No se pudo activar la licencia. Verifica la llave e inténtalo de nuevo.';

  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data: unknown = await response.json();
      if (typeof data === 'object' && data !== null) {
        const body = data as Record<string, unknown>;
        if (typeof body.message === 'string' && body.message.trim()) return body.message;
        if (typeof body.error === 'string' && body.error.trim()) return body.error;
      }
    } else {
      const message = await response.text();
      if (message.trim()) return message;
    }
  } catch {
    // Si la respuesta no se puede leer, se conserva el mensaje genérico.
  }

  return fallback;
}

export default function ActivatePage() {
  const [licenseKey, setLicenseKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const normalizedKey = licenseKey.trim().toUpperCase();
    setError('');
    setSuccess('');

    if (!normalizedKey) {
      setError('Ingresa tu llave de licencia.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(LICENSE_ACTIVATION_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify({ licenseKey: normalizedKey, password }),
      });

      if (!response.ok) {
        setError(await getResponseError(response));
        return;
      }

      setLicenseKey(normalizedKey);
      setPassword('');
      setConfirmPassword('');
      setSuccess('Tu licencia fue activada y tu contraseña quedó configurada. Ya puedes iniciar sesión.');
    } catch {
      setError('No fue posible conectar con el servicio de activación. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xl">
        <div className="mb-6 space-y-3 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-lg font-black text-white shadow-md">
            G
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Activa tu licencia</h1>
            <p className="mt-1 text-xs text-slate-500">Ingresa tu llave y crea la contraseña de acceso a Gdev POS Lite.</p>
          </div>
        </div>

        {success ? (
          <div className="space-y-5 text-center">
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              {success}
            </div>
            <Link
              href="/login"
              className="block w-full rounded-xl bg-sky-600 p-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-sky-600/20 transition-all hover:bg-sky-500"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="activationLicenseKey" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Llave de licencia
              </label>
              <input
                id="activationLicenseKey"
                type="text"
                value={licenseKey}
                onChange={(event) => setLicenseKey(event.target.value.toUpperCase())}
                placeholder="GDEV-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 font-mono text-sm uppercase text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="activationPassword" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nueva contraseña
              </label>
              <input
                id="activationPassword"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-sky-600 p-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-sky-600/20 transition-all hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            >
              {isSubmitting ? 'Activando licencia...' : 'Activar licencia'}
            </button>
          </form>
        )}

        {!success && (
          <p className="pt-5 text-center text-xs text-slate-500">
            ¿Ya activaste tu licencia?{' '}
            <Link href="/login" className="font-bold text-sky-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
