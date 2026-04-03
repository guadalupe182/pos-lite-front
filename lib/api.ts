// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    // Token inválido o expirado → redirigir al login
    // Opcional: eliminar la cookie manualmente (no es necesario, el backend la invalidará)
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  return response;
}