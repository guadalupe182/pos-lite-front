'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { CalendarIcon } from '@heroicons/react/24/outline';

type Sale = {
  id: number;
  saleDate: string;
  total: number;
  paymentMethod: string;
  items?: any[];
};

export default function SalesReportPage() {
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const from = new Date(fromDate).toISOString();
      const to = new Date(toDate + 'T23:59:59').toISOString();
      const res = await apiFetch(`/api/sales/report?from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Error al obtener ventas');
      const data = await res.json();
      setSales(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [fromDate, toDate]);

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  // Agrupar ventas por día, semana o mes
  const getGroupedSales = () => {
    const groups: { [key: string]: Sale[] } = {};
    sales.forEach((sale) => {
      const date = new Date(sale.saleDate);
      let key: string;
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(sale);
    });
    return groups;
  };

  const groupedSales = getGroupedSales();
  const groupKeys = Object.keys(groupedSales).sort();

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Reporte de ventas</h1>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <div className="relative">
                <input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <div className="relative">
                <input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="groupBy" className="block text-sm font-medium text-gray-700 mb-1">
                Agrupar por
              </label>
              <select
                id="groupBy"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="day">Día</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total ventas</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalSales)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Número de ventas</p>
              <p className="text-xl font-bold text-gray-800">{sales.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Promedio por venta</p>
              <p className="text-xl font-bold text-gray-800">
                {sales.length > 0 ? formatCurrency(totalSales / sales.length) : '$0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Período</p>
              <p className="text-xl font-bold text-gray-800">
                {fromDate} → {toDate}
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de ventas */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando reporte...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : sales.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No hay ventas en el período seleccionado.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Venta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método de pago
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{sale.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(sale.saleDate)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{sale.paymentMethod}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                      Total general:
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      {formatCurrency(totalSales)}
                    </td>
                    <td className="px-6 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}