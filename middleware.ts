import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Rutas públicas
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.includes(path);

  // Si no hay token y la ruta no es pública, redirigir a login
  if (!token && !isPublicPath) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si hay token y la ruta es pública, redirigir al dashboard
  if (token && isPublicPath) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
