// lib/api.ts
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://pos-lite-kj7u.onrender.com').replace(/\/$/, '');

// Guardar token después del login
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('access_token', token);
  }
}

// Obtener token
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('access_token');
  }
  return null;
}

// Eliminar token (logout)
export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('access_token');
  }
}

export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;
  const token = getAuthToken();

  // Normalizar Headers
  const headers: Record<string, string> = {};

  // Solo agregar Content-Type si el body NO es FormData
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Copiar headers existentes
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // Agregar Token de Autenticación
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'omit',
    headers,
  });

  // Manejo de expiración de sesión (401 / 403)
  if (response.status === 401 || response.status === 403) {
    removeAuthToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  // Manejo seguro de errores sin romper el Stream
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} (${response.statusText})`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else {
        const textError = await response.text();
        if (textError) errorMessage = textError;
      }
    } catch {
      // Si falla la lectura del body, conserva la causa por defecto
    }
    throw new Error(errorMessage);
  }

  return response;
}