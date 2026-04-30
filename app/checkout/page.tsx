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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartItems(cart);
    //eslint-disabled-next-line react-hoks/set-state-in-effect
    setLoading(false);
  }, []);

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <>
      <Navbar />
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>
        
        {cartItems.length === 0 ? (
          <p className="text-gray-500">No hay productos en el carrito</p>
        ) : (
          <>
            <div className="mb-6 bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">${total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <CheckoutButton 
              items={cartItems} 
              onSuccess={() => {
                localStorage.removeItem('cart');
                setCartItems([]);
              }}
            />
          </>
        )}
      </div>
    </>
  );
}