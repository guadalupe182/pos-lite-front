import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg w-full max-w-md text-center text-slate-500 font-medium text-sm animate-pulse">
                    Cargando entorno seguro...
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}