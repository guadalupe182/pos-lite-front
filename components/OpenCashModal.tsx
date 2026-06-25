'use client';

import { useState } from 'react';
import { useCash } from '@/contexts/CashContext';

interface OpenCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OpenCashModal({ isOpen, onClose, onSuccess }: OpenCashModalProps) {
  const [initialCash, setInitialCash] = useState<string>(''); // 👈 Cambio a string
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openCash } = useCash();

  if (!isOpen) return null;

  // Convertir string a número (manejando comas y puntos)
  const parseCashValue = (value: string): number => {
    const cleaned = value.replace(/,/g, ''); // eliminar comas
    return parseFloat(cleaned) || 0;
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Permitir solo dígitos, punto y coma (para decimales)
    const filtered = raw.replace(/[^0-9.,]/g, '');
    setInitialCash(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cashAmount = parseCashValue(initialCash);
    if (cashAmount < 0) {
      setError('El monto inicial no puede ser negativo');
      return;
    }

    try {
      setLoading(true);
      await openCash(cashAmount);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir la caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Abrir Caja</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="initialCash" className="block text-sm font-medium text-gray-700 mb-1">
              Monto Inicial (efectivo en caja)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                id="initialCash"
                type="text" // 👈 Cambio a text
                inputMode="decimal"
                pattern="[0-9.,]*"
                value={initialCash}
                onChange={handleCashChange}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="0.00"
                required
                autoFocus
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ingresa el efectivo que hay actualmente en la caja.
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
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}