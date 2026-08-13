'use client';

import { useState, useEffect, useCallback, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';

interface ScanResultItem {
  rawValue?: string;
}

type ScanResult = ScanResultItem[] | string | null | undefined;

interface QrScannerProps {
  key?: number;
  onScan?: (result: ScanResult) => void;
  onError?: (err: unknown) => void;
}

// 🎯 Carga dinámica de escáner sin 'any'
const QrScanner = dynamic<QrScannerProps>(
    () =>
        import('@yudiel/react-qr-scanner').then((m) => {
          const mod = m as unknown as {
            Scanner?: ComponentType<QrScannerProps>;
            default?: ComponentType<QrScannerProps>;
          };
          return mod.Scanner || mod.default || (() => null);
        }),
    { ssr: false }
);

interface CartItem {
  productId: number;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export default function SalesPage() {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      } catch (e) {
        console.error('Error al cargar carrito:', e);
      }
    }
  }, []);

  const fetchProductByBarcode = useCallback(async (code: string) => {
    try {
      const res = await apiFetch(`/api/products/barcode/${encodeURIComponent(code)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }, []);

  const createProductAndAddToCart = useCallback(async (barcodeCode: string) => {
    const existingProduct = await fetchProductByBarcode(barcodeCode);
    if (existingProduct && existingProduct.id) {
      setMessage({
        type: 'error',
        text: `El código ${barcodeCode} ya existe. Usa el producto existente.`,
      });
      return false;
    }

    const name = prompt('Nombre del nuevo producto:');
    if (!name || !name.trim()) return false;

    const priceStr = prompt('Precio de venta ($):');
    const price = parseFloat(priceStr || '0');
    if (isNaN(price) || price <= 0) {
      alert('Precio inválido');
      return false;
    }

    let categoryId: number | undefined = undefined;
    try {
      const res = await apiFetch('/api/categories');
      if (res.ok) {
        const categories = await res.json();
        if (categories && categories.length > 0) {
          const categoryList = categories
              .map((c: { id: number; name: string }, idx: number) => `${idx + 1}. ${c.name}`)
              .join('\n');
          const selected = prompt(
              `Seleccione una categoría:\n${categoryList}\n\n0. Crear nueva categoría\n\nPor defecto: 1`,
              '1'
          );

          const num = parseInt(selected || '1', 10);
          if (num === 0) {
            const newCategoryName = prompt('Nombre de la nueva categoría:');
            if (newCategoryName && newCategoryName.trim()) {
              const createRes = await apiFetch('/api/categories', {
                method: 'POST',
                body: JSON.stringify({ name: newCategoryName.trim() }),
              });
              if (createRes.ok) {
                const newCat = await createRes.json();
                categoryId = newCat.id;
              }
            }
          } else if (num >= 1 && num <= categories.length) {
            categoryId = categories[num - 1].id;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }

    const minStockStr = prompt('Stock mínimo (opcional):', '0');
    const minStock = parseInt(minStockStr || '0', 10) || 0;

    const quantityStr = prompt('¿Cuántas unidades deseas agregar al carrito?', '1');
    const initialQuantity = parseInt(quantityStr || '1', 10) || 1;

    const payload = {
      barcode: barcodeCode,
      delta: initialQuantity,
      reason: 'INBOUND',
      name,
      price,
      minStock,
      categoryId,
    };

    try {
      const res = await apiFetch('/api/products/adjust-by-barcode', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const product = await res.json();
        setCart((prev) => {
          const newCart = [
            ...prev,
            {
              productId: product.id,
              barcode: product.barcode,
              name: product.name,
              price: product.price,
              quantity: initialQuantity,
              subtotal: product.price * initialQuantity,
            },
          ];
          localStorage.setItem('cart', JSON.stringify(newCart));
          return newCart;
        });
        setMessage({
          type: 'success',
          text: `Producto creado y agregado al carrito (${initialQuantity} unidad(es))`,
        });
        return true;
      } else {
        const errText = await res.text();
        setMessage({ type: 'error', text: `Error al crear producto: ${errText}` });
        return false;
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión al crear producto' });
      return false;
    }
  }, [fetchProductByBarcode]);

  const addToCart = useCallback(async (code: string) => {
    if (!code.trim() || isProcessing) return;
    setIsProcessing(true);
    setLoading(true);
    setMessage(null);

    try {
      const product = await fetchProductByBarcode(code);
      if (!product) {
        const created = await createProductAndAddToCart(code);
        if (!created) {
          setMessage({ type: 'error', text: 'No se pudo registrar el producto' });
        }
        setBarcode('');
        return;
      }

      setCart((prev) => {
        const existing = prev.find((item) => item.productId === product.id);
        let newCart;
        if (existing) {
          newCart = prev.map((item) =>
              item.productId === product.id
                  ? {
                    ...item,
                    quantity: item.quantity + 1,
                    subtotal: (item.quantity + 1) * item.price,
                  }
                  : item
          );
        } else {
          newCart = [
            ...prev,
            {
              productId: product.id,
              barcode: product.barcode,
              name: product.name,
              price: product.price,
              quantity: 1,
              subtotal: product.price,
            },
          ];
        }
        localStorage.setItem('cart', JSON.stringify(newCart));
        return newCart;
      });
      setBarcode('');
    } catch {
      setMessage({ type: 'error', text: 'Error al buscar producto' });
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }, [fetchProductByBarcode, createProductAndAddToCart, isProcessing]);

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.productId !== productId);
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const updateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const newCart = prev.map((item) =>
          item.productId === productId
              ? {
                ...item,
                quantity: newQty,
                subtotal: newQty * item.price,
              }
              : item
      );
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleOpenScanner = () => {
    setScannerKey((prev) => prev + 1);
    setScanning(true);
  };

  const handleCloseScanner = () => {
    setScanning(false);
  };

  return (
      <>
        <Navbar />
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Registrar venta</h1>

          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <input
                type="text"
                placeholder="Código de barras"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void addToCart(barcode)}
                className="flex-1 p-2 border rounded text-gray-900"
                disabled={loading || isProcessing}
            />
            <div className="flex gap-2">
              <button
                  onClick={() => void addToCart(barcode)}
                  disabled={loading || !barcode || isProcessing}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Agregar'}
              </button>
              <button
                  onClick={handleOpenScanner}
                  disabled={isProcessing}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                📷 Escanear
              </button>
            </div>
          </div>

          {message && (
              <div
                  className={`mb-4 p-3 rounded ${
                      message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
              >
                {message.text}
              </div>
          )}

          {cart.length > 0 && (
              <>
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full bg-white border">
                    <thead>
                    <tr>
                      <th className="border p-2 text-gray-900">Producto</th>
                      <th className="border p-2 text-gray-900">Precio</th>
                      <th className="border p-2 text-gray-900">Cantidad</th>
                      <th className="border p-2 text-gray-900">Subtotal</th>
                      <th className="border p-2 text-gray-900"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {cart.map((item) => (
                        <tr key={item.productId}>
                          <td className="border p-2 text-gray-900">{item.name}</td>
                          <td className="border p-2 text-gray-900">${item.price.toFixed(2)}</td>
                          <td className="border p-2 text-gray-900">
                            <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                    updateQuantity(item.productId, parseInt(e.target.value, 10) || 1)
                                }
                                className="w-20 p-1 border rounded text-center text-gray-900"
                            />
                          </td>
                          <td className="border p-2 text-gray-900">${item.subtotal.toFixed(2)}</td>
                          <td className="border p-2 text-gray-900">
                            <button
                                onClick={() => removeFromCart(item.productId)}
                                className="text-red-500 hover:text-red-700"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                    <tfoot>
                    <tr>
                      <td colSpan={3} className="border p-2 text-right font-bold text-gray-900">
                        Total
                      </td>
                      <td className="border p-2 font-bold text-gray-900">${total.toFixed(2)}</td>
                      <td className="border p-2"></td>
                    </tr>
                    </tfoot>
                  </table>
                </div>
                <button
                    onClick={() => {
                      localStorage.setItem('cart', JSON.stringify(cart));
                      router.push('/checkout');
                    }}
                    disabled={cart.length === 0}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 font-bold"
                >
                  Ir a pagar
                </button>
              </>
          )}
        </div>

        {scanning && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 w-full max-w-md">
                <div className="flex justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900">Escanea el código de barras</h2>
                  <button onClick={handleCloseScanner} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>
                <QrScanner
                    key={scannerKey}
                    onScan={(result: ScanResult) => {
                      const scannedText =
                          typeof result === 'string'
                              ? result
                              : Array.isArray(result)
                                  ? result[0]?.rawValue
                                  : undefined;

                      if (scannedText) {
                        void addToCart(scannedText);
                        handleCloseScanner();
                      }
                    }}
                    onError={(err: unknown) => console.error('Scanner error:', err)}
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Apunta la cámara al código de barras
                </p>
              </div>
            </div>
        )}
      </>
  );
}