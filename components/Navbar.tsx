'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCash } from '@/contexts/CashContext';
import CashStatusBadge from './CashStatusBadge';
import OpenCashModal from './OpenCashModal';
import CloseCashModal from './CloseCashModal';
import NotificationBell from './NotificationBell'; 

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const { isOpen, loading, refresh } = useCash();

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Error al cerrar sesión', err);
      window.location.href = '/login';
    }
  };

  const handleCashAction = () => {
    if (isOpen) {
      setShowCloseModal(true);
    } else {
      setShowOpenModal(true);
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
    <>
      <nav className="bg-gray-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold">
                POS-lite
              </Link>
            </div>

            <div className="hidden md:flex md:items-center md:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  {link.label}
                </Link>
              ))}

              {/* Estado de caja */}
              <CashStatusBadge isOpen={isOpen} loading={loading} />

              {/* Botón de acción caja */}
              <button
                onClick={handleCashAction}
                disabled={loading}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isOpen
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? '...' : isOpen ? 'Cerrar caja' : 'Abrir caja'}
              </button>

              {/* 🔔 Campana de notificaciones */}
              <NotificationBell />

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              >
                {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center space-x-2 px-3 py-2">
                <CashStatusBadge isOpen={isOpen} loading={loading} />
                <button
                  onClick={handleCashAction}
                  disabled={loading}
                  className={`px-3 py-1 text-sm rounded ${
                    isOpen
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {isOpen ? 'Cerrar' : 'Abrir'}
                </button>
              </div>
              <div className="px-3 py-2">
                <NotificationBell />
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium bg-red-500 hover:bg-red-600"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Modales */}
      <OpenCashModal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onSuccess={() => {
          setShowOpenModal(false);
          refresh();
        }}
      />

      <CloseCashModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onSuccess={() => {
          setShowCloseModal(false);
          refresh();
        }}
      />
    </>
  );
}