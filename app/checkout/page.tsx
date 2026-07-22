'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import CheckoutButton from '@/components/CheckoutButton';

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

export default function CheckoutPage() {
  //FORMA CORRECTA Y LIMPIA (Cero warnings de ESLint)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // Usamos requestAnimationFrame o diferimos el estado para no bloquear el ciclo inicial de React
    const timer = setTimeout(() => {
      setCartItems(cart);
      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  if (loading) return <div className="p-8 text-center text-gray-800">Cargando carrito...</div>;

  return (
      <>
        <Navbar />
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Finalizar Compra</h1>

          {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Carrito vacío</h3>
                <p className="mt-1 text-sm text-gray-500">No hay productos en el carrito.</p>
                <div className="mt-6">
                  <a href="/sales" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Ir a vender
                  </a>
                </div>
              </div>
          ) : (
              <>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio unitario
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {cartItems.map((item) => (
                          <tr key={item.productId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${item.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Resumen de totales */}
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Subtotal:</span>
                      <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="font-medium text-gray-700">IVA (16%):</span>
                      <span className="text-gray-900">${iva.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-200">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* 💳 Banner de datos de prueba para Mercado Pago (Sandbox Demo) */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 text-left shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  💡 Tarjeta de Prueba Mercado Pago (Sandbox)
                </span>
                    <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded">
                  Entorno Demo
                </span>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">
                    Usa estos datos ficticios para simular un cobro aprobado sin cargos reales:
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono bg-white p-3 rounded-lg border border-blue-100 text-gray-800">
                    <div>
                      <span className="block text-[10px] text-gray-500 font-sans font-semibold">Número</span>
                      <span className="font-bold">2345 6789 0123 4567</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-sans font-semibold">Vencimiento</span>
                      <span className="font-bold">12/28</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-sans font-semibold">CVC / CVV</span>
                      <span className="font-bold">123</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-sans font-semibold">Titular</span>
                      <span className="font-bold">APRO</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
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
        </div>
      </>
  );
}