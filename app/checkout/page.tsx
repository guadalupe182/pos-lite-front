'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CheckoutButton from '@/components/CheckoutButton';

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const timer = setTimeout(() => {
      setCartItems(cart);
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="text-slate-500 font-medium text-sm animate-pulse">Cargando resumen de compra...</div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <main className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

          {/* Encabezado GDEV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 uppercase tracking-wide mb-1">
                💳 Checkout Seguro
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Finalizar Orden de Compra</h1>
            </div>
            <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-mono">
              Ecosistema: <span className="text-sky-600 font-bold">GDEV Cloud</span>
            </div>
          </div>

          {cartItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900">Carrito de compra vacío</h3>
                <p className="mt-1 text-xs text-slate-500">No hay productos seleccionados para procesar cobro.</p>
                <div className="mt-6">
                  <Link
                      href="/sales"
                      className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-all shadow-md shadow-sky-600/20"
                  >
                    ← Ir a la Terminal de Venta
                  </Link>
                </div>
              </div>
          ) : (
              <>
                {/* Tabla del Resumen de la Orden */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th scope="col" className="p-4">Producto</th>
                        <th scope="col" className="p-4 text-center">Cantidad</th>
                        <th scope="col" className="p-4 text-right">Precio Unitario</th>
                        <th scope="col" className="p-4 text-right">Subtotal</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                      {cartItems.map((item) => (
                          <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-semibold text-slate-900">{item.name}</td>
                            <td className="p-4 text-center font-bold text-slate-800">{item.quantity}</td>
                            <td className="p-4 text-right text-slate-600">${item.price.toFixed(2)}</td>
                            <td className="p-4 text-right font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Resumen de totales e impuestos */}
                  <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/60 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-mono">${subtotal.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span className="font-semibold">IVA (16%):</span>
                      <span className="font-mono">${iva.toFixed(2)} MXN</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                      <span>Total a Pagar:</span>
                      <span className="text-sky-600">${total.toFixed(2)} MXN</span>
                    </div>
                  </div>
                </div>

                {/* 💳 Banner de datos de prueba para Mercado Pago (Sandbox Demo) */}
                <div className="bg-white border border-sky-200/80 rounded-2xl p-5 shadow-2xs text-left">
                  <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                  💡 Credenciales Demo - Mercado Pago Sandbox
                </span>
                    <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2.5 py-0.5 rounded-full border border-sky-200">
                  Entorno de Pruebas
                </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">
                    Utiliza estos datos simulados en la pasarela para aprobar el pago sin saldo real:
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-slate-800">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-sans font-semibold uppercase">Número Tarjeta</span>
                      <span className="font-bold text-sky-700 select-all cursor-pointer">5474925432670366</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-sans font-semibold uppercase">Vencimiento</span>
                      <span className="font-bold text-slate-900">11/30</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-sans font-semibold uppercase">CVC / CVV</span>
                      <span className="font-bold text-slate-900">123</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-sans font-semibold uppercase">Titular</span>
                      <span className="font-bold text-slate-900">APRO</span>
                    </div>
                  </div>
                </div>

                {/* Selector de métodos de pago y Botón Final */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
                  <CheckoutButton
                      items={cartItems}
                      onSuccess={() => {
                        localStorage.removeItem('cart');
                        setCartItems([]);
                      }}
                  />
                </div>
              </>
          )}
        </main>
      </div>
  );
}