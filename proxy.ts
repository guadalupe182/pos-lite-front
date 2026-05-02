import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // === No interferir con las rutas de API ===
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // === Rutas públicas de autenticación ===
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // === Rutas de callback de MercadoPago (no requieren token) ===
  if (pathname.startsWith('/payment/success') ||
      pathname.startsWith('/payment/failure') ||
      pathname.startsWith('/payment/pending')) {
    return NextResponse.next();
  }

  // === Rutas protegidas ===
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // === Verificar validez del token ===
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

//  Esta regex es válida y compatible
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};