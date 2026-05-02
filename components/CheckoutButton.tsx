"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { apiFetch } from "@/lib/api";

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);

interface CheckoutButtonProps {
  items: { productId: number; quantity: number; price?: number; name?: string }[];
  onSuccess?: () => void;
}

export default function CheckoutButton({ items, onSuccess }: CheckoutButtonProps) {
  const router = useRouter();
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"mp" | "cash">("mp");

  const totalAmount = items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);

  // Manejar pago en efectivo
  const handleCashPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/sales", {
        method: "POST",
        body: JSON.stringify({ 
          items: items.map(({ productId, quantity }) => ({ productId, quantity })) 
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login?returnUrl=/checkout";
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Venta registrada en efectivo:", data);
      
      if (onSuccess) onSuccess();
      
      // Limpiar carrito del localStorage
      localStorage.removeItem("cart");
      
      // Redirigir a página de éxito
      router.push("/payment/success?method=cash");
    } catch (err: unknown) {
      console.error("Error al registrar venta en efectivo", err);
      let message = "Error al procesar el pago en efectivo";
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      router.push("/payment/failure");
    } finally {
      setLoading(false);
    }
  };

  // Manejar pago con MercadoPago
  const handleMPPayment = async () => {
    setLoading(true);
    setError(null);
    try {
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
      }
      setError(message);
      router.push("/payment/failure");
    } finally {
      setLoading(false);
    }
  };

  // Si ya tenemos preferenceId, mostrar el brick de MercadoPago
  if (preferenceId) {
    return (
      <Payment
        initialization={{ preferenceId, amount: totalAmount }}
        customization={{
          paymentMethods: {
            atm: "all",
            ticket: "all",
            creditCard: "all",
          },
        }}
        onReady={() => {
          console.log("Payment brick ready");
        }}
        onError={async (error) => {
          console.error("Payment error:", error);
          router.push("/payment/failure");
        }}
        onSubmit={async () => {
          console.log("Pago completado (desde frontend)");
          try {
            const saleResponse = await apiFetch("/api/sales", {
              method: "POST",
              body: JSON.stringify({ items: items.map(({ productId, quantity }) => ({ productId, quantity })) }),
            });
            if (saleResponse.ok) {
              if (onSuccess) onSuccess();
            }
          } catch (error) {
            console.error("Error registrando venta:", error);
          }
          setTimeout(() => {
            router.push("/payment/success");
          }, 2000);
        }}
      />
    );
  }

  // Mostrar selector de método de pago
  return (
    <div className="space-y-4">
      {/* Selector de método de pago */}
      <div className="flex gap-4 justify-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="mp"
            checked={paymentMethod === "mp"}
            onChange={() => setPaymentMethod("mp")}
            className="cursor-pointer"
          />
          <span>💳 Tarjeta (MercadoPago)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="cash"
            checked={paymentMethod === "cash"}
            onChange={() => setPaymentMethod("cash")}
            className="cursor-pointer"
          />
          <span>💵 Efectivo</span>
        </label>
      </div>

      {/* Botón de pago dinámico */}
      <button
        onClick={paymentMethod === "mp" ? handleMPPayment : handleCashPayment}
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Procesando..." : paymentMethod === "mp" ? "Pagar con Mercado Pago" : "Pagar en efectivo"}
      </button>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}