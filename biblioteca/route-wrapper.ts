import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "./obter-usuario-autenticado";
import { tratarErro } from "./tratar-erro";

type RouteContext = { params?: Record<string, string | string[]> };

/**
 * Tipo da callback central da nossa API.
 * Recebe a Request nativa, o Usuário já decodificado pelo NextAuth, 
 * e os parâmetros dinâmicos da URL.
 */
type RouteHandlerCallback = (
  req: NextRequest,
  user: { id: string; email?: string | null; name?: string | null },
  context: RouteContext
) => Promise<Response>;

/**
 * Wrapper HOC (High-Order-Function) para as Rotas da API.
 * Encapsula o Padrão Enterprise: 
 * 1. Try/Catch Global
 * 2. Autenticação Automática e Bloqueio Unauthorized
 * 3. Delegação de Erros (ApiError/ZodError) para o tratarErro
 * 
 * Como usar:
 * export const GET = withAuthRoute(async (req, user, { params }) => { ... })
 */
export const withAuthRoute = (handler: RouteHandlerCallback) => {
  return async (req: NextRequest, context: RouteContext): Promise<Response> => {
    try {
      // 1. Extração segura de Autenticação (dispara throw se não logado)
      const user = await obterUsuarioAutenticado();

      // 2. Executa a Lógica de Negócio (Controller)
      return await handler(req, user, context);

    } catch (error) {
      // 3. Absorção centralizada de Exceções
      return tratarErro(error);
    }
  };
};
