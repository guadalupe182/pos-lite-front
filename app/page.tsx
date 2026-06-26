'use client';

import { useState, useEffect } from 'react';
import { useCash } from '@/contexts/CashContext';
import Navbar from '@/components/Navbar';
import DashboardContent from '@/components/DashboardContent';
import OpenCashModal from '@/components/OpenCashModal';

export default function HomePage() {
  const { isOpen, loading, refresh } = useCash();
  const [showMandatoryModal, setShowMandatoryModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Si la caja está cerrada, mostramos el modal obligatorio
      setShowMandatoryModal(!isOpen);
    }
  }, [isOpen, loading]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando estado de caja...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <DashboardContent />
      
      {/* Modal obligatorio de apertura de caja */}
      <OpenCashModal
        isOpen={showMandatoryModal}
        onClose={() => {}} // No hace nada (no se puede cerrar)
        onSuccess={() => {
          setShowMandatoryModal(false);
          refresh();
        }}
        mandatory={true}
      />
    </>
  );
}