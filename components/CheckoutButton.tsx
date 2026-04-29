"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { apiFetch } from "@/lib/api";

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);

interface CheckoutButtonProps {
  items: { productId: number; quantity: number }[]; // 👈 Recibir el carrito
}

export default function CheckoutButton({ items }: CheckoutButtonProps) {
  const router = useRouter();
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      // Crear preferencia de pago con los items del carrito
      const response = await apiFetch("/api/payments/create-preference", {
        method: "POST",
        body: JSON.stringify({ items }),
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
        initialization={{ preferenceId }}
        customization={{
          paymentMethods: {
            atm: "all",
            ticket: "all",
            creditCard: "all",
          },
        }}
        onSubmit={async (param) => {
          console.log("Pago completado", param);
          // 🔥 Aquí registrar la venta después del pago exitoso
          try {
            const saleResponse = await apiFetch("/api/sales", {
              method: "POST",
              body: JSON.stringify({ items }),
            });
            if (saleResponse.ok) {
              router.push("/sales?success=true");
            } else {
              console.error("Error al registrar venta");
            }
          } catch (error) {
            console.error("Error:", error);
          }
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
