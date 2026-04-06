"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [delta, setDelta] = useState(1);
  const [adjustMessage, setAdjustMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/sales/inventory-report");
      const data = await res.json();
      setItems(data);
    } catch {
      setError("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Filtrar inventario por nombre o código de barras
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjustStock = async () => {
    if (!selectedBarcode) {
      setAdjustMessage({ type: "error", text: "Código de barras no válido" });
      return;
    }
    if (delta === 0) {
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
        setDelta(1);
        fetchInventory();
      } else {
        const errorText = await res.text();
        setAdjustMessage({ type: "error", text: errorText || "Error al ajustar stock" });
      }
    } catch {
      setAdjustMessage({ type: "error", text: "Error de conexión con el servidor" });
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => ({
        Código: item.barcode,
        Producto: item.name,
        Stock: item.stock,
        "Stock mínimo": item.minStock,
        Estado: item.lowStock ? "Stock bajo" : "OK",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    XLSX.writeFile(workbook, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Inventario", 14, 16);
    const tableData = filteredItems.map((item) => [
      item.barcode,
      item.name,
      item.stock,
      item.minStock,
      item.lowStock ? "Stock bajo" : "OK",
    ]);
    autoTable(doc, {
      head: [["Código", "Producto", "Stock", "Stock mínimo", "Estado"]],
      body: tableData,
      startY: 20,
    });
    doc.save(`inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) return <div className="p-8">Cargando inventario...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold">Inventario</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedBarcode("");
                setShowModal(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-medium"
            >
              Ajustar stock (otro código)
            </button>
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

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 p-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {adjustMessage && (
          <div
            className={`mb-4 p-3 rounded ${
              adjustMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {adjustMessage.text}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border text-sm">
            <thead>
              <tr>
                <th className="border p-2">Código</th>
                <th className="border p-2">Producto</th>
                <th className="border p-2">Stock</th>
                <th className="border p-2">Stock mínimo</th>
                <th className="border p-2">Estado</th>
                <th className="border p-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border p-2 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.productId} className={item.lowStock ? "bg-red-100" : ""}>
                    <td className="border p-2 break-all">{item.barcode}</td>
                    <td className="border p-2">{item.name}</td>
                    <td className="border p-2">{item.stock}</td>
                    <td className="border p-2">{item.minStock}</td>
                    <td className="border p-2">
                      {item.lowStock ? (
                        <span className="text-red-600 font-bold">⚠️ Stock bajo</span>
                      ) : (
                        "OK"
                      )}
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => {
                          setSelectedBarcode(item.barcode);
                          setShowModal(true);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors font-medium"
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-55 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="flex justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800">Ajustar stock</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-800 font-medium">Código de barras</label>
                <input
                  type="text"
                  value={selectedBarcode}
                  onChange={(e) => setSelectedBarcode(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingrese código manualmente si lo desea"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-800 font-medium">
                  Cantidad (positiva = entrada, negativa = salida)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={delta}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || val === "-" || /^-?\d*$/.test(val)) {
                      setDelta(val === "" ? 0 : parseInt(val, 10));
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 5 (entrada) o -3 (salida)"
                />
              </div>
              <button
                onClick={handleAdjustStock}
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors font-medium"
              >
                Aplicar ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}