'use client'

export default function LoyaltyPage() {
    return(
        <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6">
                <h1 className="text-2xl font-bold">
                    Programa de Puntos y Lealtad
                </h1>
                <p className="text-slate-600">
                    Gestión de recompensas, acumulación y canje de puntos para clientes.
                </p>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800 text-sm">
                    <strong>Módulo Activo:</strong> Tu licencia incluye la Feature Flag <code className="font-mono font-bold">MULTI-CASH</code>/
                </div>
            </div>
        </div>
    );
}

