'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

const LICENSE_STORAGE_KEY = 'gdev_license_key';
const LICENSE_VALIDATION_URL = 'https://api.gdevsoftware.com/api/v1/licenses/validate';

interface LicenseApiResponse {
  plan?: string;
  expiresAt?: string;
  expirationDate?: string;
  expiryDate?: string;
}

interface LicenseDetails {
  plan: string;
  expirationDate: string;
}

function formatExpirationDate(value: string): string {
  if (!value) return 'No especificada';

  const localDateValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value;
  const date = new Date(localDateValue);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(date);
}

export default function LicenseDashboardPage() {
  const [licenseKey, setLicenseKey] = useState('');
  const [license, setLicense] = useState<LicenseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateLicense = useCallback(async (rawKey: string) => {
    const normalizedKey = rawKey.trim().toUpperCase();

    if (!normalizedKey) {
      setError('Ingresa tu llave de licencia.');
      return;
    }

    setLoading(true);
    setError('');
    setLicense(null);
    setLicenseKey(normalizedKey);

    try {
      const response = await fetch(
          `${LICENSE_VALIDATION_URL}/${encodeURIComponent(normalizedKey)}`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
          }
      );

      if (response.status === 403 || response.status === 404) {
        window.localStorage.removeItem(LICENSE_STORAGE_KEY);
        setError('Licencia inválida o expirada.');
        return;
      }

      if (!response.ok) {
        setError('No fue posible validar la licencia. Inténtalo de nuevo más tarde.');
        return;
      }

      const data = (await response.json()) as LicenseApiResponse;
      const expirationDate = data.expiresAt || data.expirationDate || data.expiryDate || '';

      window.localStorage.setItem(LICENSE_STORAGE_KEY, normalizedKey);
      setLicense({
        plan: data.plan || 'No especificado',
        expirationDate,
      });
    } catch {
      setError('No fue posible conectar con el servicio de licencias. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedKey = window.localStorage.getItem(LICENSE_STORAGE_KEY);
    if (savedKey) {
      void validateLicense(savedKey);
    }
  }, [validateLicense]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loading) {
      void validateLicense(licenseKey);
    }
  };

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-200/80 pb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 uppercase tracking-wide mb-2">
              Portal de Cliente
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mi Licencia GDEV</h1>
            <p className="mt-1 text-sm text-slate-500">
              Valida tu llave para consultar el plan y la vigencia de tu licencia.
            </p>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Validar licencia</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="licenseKey" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Llave de licencia
                </label>
                <input
                    id="licenseKey"
                    type="text"
                    value={licenseKey}
                    onChange={(event) => setLicenseKey(event.target.value)}
                    placeholder="GDEV-XXXX"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={loading}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all disabled:opacity-60"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Ingresa la llave proporcionada por GDEV Software Solutions.
                </p>
              </div>

              <button
                  type="submit"
                  disabled={loading || !licenseKey.trim()}
                  className="w-full p-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/20 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? 'Validando licencia...' : 'Validar licencia'}
              </button>
            </form>

            {error && (
                <div role="alert" className="mt-4 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                  {error}
                </div>
            )}
          </section>

          {license && !loading && (
              <section className="bg-white rounded-2xl border border-emerald-200 shadow-2xs p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide mb-1">
                      Licencia Activa
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Licencia validada correctamente</h2>
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div>
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan</dt>
                    <dd className="mt-1 text-base font-bold text-slate-900">{license.plan}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de expiración</dt>
                    <dd className="mt-1 text-base font-bold text-slate-900">
                      {formatExpirationDate(license.expirationDate)}
                    </dd>
                  </div>
                </dl>
              </section>
          )}
        </div>
      </div>
  );
}
