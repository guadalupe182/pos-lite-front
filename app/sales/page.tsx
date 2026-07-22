'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import QrScanner from '@/components/QrScanner';

type CartItem = {
  productId: number;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type Category = {
  id: number;
  name: string;
};

export default function SalesPage() {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  // Cargar carrito desde localStorage al iniciar (sin activar set-state-in-effect)
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setTimeout(() => setCart(parsedCart), 0);
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

  const createProductAndAddToCart = useCallback(async (barcodeStr: string) => {
    const existingProduct = await fetchProductByBarcode(barcodeStr);
    if (existingProduct && existingProduct.id) {
      setMessage({
        type: "error",
        text: `El código ${barcodeStr} ya existe. Usa el producto existente`,
      });
      return false;
    }

    const name = prompt("Producto no encontrado. Ingrese el nombre:");
    if (!name) return false;

    const priceStr = prompt("Ingrese el precio:");
    const price = parseFloat(priceStr || "0");
    if (isNaN(price) || price <= 0) {
      alert("Precio inválido");
      return false;
    }

    let categories: Category[] = [];
    let categoryId = 1;

    try {
      const res = await apiFetch("/api/categories");
      categories = await res.json();

      if (categories && categories.length > 0) {
        const categoryList = categories
            .map((c, idx) => `${idx + 1}. ${c.name}`)
            .join("\n");
        const selected = prompt(
            `Seleccione una categoría:\n${categoryList}\n\n0. Crear nueva categoría\n\nPor defecto: 1`,
            "1",
        );

        const num = parseInt(selected || "1", 10);

        if (num === 0) {
          const newCategoryName = prompt("Ingrese el nombre de la nueva categoría:");
          if (newCategoryName && newCategoryName.trim()) {
            try {
              const createRes = await apiFetch("/api/categories", {
                method: "POST",
                body: JSON.stringify({ name: newCategoryName.trim() }),
              });
              if (createRes.ok) {
                const newCategory = await createRes.json();
                categoryId = newCategory.id;
              } else {
                alert("Error al crear categoría, se usará la categoría por defecto");
              }
            } catch {
              alert("Error al crear categoría, se usará la categoría por defecto");
            }
          }
        } else if (num >= 1 && num <= categories.length) {
          categoryId = categories[num - 1].id;
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }

    const minStockStr = prompt("Stock mínimo (opcional, presione Enter para 0):", "0");
    const minStock = parseInt(minStockStr || "0", 10) || 0;

    const quantityStr = prompt("¿Cuántas unidades deseas agregar al carrito?", "1");
    const initialQuantity = parseInt(quantityStr || "1", 10) || 1;

    const payload = {
      barcode: barcodeStr,
      delta: initialQuantity,
      reason: "INBOUND",
      name,
      price,
      minStock,
      categoryId,
    };

    try {
      const res = await apiFetch("/api/products/adjust-by-barcode", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const product = await res.json();
        setCart((prev) => {
          const newCart = [...prev, {
            productId: product.id,
            barcode: product.barcode,
            name: product.name,
            price: product.price,
            quantity: initialQuantity,
            subtotal: product.price * initialQuantity,
          }];
          localStorage.setItem('cart', JSON.stringify(newCart));
          return newCart;
        });
        setMessage({
          type: "success",
          text: `Producto creado y agregado al carrito (${initialQuantity} unidad(es))`,
        });
        return true;
      } else {
        const error = await res.text();
        setMessage({ type: "error", text: `Error al crear producto: ${error}` });
        return false;
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión al crear producto" });
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
          setMessage({ type: "error", text: "No se pudo crear el producto" });
        }
        setLoading(false);
        setIsProcessing(false);
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
          newCart = [...prev, {
            productId: product.id,
            barcode: product.barcode,
            name: product.name,
            price: product.price,
            quantity: 1,
            subtotal: product.price,
          }];
        }
        localStorage.setItem('cart', JSON.stringify(newCart));
        return newCart;
      });
      setBarcode("");
    } catch {
      setMessage({ type: "error", text: "Error al buscar producto" });
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }, [fetchProductByBarcode, createProductAndAddToCart, isProcessing]);

  // Atajo directo para demo sin prompts ni alertas
  const addQuickDemoItem = (id: number, barcodeStr: string, name: string, price: number) => {
    setMessage(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === id);
      let newCart;
      if (existing) {
        newCart = prev.map((item) =>
            item.productId === id
                ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
                : item
        );
      } else {
        newCart = [...prev, { productId: id, barcode: barcodeStr, name, price, quantity: 1, subtotal: price }];
      }
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.productId !== productId);
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    if (confirm("¿Cancelar esta venta y vaciar la orden?")) {
      setCart([]);
      localStorage.removeItem('cart');
      setMessage({ type: 'success', text: 'Venta cancelada.' });
    }
  };

  const handleOpenScanner = () => {
    setScannerKey((prev) => prev + 1);
    setScanning(true);
  };

  const handleCloseScanner = () => {
    setScanning(false);
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

          {/* Header con Badge Enterprise GDEV */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 uppercase tracking-wide mb-1">
                🛡️ GDEV SaaS Omnicanal
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Terminal de Punto de Venta</h1>
            </div>
            <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-mono">
              Estado: <span className="text-emerald-600 font-bold">● En Línea</span>
            </div>
          </div>

          {/* Tarjeta de Atajos Rápidos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
              ⚡ Catálogo Demo Rápido
            </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
              1-Click Add
            </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                  onClick={() => addQuickDemoItem(9991, "123456", "Mouse Inalámbrico GDEV", 1200)}
                  className="text-xs font-semibold bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-sky-300 transition-all cursor-pointer"
              >
                + Mouse Inalámbrico ($1,200)
              </button>
              <button
                  onClick={() => addQuickDemoItem(9992, "789012", "Teclado Mecánico RGB", 850)}
                  className="text-xs font-semibold bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-sky-300 transition-all cursor-pointer"
              >
                + Teclado Mecánico ($850)
              </button>
            </div>
          </div>

          {/* Buscador de Código de Barras / Scanner */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                  type="text"
                  placeholder="Escribe o escanea un código de barras..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addToCart(barcode)}
                  className="flex-1 p-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  disabled={loading || isProcessing}
              />
              <div className="flex gap-2">
                <button
                    onClick={() => addToCart(barcode)}
                    disabled={loading || !barcode || isProcessing}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {loading ? "Buscando..." : "Agregar"}
                </button>
                <button
                    onClick={handleOpenScanner}
                    disabled={isProcessing}
                    className="bg-[#090d16] hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  📷 Escanear
                </button>
              </div>
            </div>
          </div>

          {message && (
              <div className={`p-3.5 rounded-xl text-sm border font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                {message.text}
              </div>
          )}

          {/* Tabla del Carrito */}
          {cart.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Precio</th>
                    <th className="p-4 text-center">Cant.</th>
                    <th className="p-4 text-right">Subtotal</th>
                    <th className="p-4 text-center"></th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {cart.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="p-4 text-slate-600">${item.price.toFixed(2)}</td>
                        <td className="p-4 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-4 text-right font-bold text-slate-900">${item.subtotal.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer"
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>

                {/* Total y Checkout */}
                <div className="p-5 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Orden</span>
                    <span className="text-3xl font-black text-slate-900">${total.toFixed(2)} <span className="text-xs font-normal text-slate-500">MXN</span></span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={clearCart}
                        className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                        onClick={() => router.push('/checkout')}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md shadow-sky-600/20"
                    >
                      Procesar Cobro →
                    </button>
                  </div>
                </div>
              </div>
          ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                  🛒
                </div>
                <p className="text-sm font-semibold text-slate-700">El carrito de compras está vacío</p>
                <p className="text-xs text-slate-400 mt-1">Usa los botones del catálogo demo o escanea un código para comenzar.</p>
              </div>
          )}
        </main>

        {/* Modal Scanner */}
        {scanning && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-base font-bold text-slate-900">Escanea el código de barras</h2>
                  <button onClick={handleCloseScanner} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold">✕</button>
                </div>
                <QrScanner
                    key={scannerKey}
                    onScan={(result) => {
                      if (result) {
                        addToCart(result);
                        handleCloseScanner();
                      }
                    }}
                    onError={(err) => console.error("Scanner error:", err)}
                    facingMode="environment"
                />
                <p className="text-xs text-slate-500 mt-3 text-center">Apunta la cámara al código de barras del producto</p>
              </div>
            </div>
        )}
      </div>
  );
}