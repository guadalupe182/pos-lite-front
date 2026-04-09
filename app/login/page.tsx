import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-96 text-center">
          Cargando...
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}