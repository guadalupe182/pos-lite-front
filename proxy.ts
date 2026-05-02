import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Rutas que NO requieren autenticación (públicas)
const publicPaths = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/payment/success',
  '/payment/failure',
  '/payment/pending',
];

// Archivos estáticos que NO requieren autenticación
const isStaticAsset = (pathname: string) => {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icon/') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname.includes('.js') ||
    pathname.includes('.css') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.svg') ||
    pathname.includes('.ico') ||
    pathname.includes('.woff') ||
    pathname.includes('.woff2') ||
    pathname.includes('.json')
  );
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Excluir TODOS los assets estáticos (incluyendo PWA)
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // 2. Excluir rutas públicas específicas
  if (publicPaths.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if ((pathname === '/login' || pathname === '/register') && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. Proteger rutas privadas
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Verificar token
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};