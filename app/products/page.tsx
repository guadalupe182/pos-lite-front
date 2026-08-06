'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import Navbar from "@/components/Navbar";

type Product = {
  id: number;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  minStock: number;
  categoryId: number;
  categoryName: string;
};

type Category = {
  id: number;
  name: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    price: 0,
    stock: 0,
    minStock: 0,
    categoryId: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiFetch("/api/products"),
        apiFetch("/api/categories"),
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch {
      setError("Error al cargar el catálogo de productos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    if (!searchTerm.trim()) return products;

    const term = searchTerm.toLowerCase().trim();
    return products.filter(
        (product) =>
            product?.name?.toLowerCase().includes(term) ||
            product?.barcode?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      barcode: "",
      price: 0,
      stock: 0,
      minStock: 0,
      categoryId: categories[0]?.id || 0,
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock,
      categoryId: product.categoryId,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (
        !formData.name ||
        !formData.barcode ||
        formData.price <= 0 ||
        formData.categoryId === 0
    ) {
      alert("Por favor completa los campos obligatorios: Nombre, Código, Precio y Categoría.");
      return;
    }

    const payload = {
      name: formData.name,
      barcode: formData.barcode,
      price: formData.price,
      stock: formData.stock,
      minStock: formData.minStock,
      categoryId: formData.categoryId,
    };

    try {
      if (editingProduct) {
        await apiFetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchData();
    } catch {
      alert("Error al guardar el producto en el servidor.");
    }
  };

  const handleDelete = async (id: number, productName: string) => {
    const confirmMsg = `¿Eliminar permanentemente "${productName}" del catálogo?\n\nEsta acción no se puede deshacer.`;
    if (!confirm(confirmMsg)) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      alert("Error al intentar eliminar el producto.");
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="text-slate-500 font-medium text-sm animate-pulse">Cargando catálogo de productos...</div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

          {/* Encabezado GDEV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 uppercase tracking-wide mb-1">
                🏷️ Catálogo de Productos
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Administración de Productos</h1>
            </div>

            <button
                onClick={openCreateModal}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20 cursor-pointer self-start sm:self-auto"
            >
              + Registrar Nuevo Producto
            </button>
          </div>

          {/* Buscador */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
          </div>

          {error && (
              <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-medium">
                {error}
              </div>
          )}

          {/* Tabla de Productos */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="p-4">Código</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4 text-right">Precio</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-center">Mínimo</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                        No se encontraron productos registrados.
                      </td>
                    </tr>
                ) : (
                    filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono text-xs font-semibold text-slate-600">{p.barcode}</td>
                          <td className="p-4 font-semibold text-slate-900">{p.name}</td>
                          <td className="p-4 text-right font-bold text-slate-900">${p.price.toFixed(2)}</td>
                          <td className="p-4 text-center font-bold text-slate-800">{p.stock}</td>
                          <td className="p-4 text-center text-slate-500">{p.minStock}</td>
                          <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {p.categoryName || 'Sin categoría'}
                        </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap space-x-2">
                            <button
                                onClick={() => openEditModal(p)}
                                className="bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                                onClick={() => handleDelete(p.id, p.name)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Eliminar
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

        {/* Modal de Crear / Editar Producto */}
        {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">
                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold">
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        placeholder="Ej. Refresco 600ml"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Código de Barras *
                    </label>
                    <input
                        type="text"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                        placeholder="Ej. 7501000000000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Precio ($) *
                      </label>
                      <input
                          type="text"
                          inputMode="decimal"
                          value={formData.price}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                              setFormData({
                                ...formData,
                                price: val === "" ? 0 : parseFloat(val),
                              });
                            }
                          }}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Categoría *
                      </label>
                      <select
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                      >
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Stock Inicial
                      </label>
                      <input
                          type="text"
                          inputMode="numeric"
                          value={formData.stock}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d*$/.test(val)) {
                              setFormData({
                                ...formData,
                                stock: val === "" ? 0 : parseInt(val, 10),
                              });
                            }
                          }}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Stock Mínimo
                      </label>
                      <input
                          type="text"
                          inputMode="numeric"
                          value={formData.minStock}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d*$/.test(val)) {
                              setFormData({
                                ...formData,
                                minStock: val === "" ? 0 : parseInt(val, 10),
                              });
                            }
                          }}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          placeholder="0"
                      />
                    </div>
                  </div>

                  <button
                      onClick={handleSave}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold p-3 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-sky-600/20 mt-2"
                  >
                    Guardar Producto
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}