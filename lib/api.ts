const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.guadaluperosas.com').replace(/\/$/, '');

// ==================== TIPOS ====================
export interface CashSession {
  id: number;
  openedAt: string;
  closedAt: string | null;
  initialCash: number;
  expectedCash: number | null;
  actualCash: number | null;
  difference: number | null;
  status: 'OPEN' | 'CLOSED';
  openedBy: string;
}

export interface CashCloseReportDto {
  id: number;
  closureDate: string;
  initialCash: number;
  finalCash: number;
  expectedCash: number;
  difference: number;
  closedBy: string;
  closedAt: string;
  totalCashSales: number;
  totalCardSales: number;
  cardBreakdown: Record<string, number>;
  totalMercadoPagoSales: number;
  totalSales: number;
}

export interface CurrentSessionDto {
  id: number;
  initialCash: number;
  status: string;
  openedAt: string;
  openedBy: string;
}

export interface DailySummaryDto {
  totalSales: number;
  totalTransactions: number;
}

// ==================== AUTH ====================
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
    credentials: 'omit', // Ya no usamos cookies
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

// ==================== CAJA ====================
export async function getDailySummary(): Promise<DailySummaryDto> {
  return apiFetch('/api/cash/daily-summary', { method: 'GET' }).then(res => res.json());
}

export async function closeCash(finalCash: number): Promise<CashCloseReportDto> {
  return apiFetch('/api/cash/close', {
    method: 'POST',
    body: JSON.stringify({ finalCash }),
  }).then(res => res.json());
}

export async function isCashClosedToday(): Promise<boolean> {
  return apiFetch('/api/cash/is-closed', { method: 'GET' }).then(res => res.json());
}

export async function openCash(initialCash: number): Promise<CashSession> {
  return apiFetch('/api/cash/open', {
    method: 'POST',
    body: JSON.stringify({ initialCash }),
  }).then(res => res.json());
}

export async function getCurrentCashSession(): Promise<CurrentSessionDto | null> {
  return apiFetch('/api/cash/current-session', {
    method: 'GET',
  }).then(res => res.json());
}

export async function isCashOpen(): Promise<boolean> {
  return apiFetch('/api/cash/is-open', {
    method: 'GET',
  }).then(res => res.json());
}

// ==================== NOTIFICACIONES ====================

export interface Notification {
  id: number;
  type: 'STOCK_LOW' | 'CASH_LOW';
  message: string;
  createdAt: string;
  read: boolean;
  userId: string;
}

export async function getNotifications(): Promise<Notification[]> {
  return apiFetch('/api/notifications', { method: 'GET' }).then(res => res.json());
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  return apiFetch('/api/notifications/unread', { method: 'GET' }).then(res => res.json());
}

export async function markNotificationAsRead(id: number): Promise<void> {
  return apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' }).then(res => res.json());
}

export async function deleteNotification(id: number): Promise<void> {
  return apiFetch(`/api/notifications/${id}`, { method: 'DELETE' }).then(res => res.json());
}