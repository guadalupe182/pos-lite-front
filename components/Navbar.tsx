'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch, removeAuthToken } from '@/lib/api';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error al cerrar sesión', err);
    } finally {
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
    { href: '/sales-report', label: 'Reportes' },
  ];

  return (
      <nav className="bg-[#090d16] text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">

            {/* Isotipo & Branding GDEV */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-white text-sm shadow-md group-hover:scale-105 transition-transform">
                  G
                </div>
                <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-wider text-white leading-tight flex items-center gap-1.5">
                  GDEV <span className="text-sky-400 font-normal text-xs uppercase tracking-widest hidden sm:inline">Software</span>
                </span>
                  <span className="text-[10px] text-slate-400 font-medium">POS Enterprise Lite</span>
                </div>
              </Link>
            </div>

            {/* Menú Desktop */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                            isActive
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                    >
                      {link.label}
                    </Link>
                );
              })}

              <div className="h-4 w-[1px] bg-slate-800 mx-2" />

              <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar sesión
              </button>
            </div>

            {/* Menú Móvil */}
            <div className="md:hidden flex items-center">
              <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Desplegable Móvil */}
        {isOpen && (
            <div className="md:hidden bg-[#090d16] border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                            isActive
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                      {link.label}
                    </Link>
                );
              })}
              <button
                  onClick={handleLogout}
                  className="w-full text-left block px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 mt-2"
              >
                Cerrar sesión
              </button>
            </div>
        )}
      </nav>
  );
}