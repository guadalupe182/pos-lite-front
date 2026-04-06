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
        setProducts(productsData);

        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const from = sevenDaysAgo.toISOString().split('T')[0] + 'T00:00:00Z';
        const to = today.toISOString().split('T')[0] + 'T23:59:59Z';
        const salesRes = await apiFetch(`/api/sales/report?from=${from}&to=${to}`);
        const salesData = await salesRes.json();
        setRecentSales(salesData);

        const meRes = await apiFetch('/api/auth/me');
        const meData = await meRes.json();
        // Extraer nombre antes del @ o usar el email completo
        setUserName(meData.email.split('@')[0]);
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
    const date = new Date(sale.saleDate).toLocaleDateString('es-MX');
    salesByDay[date] = (salesByDay[date] || 0) + sale.total;
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
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Ventas de los últimos 7 días' },
    },
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando dashboard...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Bienvenido, {userName} 👋</h1>
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
              <PackageIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Tarjeta Ventas */}
          <div
            onClick={() => router.push('/sales-report')}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Ventas (últimos 7 días)</p>
                <p className="text-2xl font-bold text-gray-800">${totalSalesLast7Days.toFixed(2)}</p>
              </div>
              <DollarSignIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          {/* Tarjeta Promedio Diario */}
          <div
            onClick={() => router.push('/sales-report')}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Promedio diario</p>
                <p className="text-2xl font-bold text-gray-800">${averageDailySale.toFixed(2)}</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          {/* Tarjeta Stock Bajo */}
          <div
            onClick={() => router.push('/inventory')}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Productos con stock bajo</p>
                <p className="text-2xl font-bold text-gray-800">{lowStockProducts}</p>
              </div>
              <AlertTriangleIcon className="h-8 w-8 text-red-500" />
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
            <p className="text-gray-500 text-center py-8">No hay ventas en los últimos 7 días</p>
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
                    .filter(p => p.stock < p.minStock)
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
                <p className="text-sm text-gray-500 mt-2">... y {lowStockProducts - 5} productos más</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}