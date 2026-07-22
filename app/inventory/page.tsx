'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

type InventoryItem = {
  productId: number;
  barcode: string;
  name: string;
  stock: number;
  minStock: number;
  lowStock: boolean;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState("");
  const [deltaInput, setDeltaInput] = useState<string>("1");
  const [adjustMessage, setAdjustMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/sales/inventory-report");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Error al cargar el reporte de inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const filteredItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    if (!searchTerm.trim()) return items;

    const term = searchTerm.toLowerCase().trim();
    return items.filter(
        (item) =>
            item?.name?.toLowerCase()?.includes(term) ||
            item?.barcode?.toLowerCase()?.includes(term)
    );
  }, [items, searchTerm]);

  // KPIs Resumen
  const totalLowStock = useMemo(() => items.filter((i) => i.lowStock).length, [items]);
  const totalUnits = useMemo(() => items.reduce((acc, curr) => acc + (curr.stock || 0), 0), [items]);

  const handleAdjustStock = async () => {
    const delta = parseInt(deltaInput, 10);

    if (!selectedBarcode) {
      setAdjustMessage({ type: "error", text: "Código de barras no válido" });
      return;
    }
    if (isNaN(delta) || delta === 0) {
      setAdjustMessage({ type: "error", text: "La cantidad debe ser diferente de cero" });
      return;
    }

    setAdjustMessage(null);
    try {
      const res = await apiFetch("/api/products/adjust-by-barcode", {
        method: "POST",
        body: JSON.stringify({ barcode: selectedBarcode, delta, reason: "MANUAL" }),
      });
      if (res.ok) {
        setAdjustMessage({ type: "success", text: "Stock actualizado correctamente" });
        setShowModal(false);
        setSelectedBarcode("");
        setDeltaInput("1");
        fetchInventory();
      } else {
        const errorText = await res.text();
        setAdjustMessage({ type: "error", text: errorText || "Error al ajustar stock" });
      }
    } catch {
      setAdjustMessage({ type: "error", text: "Error de conexión con el servidor" });
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inventario");

    worksheet.columns = [
      { header: "Código", key: "barcode", width: 18 },
      { header: "Producto", key: "name", width: 30 },
      { header: "Stock", key: "stock", width: 12 },
      { header: "Stock Mínimo", key: "minStock", width: 15 },
      { header: "Estado", key: "status", width: 15 },
    ];

    filteredItems.forEach((item) => {
      worksheet.addRow({
        barcode: item.barcode,
        name: item.name,
        stock: item.stock,
        minStock: item.minStock,
        status: item.lowStock ? "Stock Bajo" : "Normal",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inventario_gdev_${new Date().toISOString().slice(0, 10)}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("GDEV POS - Reporte de Inventario", 14, 16);
    const tableData = filteredItems.map((item) => [
      item.barcode,
      item.name,
      item.stock,
      item.minStock,
      item.lowStock ? "Stock bajo" : "OK",
    ]);
    autoTable(doc, {
      head: [["Codigo", "Producto", "Stock", "Stock Minimo", "Estado"]],
      body: tableData,
      startY: 22,
    });
    doc.save(`inventario_gdev_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="text-slate-500 font-medium text-sm animate-pulse">Cargando inventario de productos...</div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

          {/* Encabezado GDEV */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 uppercase tracking-wide mb-1">
                📦 Control de Stock & Almacén
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventario General</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                  onClick={() => {
                    setSelectedBarcode("");
                    setDeltaInput("1");
                    setShowModal(true);
                  }}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 cursor-pointer"
              >
                + Ajustar Stock Manual
              </button>
              <button
                  onClick={exportToExcel}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                📊 Excel
              </button>
              <button
                  onClick={exportToPDF}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                📄 PDF
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas Rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Productos Registrados</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{items.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Unidades Almacén</span>
              <p className="text-2xl font-black text-sky-600 mt-1">{totalUnits}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alertas Stock Bajo</span>
              <p className={`text-2xl font-black mt-1 ${totalLowStock > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {totalLowStock}
              </p>
            </div>
          </div>

          {/* Buscador */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <input
                type="text"
                placeholder="Buscar producto por nombre o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>

          {adjustMessage && (
              <div
                  className={`p-3.5 rounded-xl text-sm border font-medium ${
                      adjustMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
              >
                {adjustMessage.text}
              </div>
          )}

          {error && (
              <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-medium">
                {error}
              </div>
          )}

          {/* Tabla de Inventario */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="p-4">Código</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4 text-center">Stock Actual</th>
                  <th className="p-4 text-center">Stock Mínimo</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                        No se encontraron registros de inventario.
                      </td>
                    </tr>
                ) : (
                    filteredItems.map((item) => (
                        <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono text-xs font-semibold text-slate-600">{item.barcode}</td>
                          <td className="p-4 font-semibold text-slate-900">{item.name}</td>
                          <td className="p-4 text-center font-bold text-slate-800">{item.stock}</td>
                          <td className="p-4 text-center text-slate-500">{item.minStock}</td>
                          <td className="p-4 text-center">
                            {item.lowStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            ⚠️ Stock Bajo
                          </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Normal
                          </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                                onClick={() => {
                                  setSelectedBarcode(item.barcode);
                                  setDeltaInput("1");
                                  setShowModal(true);
                                }}
                                className="bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Ajustar
                            </button>
                          </td>
                        </tr>
                    ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Modal de Ajuste de Stock */}
        {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">Ajuste de Inventario</h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold">
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Código de Barras
                    </label>
                    <input
                        type="text"
                        value={selectedBarcode}
                        onChange={(e) => setSelectedBarcode(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        placeholder="Ingrese el código de barras..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Ajuste de Cantidad
                    </label>
                    <span className="block text-[11px] text-slate-400 mb-1.5">
                  Usa valores positivos para entradas (ej. 5) o negativos para salidas (ej. -3).
                </span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={deltaInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || val === "-" || /^-?\d*$/.test(val)) {
                            setDeltaInput(val);
                          }
                        }}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <button
                      onClick={handleAdjustStock}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold p-3 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-sky-600/20"
                  >
                    Confirmar Ajuste
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}