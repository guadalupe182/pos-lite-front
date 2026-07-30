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

  // Campos agregados: Efectivo recibido y Correo del cliente
  const [cashReceived, setCashReceived] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");

  const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  const totalAmount = subtotal * 1.16; // Con IVA (16%)

  const cashNum = parseFloat(cashReceived) || 0;
  const changeGiven = cashNum > totalAmount ? cashNum - totalAmount : 0;

  // Manejar pago en efectivo
  const handleCashPayment = async () => {
    setLoading(true);
    setError(null);

    if (cashReceived && cashNum < totalAmount) {
      setError(`El efectivo recibido ($${cashNum.toFixed(2)}) es menor al total ($${totalAmount.toFixed(2)})`);
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch("/api/sales?paymentMethod=EFECTIVO", {
        method: "POST",
        body: JSON.stringify({
          items: items.map(({ productId, quantity }) => ({ productId, quantity })),
          cashReceived: cashNum > 0 ? cashNum : totalAmount,
          change: changeGiven,
          customerEmail: customerEmail.trim() || undefined,
        }),
      });

      const data = await response.json();
      console.log("Venta registrada en efectivo:", data);

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

  // Si ya tenemos preferenceId, mostrar el brick de MercadoPago
  if (preferenceId) {
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
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
                console.log("Procesando cobro MercadoPago desde frontend...");
                try {
                  // FIX: Se pasa explícitamente ?paymentMethod=MERCADOPAGO
                  const saleResponse = await apiFetch("/api/sales?paymentMethod=MERCADOPAGO", {
                    method: "POST",
                    body: JSON.stringify({
                      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
                      customerEmail: customerEmail.trim() || undefined,
                    }),
                  });

                  if (saleResponse.ok) {
                    if (onSuccess) onSuccess();
                    localStorage.removeItem("cart");
                    router.push("/payment/success?method=mercadopago");
                  }
                } catch (error) {
                  console.error("Error registrando venta tras pago MP:", error);
                  router.push("/payment/failure");
                }
              }}
          />
        </div>
    );
  }

  // Mostrar selector de método de pago
  return (
      <div className="space-y-4">
        {/* Selector de método de pago */}
        <div className="flex gap-6 justify-center bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-800">
          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors">
            <input
                type="radio"
                value="mp"
                checked={paymentMethod === "mp"}
                onChange={() => setPaymentMethod("mp")}
                className="cursor-pointer text-blue-600 focus:ring-blue-500"
            />
            <span>💳 Tarjeta (MercadoPago)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-green-600 transition-colors">
            <input
                type="radio"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
                className="cursor-pointer text-green-600 focus:ring-green-500"
            />
            <span>💵 Efectivo en Caja</span>
          </label>
        </div>

        {/* Email opcional del comprador para enviar ticket */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-600">
            Email del cliente (opcional para recibo):
          </label>
          <input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
          />
        </div>

        {/* Calculadora de Cambio para Pago en Efectivo */}
        {paymentMethod === "cash" && (
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-bold text-emerald-900">Monto Recibido ($):</label>
                <input
                    type="number"
                    step="0.01"
                    placeholder={totalAmount.toFixed(2)}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-32 px-3 py-1.5 text-xs font-bold text-slate-900 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right bg-white"
                />
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-emerald-200/60 text-emerald-900">
                <span>Cambio a Devolver:</span>
                <span className="font-mono text-sm text-emerald-700">${changeGiven.toFixed(2)} MXN</span>
              </div>
            </div>
        )}

        {/* Botón de pago dinámico */}
        <button
            onClick={paymentMethod === "mp" ? handleMPPayment : handleCashPayment}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {loading
              ? "Procesando..."
              : paymentMethod === "mp"
                  ? "Continuar a pasarela Mercado Pago"
                  : "Completar cobro en efectivo"}
        </button>

        {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
        )}
      </div>
  );
}