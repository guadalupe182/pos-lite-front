'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
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
import { PackageIcon, TrendingUpIcon, AlertTriangleIcon, DollarSignIcon } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Product = {
  id: number;
  name: string;
  stock: number;
  minStock: number;
};

type Sale = {
  id: number;
  saleDate: string;
  total: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await apiFetch('/api/products');
        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);

        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const from = sevenDaysAgo.toISOString().split('T')[0] + 'T00:00:00Z';
        const to = today.toISOString().split('T')[0] + 'T23:59:59Z';
        const salesRes = await apiFetch(`/api/sales/report?from=${from}&to=${to}`);
        const salesData = await salesRes.json();
        setRecentSales(Array.isArray(salesData) ? salesData : []);

        const meRes = await apiFetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData?.email) {
          setUserName(meData.email.split('@')[0]);
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
  const lowStockProducts = products.filter(p => p.stock < p.minStock).length;
  const totalSalesLast7Days = recentSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageDailySale = recentSales.length > 0 ? totalSalesLast7Days / 7 : 0;

  const salesByDay: { [key: string]: number } = {};
  recentSales.forEach((sale) => {
    const date = new Date(sale.saleDate).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
    salesByDay[date] = (salesByDay[date] || 0) + sale.total;
  });

  const chartData = {
    labels: Object.keys(salesByDay),
    datasets: [
      {
        label: 'Ventas (MXN)',
        data: Object.values(salesByDay),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
    },
  };

  if (loading) {
    return (
        <>
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500 font-medium animate-pulse">Cargando dashboard...</div>
          </div>
        </>
    );
  }

  return (
      <>
        <Navbar />
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Bienvenido, {userName || 'Usuario'} 👋</h1>
            <p className="text-gray-600 mt-1">Resumen general de tu negocio en Gdev POS Lite</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Tarjeta Total Productos */}
            <div
                onClick={() => router.push('/products')}
                className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total productos</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{totalProducts}</p>
                </div>
                <PackageIcon className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {/* Tarjeta Ventas */}
            <div
                onClick={() => router.push('/sales-report')}
                className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Ventas (últimos 7 días)</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">${totalSalesLast7Days.toFixed(2)}</p>
                </div>
                <DollarSignIcon className="h-8 w-8 text-emerald-500" />
              </div>
            </div>

            {/* Tarjeta Promedio Diario */}
            <div
                onClick={() => router.push('/sales-report')}
                className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Promedio diario</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">${averageDailySale.toFixed(2)}</p>
                </div>
                <TrendingUpIcon className="h-8 w-8 text-amber-500" />
              </div>
            </div>

            {/* Tarjeta Stock Bajo */}
            <div
                onClick={() => router.push('/inventory')}
                className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Stock bajo</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{lowStockProducts}</p>
                </div>
                <AlertTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Gráfica */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Ventas de los últimos 7 días</h2>
            {recentSales.length > 0 ? (
                <div className="h-72 w-full">
                  <Bar data={chartData} options={chartOptions} />
                </div>
            ) : (
                <p className="text-gray-500 text-center py-12 text-sm">No hay ventas registradas en los últimos 7 días</p>
            )}
          </div>

          {/* Tabla de productos con stock bajo */}
          {lowStockProducts > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-red-100">
                <h2 className="text-lg font-semibold mb-4 text-red-600 flex items-center gap-2">
                  <AlertTriangleIcon className="h-5 w-5" /> Alertas de inventario
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Stock actual</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Stock mínimo</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                    {products
                        .filter(p => p.stock < p.minStock)
                        .slice(0, 5)
                        .map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-sm font-medium text-gray-900">{product.name}</td>
                              <td className="py-3 px-4 text-sm text-red-600 font-bold">{product.stock}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">{product.minStock}</td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
                  {lowStockProducts > 5 && (
                      <p className="text-xs text-gray-500 mt-3 text-right">... y {lowStockProducts - 5} productos más con stock bajo</p>
                  )}
                </div>
              </div>
          )}
        </div>
      </>
  );
}