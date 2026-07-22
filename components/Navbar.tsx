'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, removeAuthToken } from '@/lib/api';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    } finally {
      // Limpiamos token local y redirigimos de forma limpia
      if (typeof removeAuthToken === 'function') {
        removeAuthToken();
      }
      setIsOpen(false);
      router.push('/login');
    }
  };

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/products', label: 'Productos' },
    { href: '/inventory', label: 'Inventario' },
    { href: '/sales', label: 'Vender' },
    { href: '/sales-report', label: 'Reporte de ventas' },
    { href: '/checkout', label: 'Checkout' },
  ];

  return (
      <nav className="bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">

            {/* Logo / Brand Name */}
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-90 transition-opacity">
                Gdev POS <span className="text-blue-400 font-medium text-base">Lite</span>
              </Link>
            </div>

            {/* Menú Desktop */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              {navLinks.map((link) => (
                  <Link
                      key={link.href}
                      href={link.href}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    {link.label}
                  </Link>
              ))}
              <button
                  onClick={handleLogout}
                  className="bg-red-600/90 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ml-2"
              >
                Cerrar sesión
              </button>
            </div>

            {/* Botón Menú Móvil */}
            <div className="md:hidden flex items-center">
              <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Desplegable Móvil */}
        {isOpen && (
            <div className="md:hidden bg-slate-900/95 border-b border-slate-800">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                      {link.label}
                    </Link>
                ))}
                <button
                    onClick={handleLogout}
                    className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium bg-red-600 text-white hover:bg-red-700 transition-colors mt-2"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
        )}
      </nav>
  );
}