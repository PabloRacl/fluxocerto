import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Verifica se o token existe e é válido
    const token = req.nextauth.token;
    
    if (!token) {
      // Redireciona para login se não houver token
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // Token válido, permite acesso
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Rotas que DEVEM ser protegidas
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/configuracoes/:path*", 
    "/perfil/:path*",
    "/api/accounts/:path*",
    "/api/categories/:path*",
    "/api/transactions/:path*",
  ],
};