import { getServerSession } from "next-auth";
import { authOptions } from "./autenticacao";
import { prisma } from "./prisma";

/**
 * Erro personalizado para falhas de autenticação.
 * Contém o statusCode HTTP apropriado.
 */
export class ErroAutenticacao extends Error {
  statusCode: number;

  constructor(mensagem: string, statusCode: number) {
    super(mensagem);
    this.name = "ErroAutenticacao";
    this.statusCode = statusCode;
  }
}

/**
 * Obtém o usuário autenticado a partir da sessão.
 * Lança ErroAutenticacao se não houver sessão ou usuário.
 *
 * Substitui o boilerplate repetido em cada handler:
 *   const session = await getServerSession(authOptions);
 *   if (!session?.user?.email) return 401;
 *   const user = await prisma.user.findUnique(...);
 *   if (!user) return 404;
 */
export async function obterUsuarioAutenticado() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new ErroAutenticacao("Não autorizado", 401);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new ErroAutenticacao("Usuário não encontrado", 404);
  }

  return user;
}
