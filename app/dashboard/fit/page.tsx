'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';

type Membership = {
  id: number;
  clientName: string;
  planType: string;
  startDate: string;
  endDate: string;
  status: string;
};

type MembershipForm = Omit<Membership, 'id'>;

type ToastState = {
  message: string;
  type: 'success' | 'error';
};

const EMPTY_FORM: MembershipForm = {
  clientName: '',
  planType: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
};

const PAGE_SIZE = 8;

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function FitPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [form, setForm] = useState<MembershipForm>(EMPTY_FORM);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [membershipToDelete, setMembershipToDelete] = useState<Membership | null>(null);

  const closeToast = useCallback(() => setToast(null), []);

  const loadMemberships = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/v1/memberships');
      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('El servidor devolvió una lista de membresías inválida.');
      }
      setMemberships(data as Membership[]);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudieron cargar las membresías.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMemberships();
  }, [loadMemberships]);

  const filteredMemberships = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return memberships;
    return memberships.filter((membership) =>
      membership.clientName.toLowerCase().includes(term)
    );
  }, [memberships, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredMemberships.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedMemberships = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMemberships.slice(start, start + PAGE_SIZE);
  }, [filteredMemberships, currentPage]);

  const openCreateModal = () => {
    setEditingMembership(null);
    setForm({
      ...EMPTY_FORM,
      startDate: new Date().toISOString().slice(0, 10),
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (membership: Membership) => {
    setEditingMembership(membership);
    setForm({
      clientName: membership.clientName,
      planType: membership.planType,
      startDate: membership.startDate,
      endDate: membership.endDate,
      status: membership.status,
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

    const clientName = form.clientName.trim();
    const planType = form.planType.trim();

    if (!clientName || !planType || !form.startDate || !form.endDate) {
      setError('Completa todos los campos obligatorios.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('La fecha de vencimiento debe ser posterior o igual a la fecha de inicio.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = { ...form, clientName, planType };
      await apiFetch(
        editingMembership ? `/api/v1/memberships/${editingMembership.id}` : '/api/v1/memberships',
        {
          method: editingMembership ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );
      setShowModal(false);
      await loadMemberships();
      setToast({
        message: editingMembership
          ? 'Membresía actualizada correctamente.'
          : 'Membresía creada correctamente.',
        type: 'success',
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo guardar la membresía.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!membershipToDelete) return;

    setDeletingId(membershipToDelete.id);
    setError('');

    try {
      await apiFetch(`/api/v1/memberships/${membershipToDelete.id}`, { method: 'DELETE' });
      setMembershipToDelete(null);
      await loadMemberships();
      setToast({ message: 'Membresía eliminada correctamente.', type: 'success' });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo eliminar la membresía.'));
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
              POS Fit
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Gestión de membresías</h1>
            <p className="mt-1 text-sm text-slate-500">Administra los planes y la vigencia de tus clientes.</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="self-start rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition-all hover:bg-sky-500 sm:self-auto"
          >
            + Nueva membresía
          </button>
        </div>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="fitSearch" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Buscar por cliente
            </label>
            <input
              id="fitSearch"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Nombre del cliente..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 sm:max-w-sm"
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {filteredMemberships.length} membresía{filteredMemberships.length === 1 ? '' : 's'} encontrada
            {filteredMemberships.length === 1 ? '' : 's'}
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
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Inicio</th>
                  <th className="p-4">Vencimiento</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                      Cargando membresías...
                    </td>
                  </tr>
                ) : pagedMemberships.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-400">
                      No hay membresías que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  pagedMemberships.map((membership) => (
                    <tr key={membership.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-slate-900">{membership.clientName}</td>
                      <td className="p-4">{membership.planType}</td>
                      <td className="p-4 whitespace-nowrap">{formatDate(membership.startDate)}</td>
                      <td className="p-4 whitespace-nowrap">{formatDate(membership.endDate)}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {STATUS_LABELS[membership.status] || membership.status}
                        </span>
                      </td>
                      <td className="space-x-2 whitespace-nowrap p-4 text-center">
                        <button
                          type="button"
                          onClick={() => openEditModal(membership)}
                          className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setMembershipToDelete(membership)}
                          disabled={deletingId === membership.id}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === membership.id ? 'Eliminando...' : 'Eliminar'}
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
              Página {currentPage} de {totalPages} · {filteredMemberships.length} registro
              {filteredMemberships.length === 1 ? '' : 's'}
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
          <div role="dialog" aria-modal="true" aria-labelledby="membership-modal-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 id="membership-modal-title" className="text-base font-bold text-slate-900">
                {editingMembership ? 'Editar membresía' : 'Nueva membresía'}
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
                <label htmlFor="clientName" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Nombre del cliente *
                </label>
                <input
                  id="clientName"
                  type="text"
                  value={form.clientName}
                  onChange={(event) => setForm({ ...form, clientName: event.target.value })}
                  disabled={saving}
                  required
                  maxLength={150}
                  placeholder="Ej. Ana García"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="planType" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tipo de plan *
                </label>
                <input
                  id="planType"
                  type="text"
                  value={form.planType}
                  onChange={(event) => setForm({ ...form, planType: event.target.value })}
                  disabled={saving}
                  required
                  maxLength={100}
                  placeholder="Ej. Mensual"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Fecha de inicio *
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                    disabled={saving}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Vencimiento *
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                    disabled={saving}
                    required
                    min={form.startDate || undefined}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="membershipStatus" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Estado *
                </label>
                <select
                  id="membershipStatus"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                  disabled={saving}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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
                  {saving ? 'Guardando...' : editingMembership ? 'Guardar cambios' : 'Crear membresía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={membershipToDelete !== null}
        title="Eliminar membresía"
        description={
          membershipToDelete
            ? `¿Eliminar la membresía de "${membershipToDelete.clientName}"? Esta acción no se puede deshacer.`
            : ''
        }
        loading={deletingId !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setMembershipToDelete(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
}
