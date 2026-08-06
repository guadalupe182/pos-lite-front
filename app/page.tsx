'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useCash } from '@/contexts/CashContext';
import Navbar from '@/components/Navbar';
import OpenCashModal from '@/components/OpenCashModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function HomePage() {
  const router = useRouter();
  const { isOpen, loading: cashLoading, refresh: refreshCashStatus } = useCash();

  const [products, setProducts] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMandatoryModal, setShowMandatoryModal] = useState(false);

  // Validación de caja abierta/cerrada
  useEffect(() => {
    if (!cashLoading && !isOpen) {
      setShowMandatoryModal(true);
    } else {
      setShowMandatoryModal(false);
    }
  }, [isOpen, cashLoading]);

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await apiFetch('/api/products');
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(Array.isArray(productsData) ? productsData : []);
        }

        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const from = sevenDaysAgo.toISOString().split('T')[0] + 'T00:00:00Z';
        const to = today.toISOString().split('T')[0] + 'T23:59:59Z';
        const salesRes = await apiFetch(`/api/sales/report?from=${from}&to=${to}`);
        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setRecentSales(Array.isArray(salesData) ? salesData : []);
        }

        const meRes = await apiFetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData?.email) {
            setUserName(meData.email.split('@')[0]);
          }
        }
      } catch (error) {
        console.error('Error cargando dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock < p.minStock).length;
  const totalSalesLast7Days = recentSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const averageDailySale = recentSales.length > 0 ? totalSalesLast7Days / 7 : 0;

  const salesByDay: { [key: string]: number } = {};
  recentSales.forEach((sale) => {
    const date = new Date(sale.saleDate).toLocaleDateString('es-MX');
    salesByDay[date] = (salesByDay[date] || 0) + (sale.total || 0);
  });

  const chartData = {
    labels: Object.keys(salesByDay),
    datasets: [
      {
        label: 'Ventas (MXN)',
        data: Object.values(salesByDay),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Ventas de los últimos 7 días' },
    },
  };

  if (loading || cashLoading) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="text-slate-400 font-semibold text-sm animate-pulse">
              Cargando dashboard...
            </div>
          </div>
        </div>
    );
  }

  return (
      <>
        <Navbar />
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Bienvenido{userName ? `, ${userName}` : ''} 👋
            </h1>
            <p className="text-gray-600 mt-1">Aquí tienes un resumen de tu negocio</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Tarjeta Total Productos */}
            <div
                onClick={() => router.push('/products')}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total productos</p>
                  <p className="text-2xl font-bold text-gray-800">{totalProducts}</p>
                </div>
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>

            {/* Tarjeta Ventas */}
            <div
                onClick={() => router.push('/history')}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Ventas (últimos 7 días)</p>
                  <p className="text-2xl font-bold text-gray-800">${totalSalesLast7Days.toFixed(2)}</p>
                </div>
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Tarjeta Promedio Diario */}
            <div
                onClick={() => router.push('/history')}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Promedio diario</p>
                  <p className="text-2xl font-bold text-gray-800">${averageDailySale.toFixed(2)}</p>
                </div>
                <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>

            {/* Tarjeta Stock Bajo */}
            <div
                onClick={() => router.push('/products')}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Productos stock bajo</p>
                  <p className="text-2xl font-bold text-gray-800">{lowStockProducts}</p>
                </div>
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Gráfica */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Ventas recientes</h2>
            {recentSales.length > 0 ? (
                <div className="h-80">
                  <Bar data={chartData} options={chartOptions} />
                </div>
            ) : (
                <p className="text-gray-500 text-center py-8">No hay ventas registradas en los últimos 7 días</p>
            )}
          </div>

          {/* Tabla de productos con stock bajo */}
          {lowStockProducts > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-red-600">⚠️ Alertas de inventario</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-700">Producto</th>
                      <th className="text-left py-2 text-gray-700">Stock actual</th>
                      <th className="text-left py-2 text-gray-700">Stock mínimo</th>
                    </tr>
                    </thead>
                    <tbody>
                    {products
                        .filter((p) => p.stock < p.minStock)
                        .slice(0, 5)
                        .map((product) => (
                            <tr key={product.id} className="border-b">
                              <td className="py-2 text-gray-800">{product.name}</td>
                              <td className="py-2 text-red-600 font-semibold">{product.stock}</td>
                              <td className="py-2 text-gray-800">{product.minStock}</td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
                  {lowStockProducts > 5 && (
                      <p className="text-sm text-gray-500 mt-2">
                        ... y {lowStockProducts - 5} productos más
                      </p>
                  )}
                </div>
              </div>
          )}
        </div>

        {/* Modal obligatorio para abrir caja */}
        {showMandatoryModal && (
            <OpenCashModal
                isOpen={showMandatoryModal}
                onClose={() => setShowMandatoryModal(false)}
                onSuccess={() => {
                  setShowMandatoryModal(false);
                  if (refreshCashStatus) refreshCashStatus();
                }}
            />
        )}
      </>
  );
}