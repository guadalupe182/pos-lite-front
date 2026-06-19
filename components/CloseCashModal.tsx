'use client';

import React, { useState, useEffect } from 'react';
import { useCash } from '@/contexts/CashContext';
import { CashCloseReportDto, getDailySummary } from '@/lib/api';

interface CloseCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CloseCashModal({ isOpen, onClose, onSuccess }: CloseCashModalProps) {
  const [finalCash, setFinalCash] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CashCloseReportDto | null>(null);
  const [step, setStep] = useState<'confirm' | 'summary'>('confirm');
  const [dailyTotalSales, setDailyTotalSales] = useState<number>(0);
  const { session, closeCash } = useCash();

  // Cargar resumen del día al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setSummary(null);
      setFinalCash(0);
      setError(null);
      // Obtener ventas totales del día (para mostrar en el paso de confirmación)
      getDailySummary()
        .then(data => setDailyTotalSales(data.totalSales || 0))
        .catch(() => setDailyTotalSales(0));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (finalCash < 0) {
      setError('El monto final no puede ser negativo');
      return;
    }

    try {
      setLoading(true);
      const result = await closeCash(finalCash);
      setSummary(result);
      setStep('summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar la caja');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    onSuccess();
  };

  // === Paso de confirmación (antes de cerrar) ===
  if (step === 'confirm') {
    const initialCash = session?.initialCash || 0;
    // El esperado se calculará al cerrar, pero mostramos un aproximado si tenemos total de ventas
    const approximateExpected = initialCash + dailyTotalSales; // asumiendo que todas son en efectivo (no es exacto)

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Cerrar Caja</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>
              ✕
            </button>
          </div>

          {/* Resumen rápido del día */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
            <h3 className="font-medium text-gray-700">Resumen del día</h3>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-gray-500">Monto inicial:</span>
              <span className="font-medium text-right">{formatCurrency(initialCash)}</span>
              <span className="text-gray-500">Ventas totales (todos los métodos):</span>
              <span className="font-medium text-right">{formatCurrency(dailyTotalSales)}</span>
              <span className="text-gray-500 border-t pt-1 font-semibold">Esperado aprox.:</span>
              <span className="font-bold text-right border-t pt-1 text-blue-600">
                {formatCurrency(approximateExpected)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              El esperado exacto se calculará al cerrar considerando solo ventas en efectivo.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="finalCash" className="block text-sm font-medium text-gray-700 mb-1">
                Efectivo contado en caja
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  id="finalCash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={finalCash}
                  onChange={(e) => setFinalCash(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="0.00"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ingresa el total de efectivo contado físicamente en la caja.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // === Paso de resumen (después del cierre) ===
  if (step === 'summary' && summary) {
    const isOver = summary.difference > 0;
    const isShort = summary.difference < 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Cierre Completado</h2>
            <button onClick={handleDone} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="text-center mb-6">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                isOver
                  ? 'bg-yellow-100 text-yellow-600'
                  : isShort
                  ? 'bg-red-100 text-red-600'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              {isOver ? '💰' : isShort ? '⚠️' : '✅'}
            </div>
            <h3 className="text-lg font-semibold mt-2">
              {isOver
                ? `Sobrante de ${formatCurrency(summary.difference)}`
                : isShort
                ? `Faltante de ${formatCurrency(Math.abs(summary.difference))}`
                : '¡Caja perfecta!'}
            </h3>
            <p className="text-sm text-gray-500">
              {isOver
                ? 'El efectivo contado supera lo esperado. Revisa si hay ingresos extras.'
                : isShort
                ? 'El efectivo contado es menor a lo esperado. Revisa si hay gastos o faltantes.'
                : 'El efectivo contado coincide exactamente con lo esperado.'}
            </p>
          </div>

          {/* Datos del cierre */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="text-gray-500">Monto inicial:</span>
              <span className="font-medium text-right">{formatCurrency(summary.initialCash)}</span>
              <span className="text-gray-500">Ventas en efectivo:</span>
              <span className="font-medium text-right">{formatCurrency(summary.totalCashSales)}</span>
              <span className="text-gray-500 font-semibold">Esperado:</span>
              <span className="font-bold text-right">{formatCurrency(summary.expectedCash)}</span>
              <span className="text-gray-500">Contado final:</span>
              <span className="font-medium text-right">{formatCurrency(summary.finalCash)}</span>
              <span className="text-gray-500 border-t pt-1 font-semibold">Diferencia:</span>
              <span
                className={`font-bold text-right border-t pt-1 ${
                  isOver ? 'text-yellow-600' : isShort ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {isOver ? '+' : ''}{formatCurrency(summary.difference)}
              </span>
            </div>
          </div>

          {/* Desglose de ventas por método de pago */}
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Desglose de ventas</h4>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="text-gray-500">Total ventas:</span>
              <span className="font-bold text-right">{formatCurrency(summary.totalSales)}</span>

              <span className="text-gray-500">Efectivo:</span>
              <span className="font-medium text-right">{formatCurrency(summary.totalCashSales)}</span>

              <span className="text-gray-500">Mercado Pago:</span>
              <span className="font-medium text-right">{formatCurrency(summary.totalMercadoPagoSales)}</span>

              <span className="text-gray-500 border-t pt-1">Tarjeta (total):</span>
              <span className="font-medium text-right border-t pt-1">{formatCurrency(summary.totalCardSales)}</span>

              {/* Desglose por tipo de tarjeta */}
              {summary.cardBreakdown && Object.entries(summary.cardBreakdown).map(([method, amount]) => (
                <React.Fragment key={method}>
                  <span className="text-gray-500 pl-4">- {method}:</span>
                  <span className="font-medium text-right">{formatCurrency(amount)}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleDone}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}