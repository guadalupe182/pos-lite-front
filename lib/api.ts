// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://pos-lite-kj7u.onrender.com';

export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${endpoint}`;   // endpoint debe empezar con /api/...
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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