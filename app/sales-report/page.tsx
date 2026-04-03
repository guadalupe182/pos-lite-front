'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Sale = {
  id: number;
  saleDate: string;
  total: number;
};

export default function SalesReportPage() {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const from = `${fromDate}T00:00:00Z`;
    const to = `${toDate}T23:59:59Z`;

    try {
      const res = await apiFetch(`/api/sales/report?from=${from}&to=${to}`);
      const data = await res.json();
      setSales(data);
    } catch (err) {
      setError('Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      sales.map((sale) => ({
        ID: sale.id,
        Fecha: new Date(sale.saleDate).toLocaleString(),
        Total: sale.total,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');
    XLSX.writeFile(workbook, `ventas_${fromDate}_${toDate}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Reporte de ventas del ${fromDate} al ${toDate}`, 14, 16);
    const tableData = sales.map((sale) => [
      sale.id,
      new Date(sale.saleDate).toLocaleString(),
      sale.total.toFixed(2),
    ]);
    autoTable(doc, {
      head: [['ID Venta', 'Fecha', 'Total']],
      body: tableData,
      startY: 20,
    });
    doc.save(`ventas_${fromDate}_${toDate}.pdf`);
  };

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Reporte de ventas</h1>
        <form onSubmit={fetchReport} className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
          <div>
            <label className="block mb-1">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
        </form>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {sales.length === 0 && !loading && (
          <p className="text-gray-500">No hay ventas en el período seleccionado.</p>
        )}

        {sales.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row justify-end mb-4 space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                onClick={exportToExcel}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Exportar a Excel
              </button>
              <button
                onClick={exportToPDF}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Exportar a PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="border p-2">ID Venta</th>
                    <th className="border p-2">Fecha</th>
                    <th className="border p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="border p-2">{sale.id}</td>
                      <td className="border p-2">
                        {new Date(sale.saleDate).toLocaleString()}
                      </td>
                      <td className="border p-2">${sale.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}