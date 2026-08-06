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
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mp" | "cash">("mp");
  const [cashReceived, setCashReceived] = useState<string>("");

  // Cálculo exacto de total redondeado a 2 decimales
  const totalAmount =
      Math.round(
          items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0) * 100
      ) / 100;

  const cashNum = Math.round((parseFloat(cashReceived) || 0) * 100) / 100;

  // Cálculo de cambio sin imprecisiones flotantes
  const changeGiven =
      cashNum >= totalAmount
          ? Math.round((cashNum - totalAmount) * 100) / 100
          : 0;

  // Pago con MercadoPago
  const handleMPPayment = async () => {
    if (!customerEmail.trim()) {
      setError("Por favor ingresa el correo electrónico del cliente");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/payments/create-preference", {
        method: "POST",
        body: JSON.stringify({ items, customerEmail }),
      });

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
    } finally {
      setLoading(false);
    }
  };

  // Pago en efectivo
  const handleCashPayment = async () => {
    if (!customerEmail.trim()) {
      setError("Por favor ingresa el correo electrónico del cliente");
      return;
    }

    const actualCash = cashReceived.trim() !== "" ? cashNum : totalAmount;

    if (actualCash < totalAmount) {
      setError(
          `El efectivo recibido ($${actualCash.toFixed(
              2
          )}) es menor al total ($${totalAmount.toFixed(2)})`
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/sales?paymentMethod=CASH", {
        method: "POST",
        body: JSON.stringify({
          items: items.map(({ productId, quantity }) => ({ productId, quantity })),
          customerEmail,
          cashReceived: actualCash,
          changeGiven,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login?returnUrl=/checkout";
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      if (onSuccess) onSuccess();
      localStorage.removeItem("cart");
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

  const handleSubmit = () => {
    if (paymentMethod === "mp") {
      handleMPPayment();
    } else {
      handleCashPayment();
    }
  };

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
            onError={async (err) => {
              console.error("Payment error:", err);
              router.push("/payment/failure");
            }}
            onSubmit={async () => {
              console.log("Pago completado (desde frontend)");
              try {
                const saleResponse = await apiFetch("/api/sales", {
                  method: "POST",
                  body: JSON.stringify({
                    items: items.map(({ productId, quantity }) => ({
                      productId,
                      quantity,
                    })),
                  }),
                });
                if (saleResponse.ok) {
                  if (onSuccess) onSuccess();
                }
              } catch (err) {
                console.error("Error registrando venta:", err);
              }
              setTimeout(() => {
                router.push("/payment/success");
              }, 2000);
            }}
        />
    );
  }

  return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Correo del Cliente
          </label>
          <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="cliente@ejemplo.com"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <input
                type="radio"
                name="paymentMethod"
                value="mp"
                checked={paymentMethod === "mp"}
                onChange={() => setPaymentMethod("mp")}
                className="text-indigo-600 focus:ring-indigo-500"
            />
            <span>Mercado Pago</span>
          </label>

          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
            <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
                className="text-indigo-600 focus:ring-indigo-500"
            />
            <span>Efectivo</span>
          </label>
        </div>

        {paymentMethod === "cash" && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-md border">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Monto Recibido ($)
                </label>
                <input
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={totalAmount.toFixed(2)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
                />
              </div>
              {cashNum > 0 && (
                  <div className="text-xs font-semibold text-gray-700">
                    Cambio: ${changeGiven.toFixed(2)}
                  </div>
              )}
            </div>
        )}

        <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
              ? "Procesando..."
              : paymentMethod === "mp"
                  ? "Pagar con Mercado Pago"
                  : "Registrar Pago en Efectivo"}
        </button>

        {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
        )}
      </div>
  );
}