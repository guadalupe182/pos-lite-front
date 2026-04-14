'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import CheckoutButton from '@/components/CheckoutButton';

export default function CheckoutPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/login?returnUrl=/checkout');
        }
      } catch (err) {
        console.error('Error checking auth', err);
        router.push('/login?returnUrl=/checkout');
      }
    };
    checkAuth();
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Verificando autenticación...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar Compra</h1>
          <div className="border-t border-gray-200 pt-4">
            <CheckoutButton amount={100.00} description="Producto prueba" quantity={1} />
          </div>
        </div>
      </div>
    </div>
  );
}