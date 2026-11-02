'use client'

export default function MultiTurnPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6">
                <h1 className="text-2xl font-bold">
                    Gestión de Múltiples Cajas y Tiendas
                </h1>
                <p className="text-slate-600">
                    Módulo de control de aperturas, cierres y arqueos de caja por turno.
                </p>
                <div className="bg-sky-50 p-4">
                    <strong>Módulo Activo:</strong> Tu licencia incluye la Feature Flag <code className="font-mono font-bold">MULTI-CASH</code>
                </div>
            </div>
        </div>
    );
}