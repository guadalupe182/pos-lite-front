'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function PaymentPendingContent() {
  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto text-2xl font-bold">
            ⏳
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide mb-2">
              Pago En Proceso
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transacción Pendiente</h1>
            <p className="mt-2 text-xs text-slate-500">
              Tu pago está siendo verificado o pendiente de depósito (pago en efectivo/OXXO). En cuanto se confirme, se acreditará la venta.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
                href="/sales"
                className="w-full inline-flex justify-center py-3 px-5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-all shadow-md shadow-sky-600/20"
            >
              Regresar a la Terminal de Ventas
            </Link>
            <Link
                href="/sales-report"
                className="w-full inline-flex justify-center py-3 px-5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
            >
              Ver Reporte de Ventas
            </Link>
          </div>
        </div>
      </div>
  );
}

export default function PaymentPendingPage() {
  return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center text-slate-500 text-xs font-medium animate-pulse">
            Cargando estado del pago...
          </div>
        }>
          <PaymentPendingContent />
        </Suspense>
      </div>
  );
}