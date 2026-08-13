'use client';

import Link from 'next/link';
import CashStatusBadge from '@/components/CashStatusBadge';
import { useCash } from '@/contexts/CashContext';

export default function Navbar() {
  const { isOpen } = useCash();

  return (
      <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-black text-sky-400 tracking-tight">
            POS Lite
          </Link>
          <div className="flex gap-4 text-sm font-semibold">
            <Link href="/sales" className="hover:text-sky-300 transition-colors">
              Punto de Venta
            </Link>
            <Link href="/products" className="hover:text-sky-300 transition-colors">
              Productos
            </Link>
            <Link href="/checkout" className="hover:text-sky-300 transition-colors">
              Ventas
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <CashStatusBadge isOpen={isOpen} />
        </div>
      </nav>
  );
}