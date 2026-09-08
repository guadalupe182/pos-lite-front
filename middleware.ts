import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose"; // 1. Importación para decodificar el token en Edge

// Rutas estrictamente protegidas por autenticación básica
const protectedRoutes = [
  '/',
  '/products',
  '/inventory',
  '/sales',
  '/sales-report',
  '/checkout'
];

// 2. Mapeo de rutas que requieren un módulo/licencia específica
const flagProtectedRoutes: Record<string, string> = {
  '/cash/multi-turn': 'MULTI_CASH',
  '/loyalty': 'LOYALTY',
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Excepciones explícitas: Ignorar retornos de Mercado Pago
  if (pathname.startsWith('/payment/')) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some(
      (route) => pathname === route || (route !== '/' && pathname.startsWith(route + '/'))
  );

  const requiredFlag = flagProtectedRoutes[pathname];

  // 3. Si NO hay token y la ruta es protegida (por auth básica o por flag), mandar a /login
  if (!token && (isProtectedRoute || requiredFlag)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Redirigir al inicio (/) si YA hay token e intenta ir a login/register
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 5. Validación de Licencias / Feature Flags
  if (token && requiredFlag) {
    try {
      const payload = decodeJwt(token);
      const userFlags = (payload.features as string[]) || [];

      // Si no tiene la flag requerida, lo enviamos a la pantalla de Upgrade
      if (!userFlags.includes(requiredFlag)) {
        const upgradeUrl = new URL('/upgrade-plan', request.url);
        upgradeUrl.searchParams.set('required', requiredFlag);
        return NextResponse.redirect(upgradeUrl);
      }
    } catch {
      // Si el token expiró o no es válido, a login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};