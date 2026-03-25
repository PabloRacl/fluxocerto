import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Verifica se o token existe e é válido
    const token = req.nextauth.token;

    if (!token) {
      // Redireciona para login se não houver token
      return NextResponse.redirect(new URL("/entrar", req.url));
    }

    // Token válido, permite acesso
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/entrar",
    },
  },
);

// Rotas que DEVEM ser protegidas
export const config = {
  matcher: [
    "/painel/:path*",
    "/configuracoes/:path*",
    "/perfil/:path*",
    "/api/contas/:path*",
    "/api/categorias/:path*",
    "/api/transacoes/:path*",
    "/api/dividas/:path*",
    "/api/compras/:path*",
    "/api/metas/:path*",
    "/api/notificacoes/:path*",
    "/api/relatorios/:path*",
    "/api/painel/:path*",
    "/api/listas/:path*",
    "/api/estoque/:path*",
    "/api/orcamentos/:path*",
    "/api/lembretes/:path*",
    "/api/configuracoes/:path*",
  ],
};
