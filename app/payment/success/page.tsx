// app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const preferenceId = searchParams.get('preference_id');

  useEffect(() => {
    // Aquí podrías consultar el estado del pago a tu backend si quisieras más detalle
    // Por ahora, simulamos o mostramos mensaje genérico
    if (preferenceId) {
      setPaymentInfo({ id: preferenceId });
    }
  }, [preferenceId]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ¡Pago exitoso!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tu transacción se ha realizado correctamente. En breve recibirás un correo de confirmación.
          </p>
          {paymentInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md text-left">
              <p className="text-xs text-gray-500">ID de referencia:</p>
              <p className="text-sm font-mono text-gray-700">{paymentInfo.id}</p>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/sales"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Regresar a ventas
            </Link>
            <Link
              href="/sales-report"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Ver reporte de ventas
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
