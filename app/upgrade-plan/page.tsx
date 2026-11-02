'use client'

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// 1. Creamos un componente interno para la lógica
function UpgradePlanContent() {
    const searchParams = useSearchParams();
    const required = searchParams.get('required') || 'este modulo';

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
            <div className="bg-white rounded-xl shadow-md max-w-md w-full border border-gray-100 p-6"> {/* Agregué p-6 para que no se pegue el texto a los bordes */}
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                    🔒
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Función Bloqueada</h1>
                <p className="text-gray-600 text-sm mb-6"> {/* Corregido test-sm por text-sm */}
                    Tu plan actual no incluye el módulo <span className="font-semibold text-indigo-600">{required}</span>. Actualiza tu suscripción para desbloquearlo. {/* Corregido Actualiaz */}
                </p>
                <Link href={"/"}
                      className="inline-block w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
                >
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}

// 2. El componente principal exportado envuelve todo en Suspense
export default function UpgradePlanPage() {
    return (
        <Suspense fallback={<div className="text-center mt-20">Cargando...</div>}>
            <UpgradePlanContent />
        </Suspense>
    );
}