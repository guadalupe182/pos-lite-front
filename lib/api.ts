const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.guadaluperosas.com').replace(/\/$/, '');

// Guardar token después del login (en sessionStorage y Cookie)
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    // FIX: Limpiamos el prefijo 'Bearer ' por si el backend ya lo incluye en su respuesta
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

    sessionStorage.setItem('access_token', cleanToken);
    // Guardar también en Cookie para que el middleware de Next.js lo reconozca
    // Ajustado a SameSite=None para compatibilidad cross-site (Vercel -> OCI)
    document.cookie = `access_token=${cleanToken}; path=/; max-age=86400; SameSite=None; Secure`;
  }
}

// Obtener token (Busca en sessionStorage y cae a Cookies si no está)
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('access_token') || getCookie('access_token');
  }
  return null;
}

// Eliminar token (logout)
export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('access_token');
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
  }
}

// Auxiliar para leer cookie en el cliente
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
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
    credentials: 'include', // ESTE ES EL FIX ESTRELLA PARA LAS COOKIES Y EL LOGOUT
    headers,
  });

  // Manejo de expiración de sesión (Solo 401)
  //  FIX: NO desloguear en 403 (Forbidden - Falta de roles), eso debe manejarlo la UI.
  if (response.status === 401) {
    console.error(`Error 401 detectado al llamar a: ${url}. Destruyendo sesión y redirigiendo...`);
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