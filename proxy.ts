import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // === EXCLUSIONES (no requieren autenticación) ===
  // 1. Rutas de API
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 2. Assets de PWA y estáticos
  if (pathname === '/sw.js' || 
      pathname === '/manifest.webmanifest' ||
      pathname.startsWith('/_next/') ||
      pathname.includes('.ico') ||
      pathname.includes('.png') ||
      pathname.includes('.jpg') ||
      pathname.includes('.svg')) {
    return NextResponse.next();
  }

  // 3. Rutas públicas de autenticación
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 4. Callbacks de MercadoPago
  if (pathname.startsWith('/payment/success') ||
      pathname.startsWith('/payment/failure') ||
      pathname.startsWith('/payment/pending')) {
    return NextResponse.next();
  }

  // === PROTECCIÓN ===
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // === VERIFICAR TOKEN ===
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }

  return NextResponse.next();
}

// Matcher simple: excluye assets estáticos
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)',
  ],
};