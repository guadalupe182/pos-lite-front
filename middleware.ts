import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    //obtener token de la cookie o del header 
    const token = request.cookies.get('access_token')?.value;

    const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register';


    //Si no hay token y no esta en pagina de auth, redirigir a login
    if (!token && !isAuthPage) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    //Si hay token y esta en pagina de auth, redirigir a la dashboard
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)'
    ]
}