'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';

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
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: 0,
    stock: 0,
    minStock: 0,
    categoryId: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiFetch('/api/products'),
        apiFetch('/api/categories'),
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      setProducts(productsData);
      setCategories(categoriesData);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: '',
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
    if (!formData.name || !formData.barcode || formData.price <= 0 || formData.categoryId === 0) {
      alert('Complete los campos obligatorios (nombre, código, precio, categoría)');
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
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchData();
    } catch {
      alert('Error al guardar producto');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar producto permanentemente?')) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchData();
    } catch {
      alert('Error al eliminar producto');
    }
  };

  if (loading) return <div className="p-8">Cargando productos...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Productos</h1>
          <button
            onClick={openCreateModal}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            + Nuevo producto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border text-sm">
            <thead>
              <tr>
                <th className="border p-2">Código</th>
                <th className="border p-2">Nombre</th>
                <th className="border p-2">Precio</th>
                <th className="border p-2">Stock</th>
                <th className="border p-2">Stock min</th>
                <th className="border p-2">Categoría</th>
                <th className="border p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="border p-2 break-all">{p.barcode}</td>
                  <td className="border p-2">{p.name}</td>
                  <td className="border p-2">${p.price.toFixed(2)}</td>
                  <td className="border p-2">{p.stock}</td>
                  <td className="border p-2">{p.minStock}</td>
                  <td className="border p-2">{p.categoryName}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm mr-1 hover:bg-blue-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="flex justify-between mb-2">
              <h2 className="text-lg font-bold">{editingProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Código de barras *</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Stock mínimo</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">Categoría *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}