'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function CashHistoryPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aquí puedes implementar la llamada a un endpoint de historial si existe
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando historial...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Historial de cierres de caja</h1>
        <p className="text-gray-500">Próximamente: listado de sesiones de caja.</p>
      </div>
    </>
  );
}