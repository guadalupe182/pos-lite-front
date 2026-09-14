'use client'

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function UpgradeContent() {
    const searchParams = useSearchParams();
    const required = searchParams.get('required') || 'este modulo';

    return (
        <div className={"flex flex-col items-center justify-center min-h-[80vh] px-4 text-center"}>
            <div className="bg-white rounded-xl shadow-md max-w-md w-full border border-gray-100 p-6">
                <div className={"w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl"}>
                    🔒
                </div>
                <h1 className={"text-2xl font-bold text-gray-800 mb-2"}>Función Bloqueada</h1>
                <p className="text-gray-600 text-sm mb-6">
                    Tu plan actual no incluye el módulo <span className="font-semibold text-indigo-600">{required}</span>. Actualiza tu suscripción para desbloquearlo.
                </p>
                <Link
                    href={"/"}
                    className="inline-block w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                >
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}

export default function UpgradePlanPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="text-gray-500">Cargando...</div>
            </div>
        }>
            <UpgradeContent />
        </Suspense>
    );
}
