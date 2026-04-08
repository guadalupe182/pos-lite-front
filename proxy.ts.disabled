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

  // === Ruta pública de login ===
  if (pathname === '/login') {
    if (token) {
      // Si ya tiene token, redirigir al dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // === Rutas protegidas (dashboard y resto) ===
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // === Verificar validez del token ===
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
  } catch  {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};