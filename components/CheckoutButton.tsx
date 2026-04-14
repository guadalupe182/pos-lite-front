"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // <-- importa useRouter
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { apiFetch } from "@/lib/api";

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);

interface CheckoutButtonProps {
  amount: number;
  description: string;
  quantity: number;
}

export default function CheckoutButton({ amount, description, quantity }: CheckoutButtonProps) {
  const router = useRouter(); // <-- hook para redirigir
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/payments/create-preference", {
        method: "POST",
        body: JSON.stringify({ description, quantity, amount }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login?returnUrl=/checkout";
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.id) {
        setPreferenceId(data.id);
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (err: unknown) {
      console.error("Error al llamar al backend", err);
      let message = "Error al procesar el pago";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (preferenceId) {
    return (
      <Payment
        initialization={{ preferenceId, amount }}
        customization={{
          paymentMethods: {
            atm: "all",
            ticket: "all",
            creditCard: "all",
          },
        }}
        onSubmit={async (param) => {
          console.log("Pago completado", param);
          // Redirige a la página de ventas (o a donde prefieras) después del pago
          router.push("/sales");  // o "/success"
          return { id: preferenceId };
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Procesando..." : "Pagar con Mercado Pago"}
      </button>
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}