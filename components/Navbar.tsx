'use client';

import Link from 'next/link';
import CashStatusBadge from '@/components/CashStatusBadge';
import { useCash } from '@/contexts/CashContext';
import { useAuth } from '@/contexts/AuthContext';
import { HasFlag } from "@/components/HasFlag";

export default function Navbar() {
    const { isOpen } = useCash();
    const { user } = useAuth();

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

                    {/* Enlaces protegidos por Feature Flags */}
                    <HasFlag name={"MULTI_CASH"}>
                        <Link href="/cash/multi-turn" className="hover:text-sky-300 transition-colors">
                            Turnos
                        </Link>
                    </HasFlag>

                    <HasFlag name={"LOYALTY"}>
                        <Link href="/loyalty" className="hover:text-sky-300 transition-colors">
                            Puntos
                        </Link>
                    </HasFlag>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Identificador del Cajero Autenticado */}
                {user && (
                    <span className="text-xs font-medium text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                        👤 {user.email || user.username}
                    </span>
                )}

                <CashStatusBadge isOpen={isOpen} />
            </div>
        </nav>
    );
}