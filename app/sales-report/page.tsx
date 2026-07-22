'use client';

import { useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ExcelJS from "exceljs";
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
      setSales(Array.isArray(data) ? data : []);
    } catch {
      setError("Error al cargar el reporte de ventas");
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
                  ? "Ventas totales por día ($ MXN)"
                  : "Ventas totales por mes ($ MXN)",
          data: Object.values(groups),
          backgroundColor: "rgba(2, 132, 199, 0.75)", // Tone sky-600
          borderColor: "rgba(2, 132, 199, 1)",
          borderWidth: 1.5,
          borderRadius: 8,
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
        text: groupBy === "day" ? "Comportamiento Diario de Ventas" : "Comportamiento Mensual de Ventas",
        font: { size: 14, weight: 'bold' as const }
      },
    },
  };

  const totalGeneral = sales.reduce((sum, sale) => sum + sale.total, 0);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ventas");

    worksheet.columns = [
      { header: "ID Venta", key: "id", width: 15 },
      { header: "Fecha y Hora", key: "date", width: 28 },
      { header: "Monto Total ($)", key: "total", width: 18 },
    ];

    sales.forEach((sale) => {
      worksheet.addRow({
        id: sale.id,
        date: new Date(sale.saleDate).toLocaleString(),
        total: sale.total,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reporte_ventas_gdev_${fromDate}_${toDate}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF() as ExtendedJSPDF;
    doc.text(`GDEV POS - Reporte de Ventas (${fromDate} al ${toDate})`, 14, 16);

    const tableData = sales.map((sale) => [
      sale.id,
      new Date(sale.saleDate).toLocaleString(),
      `$${sale.total.toFixed(2)}`,
    ]);
    autoTable(doc, {
      head: [["ID Venta", "Fecha y Hora", "Total"]],
      body: tableData,
      startY: 24,
    });

    if (chartRef.current && sales.length > 0) {
      const canvas = await html2canvas(chartRef.current);
      const imgData = canvas.toDataURL("image/png");
      const imgProps = doc.getImageProperties(imgData);
      const imgWidth = 180;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      const finalY = doc.lastAutoTable?.finalY ?? 50;
      doc.addImage(imgData, "PNG", 15, finalY + 10, imgWidth, imgHeight);
    }

    doc.save(`reporte_ventas_gdev_${fromDate}_${toDate}.pdf`);
  };

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

          {/* Encabezado GDEV */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 uppercase tracking-wide mb-1">
                📈 Analítica & Reportes
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reporte General de Ventas</h1>
            </div>

            {sales.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total del Periodo:</span>
                  <span className="text-xl font-black text-emerald-700">${totalGeneral.toFixed(2)}</span>
                </div>
            )}
          </div>

          {/* Formulario de Filtros */}
          <form onSubmit={fetchReport} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="fromDate" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">
                Fecha Inicial
              </label>
              <div className="relative">
                <input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white pr-9"
                    required
                />
                <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('fromDate') as HTMLInputElement;
                      if (input) input.showPicker();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  📅
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="toDate" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 cursor-pointer">
                Fecha Final
              </label>
              <div className="relative">
                <input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white pr-9"
                    required
                />
                <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('toDate') as HTMLInputElement;
                      if (input) input.showPicker();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  📅
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Agrupar Gráfico
              </label>
              <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="day">Por Día</option>
                <option value="month">Por Mes</option>
              </select>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Consultando...' : 'Generar Reporte'}
            </button>
          </form>

          {error && (
              <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-medium">
                {error}
              </div>
          )}

          {sales.length === 0 && !loading && (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
                No se encontraron ventas registradas en el periodo seleccionado.
              </div>
          )}

          {sales.length > 0 && (
              <>
                {/* Botones Exportación */}
                <div className="flex justify-end gap-2">
                  <button
                      onClick={exportToExcel}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    📊 Exportar Excel
                  </button>
                  <button
                      onClick={exportToPDF}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    📄 Exportar PDF
                  </button>
                </div>

                {/* Gráfico Bar Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <div ref={chartRef} className="max-w-3xl mx-auto">
                    <Bar data={getChartData()} options={chartOptions} />
                  </div>
                </div>

                {/* Tabla de Resultados */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="p-4">ID Venta</th>
                        <th className="p-4">Fecha y Hora</th>
                        <th className="p-4 text-right">Monto Total</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                      {sales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mono text-xs font-bold text-slate-600">#{sale.id}</td>
                            <td className="p-4 text-slate-700 font-medium">
                              {new Date(sale.saleDate).toLocaleString()}
                            </td>
                            <td className="p-4 text-right font-black text-slate-900">${sale.total.toFixed(2)}</td>
                          </tr>
                      ))}
                      </tbody>
                      <tfoot className="bg-emerald-50/60 border-t-2 border-emerald-200">
                      <tr className="font-bold text-slate-900">
                        <td colSpan={2} className="p-4 text-right uppercase text-xs tracking-wider text-emerald-900">
                          Total acumulado:
                        </td>
                        <td className="p-4 text-right text-base text-emerald-800 font-black">
                          ${totalGeneral.toFixed(2)}
                        </td>
                      </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
          )}
        </main>
      </div>
  );
}