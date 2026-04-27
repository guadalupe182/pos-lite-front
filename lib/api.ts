// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://pos-lite-kj7u.onrender.com';

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
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();
  
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

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
      headers = { ...headers, ...options.headers as Record<string, string> };
    }
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    credentials: 'omit', // Ya no usamos cookies
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else {
        errorMessage = await response.text();
      }
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }
  return response;
}