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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setSuccess('Usuario registrado. Ya puedes iniciar sesión.');
        setTimeout(() => router.push('/login?registered=true'), 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Error al registrar');
      }
    } catch {
      setError('Error de conexión con el servidor');
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">

          {/* Header con el branding de la marca */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Gdev POS <span className="text-blue-600 font-normal">Lite</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">Crear una nueva cuenta de usuario</p>
          </div>

          {/* Banner informativo para no perder tiempo registrando si solo quieren ver la demo */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-600">
            💡 <strong>¿Solo vienes a probar la demo?</strong><br />
            No necesitas registrarte. Usa el acceso <Link href="/login" className="text-blue-600 underline font-semibold">Demo en el Login</Link>.
          </div>

          {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
          {success && <p className="text-green-600 mb-4 text-sm">{success}</p>}

          <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
          />
          <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-300 rounded bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
          />
          <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors font-medium text-sm cursor-pointer"
          >
            Registrarse
          </button>
          <p className="mt-4 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
  );
}