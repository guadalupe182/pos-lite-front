'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getNotifications, 
  markNotificationAsRead, 
  deleteNotification,
  Notification 
} from '@/lib/api';
import Navbar from '@/components/Navbar';
import { CheckCircleIcon, TrashIcon, BellIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar notificaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      setProcessingId(id);
      await markNotificationAsRead(id);
      // Actualizar localmente
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error al marcar como leída:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta notificación?')) return;
    try {
      setProcessingId(id);
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error al eliminar:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      STOCK_LOW: '⚠️ Stock bajo',
      CASH_LOW: '💰 Efectivo bajo',
    };
    return labels[type] || type;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BellIcon className="h-8 w-8 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount} no leídas
              </span>
            )}
          </div>
          <button
            onClick={fetchNotifications}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            {loading ? 'Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading && notifications.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando notificaciones...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No hay notificaciones</h3>
            <p className="text-gray-400 text-sm mt-1">Todo está en orden por ahora.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white border rounded-lg p-4 shadow-sm transition-all ${
                  notification.read
                    ? 'border-gray-200 opacity-75'
                    : 'border-l-4 border-l-blue-500 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {getTypeLabel(notification.type)}
                      </span>
                      {!notification.read && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={processingId === notification.id}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Marcar como leída"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      disabled={processingId === notification.id}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}