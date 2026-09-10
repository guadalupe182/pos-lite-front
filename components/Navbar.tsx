'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // <-- 1. Importar usePathname
import CashStatusBadge from '@/components/CashStatusBadge';
import OpenCashModal from '@/components/OpenCashModal';
import CloseCashModal from '@/components/CloseCashModal';
import { useCash } from '@/contexts/CashContext';
import { useAuth } from '@/contexts/AuthContext';
import { HasFlag } from "@/components/HasFlag";

export default function Navbar() {
    const pathname = usePathname(); // <-- 2. Obtener la ruta actual
    const [mounted, setMounted] = useState(false);
    const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

    const { isOpen } = useCash();
    const { user } = useAuth();

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // 3. Si estamos en /login o /register, no renderizar el Navbar
    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    if (!mounted) {
        return (
            <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md h-16">
                <span className="text-xl font-black text-sky-400">POS Lite</span>
            </nav>
        );
    }

    return (
        <>
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
                    {user && (
                        <span className="text-xs font-medium text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                            👤 {user.name || user.email || user.username || 'Usuario'}
                        </span>
                    )}

                    <CashStatusBadge isOpen={isOpen} />

                    {isOpen ? (
                        <button
                            onClick={() => setIsCloseModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Cerrar Caja
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsOpenModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                            Abrir Caja
                        </button>
                    )}
                </div>
            </nav>

            <OpenCashModal
                isOpen={isOpenModalOpen}
                onClose={() => setIsOpenModalOpen(false)}
                onSuccess={() => setIsOpenModalOpen(false)}
            />

            <CloseCashModal
                isOpen={isCloseModalOpen}
                onClose={() => setIsCloseModalOpen(false)}
                onSuccess={() => setIsCloseModalOpen(false)}
            />
        </>
    );
}