import { NextResponse } from "next/server";
import type { NextRequest }  from "next/server";

export function middleware(request: NextRequest) {
  // Obtener token de la cookie
  const token = request.cookies.get('access_token')?.value;
  
  // Obtener la ruta actual
  const path = request.nextUrl.pathname;
  
  // Definir páginas públicas (sin autenticación)
  const isPublicPage = path === '/login' || path === '/register';
  
  // Si no hay token y la página no es pública, redirigir a login
  if (!token && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Si hay token y está en página pública, redirigir al dashboard
  if (token && isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon).*)'
  ]
};
