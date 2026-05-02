"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Limpiar carrito después de pago exitoso
    localStorage.removeItem("cart");
    
    // Redirigir automáticamente después de 5 segundos
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
      return "💵 Venta registrada en efectivo exitosamente";
    }
    return "💳 Tu pago con tarjeta se ha realizado correctamente";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white border border-green-400 text-green-700 px-6 py-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">¡Pago exitoso!</h1>
        <p className="mb-4">{getMessage()}</p>
        <p className="mb-4 text-sm text-gray-500">
          En breve recibirás tu comprobante.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sales"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Registrar nueva venta
          </Link>
          <Link
            href="/sales-report"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Ver reporte
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Redirigiendo a ventas en {countdown} segundos...
        </p>
      </div>
    </div>
  );
}