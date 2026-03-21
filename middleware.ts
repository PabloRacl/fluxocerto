import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Usuário está autenticado, permite acesso
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

// Rotas que devem ser protegidas
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/configuracoes/:path*",
    "/perfil/:path*",
  ],
};