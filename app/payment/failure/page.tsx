'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function PaymentFailureContent() {
  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto text-2xl font-bold">
            ✕
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide mb-2">
              Transacción Rechazada
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Error en el Pago</h1>
            <p className="mt-2 text-xs text-slate-500">
              No se pudo procesar la transacción. Verifica tus datos de tarjeta o intenta con otro método.
            </p>
          </div>

          <div className="pt-2">
            <Link
                href="/checkout"
                className="w-full inline-flex justify-center py-3 px-5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-all shadow-md shadow-sky-600/20"
            >
              ← Volver al Checkout e Intentar de Nuevo
            </Link>
          </div>
        </div>
      </div>
  );
}

export default function PaymentFailurePage() {
  return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center text-slate-500 text-xs font-medium animate-pulse">
            Cargando resultado...
          </div>
        }>
          <PaymentFailureContent />
        </Suspense>
      </div>
  );
}