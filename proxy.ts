import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token');
  const { pathname } = request.nextUrl;

  // Si no hay token y la ruta no es login (raíz) ni una ruta de API, redirigir a login
  if (!token && pathname !== '/' && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si hay token y está en login, redirigir a products
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/products', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};