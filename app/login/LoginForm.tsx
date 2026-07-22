'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, setAuthToken } from '@/lib/api';
import Link from 'next/link';

export default function LoginForm() {
  // 1. Inicializamos los campos con las credenciales de prueba
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnUrl = searchParams?.get('returnUrl') || '/';
  const successMsg = searchParams?.get('registered') === 'true'
      ? 'Usuario registrado correctamente. Ahora inicia sesión.'
      : '';

  // Función para rellenar rápido si limpian los campos
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
        if (data.token) {
          setAuthToken(data.token);
          router.push(returnUrl);
        } else {
          setError('Credenciales inválidas');
        }
      } else {
        setError('Credenciales inválidas');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">POS-lite</h1>

          {/* ⚡ Tarjeta de Accesos Rápidos Demo */}
          <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-200 text-left">
            <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
              🚀 Acceso Demo
            </span>
              <button
                  type="button"
                  onClick={handleAutoFill}
                  className="text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                Autollenar
              </button>
            </div>
            <p className="text-xs text-gray-600 font-mono">
              <strong>User:</strong> admin@example.com
            </p>
            <p className="text-xs text-gray-600 font-mono">
              <strong>Pass:</strong> admin123
            </p>
          </div>

          {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
          {successMsg && <p className="text-green-600 mb-4 text-sm">{successMsg}</p>}

          <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
              disabled={isSubmitting}
          />
          <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
              disabled={isSubmitting}
          />
          <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full p-2 rounded transition-colors font-medium text-sm ${
                  isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              }`}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
          <p className="mt-4 text-center text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </form>
      </div>
  );
}