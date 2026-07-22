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
    void fetchData();
  }, []);

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < p.minStock).length;
  const totalSalesLast7Days = recentSales.reduce((sum, sale) => sum + sale.total, 0);
  const averageDailySale = totalSalesLast7Days / 7;

  // Generar mapa con los últimos 7 días completos (incluyendo días en $0)
  const salesByDayMap: { [key: string]: number } = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateLabel = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    salesByDayMap[dateLabel] = 0;
  }

  // Llenar ventas en sus respectivos días
  recentSales.forEach((sale) => {
    const dateLabel = new Date(sale.saleDate).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
    if (salesByDayMap[dateLabel] !== undefined) {
      salesByDayMap[dateLabel] += sale.total;
    }
  });

  const chartData = {
    labels: Object.keys(salesByDayMap),
    datasets: [
      {
        label: 'Ventas ($ MXN)',
        data: Object.values(salesByDayMap),
        backgroundColor: '#0284c7', // Azul GDEV (Sky 600)
        hoverBackgroundColor: '#0369a1',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#090d16',
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: { raw: unknown }) => `Venta: $${Number(context.raw).toFixed(2)} MXN`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          color: '#64748b',
          callback: (value: unknown) => `$${value}`,
        },
      },
    },
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="text-slate-400 font-semibold text-sm animate-pulse">Cargando dashboard...</div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

          {/* Header Branding */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 uppercase tracking-wide mb-1">
                📊 Panel Principal
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bienvenido, {userName || 'Usuario'} 👋</h1>
            </div>
            <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-mono">
              Ecosistema: <span className="text-sky-600 font-bold">GDEV Cloud SaaS</span>
            </div>
          </div>

          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Productos */}
            <div
                onClick={() => router.push('/products')}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Productos</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{totalProducts}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <PackageIcon className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Ventas Últimos 7 Días */}
            <div
                onClick={() => router.push('/sales-report')}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas (7 días)</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">${totalSalesLast7Days.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <DollarSignIcon className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Promedio Diario */}
            <div
                onClick={() => router.push('/sales-report')}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Promedio Diario</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">${averageDailySale.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUpIcon className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Stock Bajo */}
            <div
                onClick={() => router.push('/inventory')}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Bajo</p>
                  <p className={`text-2xl font-black mt-1 ${lowStockProducts > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{lowStockProducts}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${lowStockProducts > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                  <AlertTriangleIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráfica Ajustada */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Comportamiento Semanal de Ventas</h2>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              Últimos 7 días
            </span>
            </div>
            <div className="h-72 w-full">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Tabla Alertas Stock Bajo */}
          {lowStockProducts > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-rose-200/80 shadow-2xs">
                <h2 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4" /> Productos que requieren reabastecimiento
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-rose-50/50 border-b border-rose-100 text-[11px] font-bold uppercase text-rose-800 tracking-wider">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Stock actual</th>
                      <th className="p-3">Stock mínimo</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {products
                        .filter(p => p.stock < p.minStock)
                        .slice(0, 5)
                        .map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-semibold text-slate-900">{product.name}</td>
                              <td className="p-3 text-rose-600 font-bold">{product.stock}</td>
                              <td className="p-3 text-slate-500">{product.minStock}</td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
                  {lowStockProducts > 5 && (
                      <p className="text-xs text-slate-400 mt-3 text-right">... y {lowStockProducts - 5} productos más</p>
                  )}
                </div>
              </div>
          )}
        </main>
      </div>
  );
}