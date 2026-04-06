"use client";

import { useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type Sale = {
  id: number;
  saleDate: string;
  total: number;
};

type GroupBy = "day" | "month";

interface ExtendedJSPDF extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export default function SalesReportPage() {
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("day");
  const chartRef = useRef<HTMLDivElement>(null);

  const fetchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const from = `${fromDate}T00:00:00Z`;
    const to = `${toDate}T23:59:59Z`;

    try {
      const res = await apiFetch(`/api/sales/report?from=${from}&to=${to}`);
      const data = await res.json();
      setSales(data);
    } catch {
      setError("Error al cargar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const groupSalesByDay = () => {
    const groups: { [key: string]: number } = {};
    sales.forEach((sale) => {
      const date = new Date(sale.saleDate).toLocaleDateString("es-MX");
      groups[date] = (groups[date] || 0) + sale.total;
    });
    return groups;
  };

  const groupSalesByMonth = () => {
    const groups: { [key: string]: number } = {};
    sales.forEach((sale) => {
      const date = new Date(sale.saleDate);
      const monthKey = date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
      });
      groups[monthKey] = (groups[monthKey] || 0) + sale.total;
    });
    return groups;
  };

  const getChartData = () => {
    const groups = groupBy === "day" ? groupSalesByDay() : groupSalesByMonth();
    return {
      labels: Object.keys(groups),
      datasets: [
        {
          label:
            groupBy === "day"
              ? "Ventas totales por día"
              : "Ventas totales por mes",
          data: Object.values(groups),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: groupBy === "day" ? "Ventas diarias" : "Ventas mensuales",
      },
    },
  };

  const totalGeneral = sales.reduce((sum, sale) => sum + sale.total, 0);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      sales.map((sale) => ({
        ID: sale.id,
        Fecha: new Date(sale.saleDate).toLocaleString(),
        Total: sale.total,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    XLSX.writeFile(workbook, `ventas_${fromDate}_${toDate}.xlsx`);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF() as ExtendedJSPDF;
    doc.text(`Reporte de ventas del ${fromDate} al ${toDate}`, 14, 16);

    const tableData = sales.map((sale) => [
      sale.id,
      new Date(sale.saleDate).toLocaleString(),
      sale.total.toFixed(2),
    ]);
    autoTable(doc, {
      head: [["ID Venta", "Fecha", "Total"]],
      body: tableData,
      startY: 30,
    });

    if (chartRef.current && sales.length > 0) {
      const canvas = await html2canvas(chartRef.current);
      const imgData = canvas.toDataURL("image/png");
      const imgProps = doc.getImageProperties(imgData);
      const imgWidth = 180;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      const finalY = doc.lastAutoTable?.finalY ?? 50;
      doc.addImage(imgData, "PNG", 15, finalY, imgWidth, imgHeight);
    }

    doc.save(`ventas_${fromDate}_${toDate}.pdf`);
  };

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Reporte de ventas</h1>
        <form onSubmit={fetchReport} className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
          {/* Campo Desde */}
          <div className="flex-1">
            <label htmlFor="fromDate" className="block mb-1 font-medium text-gray-700 cursor-pointer">
              Desde
            </label>
            <div className="relative">
              <input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('fromDate') as HTMLInputElement;
                  if (input) input.showPicker();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Campo Hasta */}
          <div className="flex-1">
            <label htmlFor="toDate" className="block mb-1 font-medium text-gray-700 cursor-pointer">
              Hasta
            </label>
            <div className="relative">
              <input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('toDate') as HTMLInputElement;
                  if (input) input.showPicker();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Selector Agrupar por */}
          <div className="flex-1">
            <label className="block mb-1 font-medium text-gray-700">Agrupar por</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="day">Día</option>
              <option value="month">Mes</option>
            </select>
          </div>

          {/* Botón Consultar */}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm transition-colors"
          >
            {loading ? 'Cargando...' : 'Consultar'}
          </button>
        </form>



        {error && <div className="text-red-500 mb-4">{error}</div>}

        {sales.length === 0 && !loading && (
          <p className="text-gray-500">
            No hay ventas en el período seleccionado.
          </p>
        )}

        {sales.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <div className="flex gap-2">
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
            </div>

            <div ref={chartRef} className="mb-8 max-w-3xl mx-auto">
              <Bar data={getChartData()} options={chartOptions} />
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
                <tfoot className="bg-gray-100 border-t-2 border-gray-400">
                  <tr className="font-bold">
                    <td colSpan={2} className="border p-2 text-right">
                      Total general:
                    </td>
                    <td className="border p-2">${totalGeneral.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
