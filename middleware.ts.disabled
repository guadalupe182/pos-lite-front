import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ['/', '/products', '/inventory', '/sales', '/sales-report', '/checkout', '/payment'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  //No proteger rutas de pago(success/failure/pending por si vienen de MP)
  if (pathname.startsWith('/payment/success') ||
      pathname.startsWith('/payment/failure') ||
      pathname.startsWith('/payment/pending')) 
     {
      return NextResponse.next();
     }

  //Redirigir a login si no hay token y está en ruta protegida
  if(!token && protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) 
  {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  //Redirigir a dashboard si hay token y está en auth route
  if(token && (pathname === '/login' || pathname === '/register')) 
  {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next();
}

export const config = 
  {
    matcher: ['/((?|api|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)'],
  }
