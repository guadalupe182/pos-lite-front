import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas estrictamente protegidas
const protectedRoutes = [
  '/',
  '/products',
  '/inventory',
  '/sales',
  '/sales-report',
  '/checkout'
];

export function middleware(request: NextRequest) {
  // 1. Obtener token de cookie (o header authorization si aplicara)
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 2. Excepciones explícitas: Ignorar retornos de Mercado Pago
  if (pathname.startsWith('/payment/')) {
    return NextResponse.next();
  }

  // 3. Ver si la ruta actual es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );

  // 4. Redirigir a /login si NO hay token y quiere entrar a ruta protegida
  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname); // Guarda a dónde quería ir
    return NextResponse.redirect(loginUrl);
  }

  // 5. Redirigir al inicio (/) si YA hay token e intenta ir a login/register
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// 🎯 Matcher Corregido: Excluye archivos estáticos, API y assets de Next.js
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto las que empiezan con:
     * - api (rutas de API)
     * - _next/static (archivos estáticos compilados)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, manifest, imágenest (pNG, svg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};