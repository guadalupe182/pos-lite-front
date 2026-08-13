'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { apiFetch } from '@/lib/api';

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '';

if (typeof window !== 'undefined' && MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-MX' });
}

interface CheckoutButtonProps {
  items?: { productId: number; quantity: number; price?: number; name?: string }[];
  onSuccess?: () => void;
}

export default function CheckoutButton({ items = [], onSuccess }: CheckoutButtonProps) {
  const router = useRouter();
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mp' | 'cash'>('mp');
  const [cashReceived, setCashReceived] = useState<string>('');

  useEffect(() => {
    if (MP_PUBLIC_KEY) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-MX' });
    }
  }, []);

  const safeItems = Array.isArray(items) ? items : [];

  // Subtotal, IVA 16% y Total
  const subtotal =
      Math.round(
          safeItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0) * 100
      ) / 100;

  const taxAmount = Math.round(subtotal * 0.16 * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  const cashNum = Math.round((parseFloat(cashReceived) || 0) * 100) / 100;

  const changeGiven =
      cashNum >= totalAmount
          ? Math.round((cashNum - totalAmount) * 100) / 100
          : 0;

  const handleMPPayment = async () => {
    if (!MP_PUBLIC_KEY) {
      setError('Falta configurar NEXT_PUBLIC_MP_PUBLIC_KEY en .env.local');
      return;
    }

    if (!customerEmail.trim()) {
      setError('Por favor ingresa el correo electrónico del cliente');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/payments/create-preference', {
        method: 'POST',
        body: JSON.stringify({ items: safeItems, customerEmail, totalAmount }),
      });

      const data = (await response.json()) as { id?: string; preferenceId?: string };
      const id = data.id || data.preferenceId;
      if (id) {
        setPreferenceId(id);
      } else {
        throw new Error('Respuesta inválida del servidor al crear la preferencia');
      }
    } catch (err: unknown) {
      let message = 'Error al procesar el pago con Mercado Pago';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = async () => {
    if (!customerEmail.trim()) {
      setError('Por favor ingresa el correo electrónico del cliente');
      return;
    }

    const actualCash = cashReceived.trim() !== '' ? cashNum : totalAmount;

    if (actualCash < totalAmount) {
      setError(
          `El efectivo recibido ($${actualCash.toFixed(
              2
          )}) es menor al total con IVA ($${totalAmount.toFixed(2)})`
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'CASH',
          customerEmail,
          items: safeItems.map(({ productId, quantity }) => ({ productId, quantity })),
          cashReceived: actualCash,
          changeGiven,
          totalAmount,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          void router.push('/login?returnUrl=/checkout');
          return;
        }

        let serverMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = (await response.json()) as { message?: string; error?: string };
          if (errData.message || errData.error) {
            serverMsg = errData.message || errData.error || serverMsg;
          }
        } catch {
          // Si no vino JSON válido
        }
        throw new Error(serverMsg);
      }

      if (onSuccess) onSuccess();
      localStorage.removeItem('cart');
      void router.push('/payment/success?method=cash');
    } catch (err: unknown) {
      let message = 'Error al procesar el pago en efectivo';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (paymentMethod === 'mp') {
      void handleMPPayment();
    } else {
      void handleCashPayment();
    }
  };

  if (preferenceId && MP_PUBLIC_KEY) {
    return (
        <div className="space-y-4">
          <Payment
              initialization={{
                preferenceId,
                amount: totalAmount,
                payer: {
                  email: customerEmail,
                },
              }}
              customization={{
                paymentMethods: {
                  ticket: 'all',
                  creditCard: 'all',
                  debitCard: 'all',
                  mercadoPago: 'all',
                },
              }}
              onError={(err) => {
                console.error('Error en Mercado Pago Brick:', err);
                setError('Ocurrió un error al cargar la pasarela de Mercado Pago');
              }}
              onSubmit={async () => {
                try {
                  const saleResponse = await apiFetch('/api/sales', {
                    method: 'POST',
                    body: JSON.stringify({
                      paymentMethod: 'MERCADO_PAGO',
                      customerEmail,
                      items: safeItems.map(({ productId, quantity }) => ({
                        productId,
                        quantity,
                      })),
                      totalAmount,
                    }),
                  });

                  if (saleResponse.ok) {
                    if (onSuccess) onSuccess();
                    localStorage.removeItem('cart');
                    void router.push('/payment/success');
                  } else {
                    let serverMsg = 'No se pudo registrar la venta en el sistema';
                    try {
                      const errData = (await saleResponse.json()) as { message?: string; error?: string };
                      serverMsg = errData.message || errData.error || serverMsg;
                    } catch {
                      // Fallback si no hay JSON
                    }
                    setError(serverMsg);
                    setPreferenceId(null); // Regresa al menú para mostrar el mensaje de error
                  }
                } catch (err: unknown) {
                  let message = 'Error de conexión al guardar la venta';
                  if (err instanceof Error) {
                    message = err.message;
                  }
                  setError(message);
                  setPreferenceId(null);
                }
              }}
          />
          <button
              onClick={() => setPreferenceId(null)}
              className="w-full text-xs text-gray-500 underline text-center pt-2"
          >
            ← Cambiar método de pago
          </button>
        </div>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-xs focus:border-sky-500 focus:ring-sky-500 text-sm p-2.5 border text-gray-900 bg-white"
          />
        </div>

        <div className="flex gap-6 py-1">
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-800 cursor-pointer">
            <input
                type="radio"
                name="paymentMethod"
                value="mp"
                checked={paymentMethod === 'mp'}
                onChange={() => setPaymentMethod('mp')}
                className="text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
            <span>Mercado Pago</span>
          </label>

          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-800 cursor-pointer">
            <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
                className="text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
            <span>Efectivo</span>
          </label>
        </div>

        {paymentMethod === 'cash' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Monto Recibido ($)
                </label>
                <input
                    type="number"
                    step="0.01"
                    min={totalAmount}
                    value={cashReceived}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder={totalAmount.toFixed(2)}
                    className="block w-full rounded-lg border-gray-300 shadow-xs focus:border-green-500 focus:ring-green-500 text-lg font-bold p-2.5 border text-gray-900 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {cashNum > 0 && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-medium">${subtotal.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>IVA (16%):</span>
                      <span className="font-medium">${taxAmount.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 pt-1 border-t border-slate-100">
                      <span>Total a pagar:</span>
                      <span className="font-bold text-slate-800">${totalAmount.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Efectivo entregado:</span>
                      <span className="font-medium">${cashNum.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-green-700 pt-1 border-t border-slate-100">
                      <span>Cambio a entregar:</span>
                      <span>${changeGiven.toFixed(2)} MXN</span>
                    </div>
                  </div>
              )}
            </div>
        )}

        <button
            onClick={handleSubmit}
            disabled={loading || (paymentMethod === 'cash' && cashNum > 0 && cashNum < totalAmount)}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading
              ? 'Procesando...'
              : paymentMethod === 'mp'
                  ? 'Pagar con Mercado Pago'
                  : 'Registrar Pago en Efectivo'}
        </button>

        {error && (
            <div className="rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200">
              {error}
            </div>
        )}
      </div>
  );
}