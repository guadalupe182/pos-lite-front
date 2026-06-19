const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://pos-lite-kj7u.onrender.com';

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

// Nuevo DTO con desglose detallado
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
  cardBreakdown: Record<string, number>; // { "DEBIT": 100, "CREDIT_3MSI": 200, ... }
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
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('access_token', token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('access_token');
  }
  return null;
}

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
    credentials: 'omit',
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