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

  // === Redirecciones basadas en autenticación ===
  if (!token && pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/products', request.url));
  }

  // === Verificación opcional del token (si existe y no es API) ===
  if (token && pathname !== '/') {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
    } catch (error) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('access_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};