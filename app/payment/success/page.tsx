'use client';

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    localStorage.removeItem("cart");

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/sales");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const getMessage = () => {
    if (method === "cash") {
      return "Venta registrada en efectivo exitosamente.";
    }
    return "Tu pago con tarjeta se ha procesado correctamente.";
  };

  return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide mb-2">
              Transacción Aprobada
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">¡Cobro Exitoso!</h1>
            <p className="mt-2 text-xs text-slate-600 font-medium">{getMessage()}</p>
            <p className="text-[11px] text-slate-400 mt-1">El comprobante ha sido generado en el sistema.</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Link
                href="/sales"
                className="flex-1 inline-flex justify-center py-3 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-all shadow-md shadow-sky-600/20"
            >
              Nueva Venta
            </Link>
            <Link
                href="/sales-report"
                className="flex-1 inline-flex justify-center py-3 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
            >
              Ver Reporte
            </Link>
          </div>

          <p className="text-[11px] font-mono text-slate-400 pt-2">
            Redirigiendo a ventas en <span className="font-bold text-sky-600">{countdown}s</span>...
          </p>
        </div>
      </div>
  );
}

export default function PaymentSuccessPage() {
  return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center text-slate-500 text-xs font-medium animate-pulse">
            Procesando resultado exitoso...
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </div>
  );
}