'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';

type BoutiqueItem = {
  id: number;
  name: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
};

type BoutiqueItemForm = {
  name: string;
  size: string;
  color: string;
  price: string;
  stock: string;
};

type ToastState = {
  message: string;
  type: 'success' | 'error';
};

const EMPTY_FORM: BoutiqueItemForm = {
  name: '',
  size: '',
  color: '',
  price: '',
  stock: '0',
};

const PAGE_SIZE = 8;

function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(Number(value) || 0);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function StylePage() {
  const [items, setItems] = useState<BoutiqueItem[]>([]);
  const [form, setForm] = useState<BoutiqueItemForm>(EMPTY_FORM);
  const [editingItem, setEditingItem] = useState<BoutiqueItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BoutiqueItem | null>(null);

  const closeToast = useCallback(() => setToast(null), []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/v1/boutique-items');
      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('El servidor devolvió una lista de artículos inválida.');
      }
      setItems(data as BoutiqueItem[]);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudieron cargar los artículos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => item.name.toLowerCase().includes(term));
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (item: BoutiqueItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      size: item.size || '',
      color: item.color || '',
      price: String(item.price),
      stock: String(item.stock),
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (!saving) setShowModal(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name || !form.price || !form.stock) {
      setError('Completa el nombre, el precio y el stock.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Ingresa un precio mayor que cero.');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError('El stock debe ser un número entero mayor o igual a cero.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name,
        size: form.size.trim(),
        color: form.color.trim(),
        price,
        stock,
      };
      await apiFetch(
        editingItem ? `/api/boutique-items/${editingItem.id}` : '/api/boutique-items',
        {
          method: editingItem ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );
      setShowModal(false);
      await loadItems();
      setToast({
        message: editingItem
          ? 'Artículo actualizado correctamente.'
          : 'Artículo creado correctamente.',
        type: 'success',
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo guardar el artículo.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.id);
    setError('');

    try {
      await apiFetch(`/api/v1/boutique-items/${itemToDelete.id}`, { method: 'DELETE' });
      setItemToDelete(null);
      await loadItems();
      setToast({ message: 'Artículo eliminado correctamente.', type: 'success' });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo eliminar el artículo.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
              POS Style
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Inventario de boutique</h1>
            <p className="mt-1 text-sm text-slate-500">Administra prendas, tallas, colores, precios y existencias.</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="self-start rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition-all hover:bg-sky-500 sm:self-auto"
          >
            + Nuevo artículo
          </button>
        </div>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="styleSearch" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Buscar por artículo
            </label>
            <input
              id="styleSearch"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Nombre del artículo..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 sm:max-w-sm"
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {filteredItems.length} artículo{filteredItems.length === 1 ? '' : 's'} encontrado
            {filteredItems.length === 1 ? '' : 's'}
          </p>
        </section>

        {error && !showModal && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-4">Artículo</th>
                  <th className="p-4">Talla</th>
                  <th className="p-4">Color</th>
                  <th className="p-4 text-right">Precio</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                      Cargando artículos...
                    </td>
                  </tr>
                ) : pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                      No hay artículos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-4">{item.size || '—'}</td>
                      <td className="p-4">{item.color || '—'}</td>
                      <td className="p-4 text-right font-bold text-slate-900">{formatPrice(item.price)}</td>
                      <td className="p-4 text-center font-bold text-slate-800">{item.stock}</td>
                      <td className="space-x-2 whitespace-nowrap p-4 text-center">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          disabled={deletingId === item.id}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === item.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 p-4 sm:flex-row">
            <p className="text-xs text-slate-500">
              Página {currentPage} de {totalPages} · {filteredItems.length} registro
              {filteredItems.length === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="item-modal-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 id="item-modal-title" className="text-base font-bold text-slate-900">
                {editingItem ? 'Editar artículo' : 'Nuevo artículo'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Cerrar"
                className="text-lg font-bold text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="itemName" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nombre del artículo *
                </label>
                <input
                  id="itemName"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  disabled={saving}
                  required
                  maxLength={150}
                  placeholder="Ej. Camisa Oxford"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="itemSize" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Talla
                  </label>
                  <input
                    id="itemSize"
                    type="text"
                    value={form.size}
                    onChange={(event) => setForm({ ...form, size: event.target.value })}
                    disabled={saving}
                    maxLength={30}
                    placeholder="Ej. M"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="itemColor" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Color
                  </label>
                  <input
                    id="itemColor"
                    type="text"
                    value={form.color}
                    onChange={(event) => setForm({ ...form, color: event.target.value })}
                    disabled={saving}
                    maxLength={50}
                    placeholder="Ej. Azul"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="itemPrice" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Precio (MXN) *
                  </label>
                  <input
                    id="itemPrice"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    disabled={saving}
                    required
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="itemStock" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Stock *
                  </label>
                  <input
                    id="itemStock"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) => setForm({ ...form, stock: event.target.value })}
                    disabled={saving}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-sky-600 p-3 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-sky-600/20 transition-all hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {saving ? 'Guardando...' : editingItem ? 'Guardar cambios' : 'Crear artículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={itemToDelete !== null}
        title="Eliminar artículo"
        description={
          itemToDelete
            ? `¿Eliminar "${itemToDelete.name}" del inventario de boutique? Esta acción no se puede deshacer.`
            : ''
        }
        loading={deletingId !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setItemToDelete(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
}
