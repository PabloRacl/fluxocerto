import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso, criadoComSucesso } from "@/biblioteca/resposta-api";
import { schemaCriarConta } from "@/validacoes/conta.schema";
import { contaService } from "@/servicos/ContaService";

// ============================================
// GET - Listar todas as contas do usuário
// ============================================
export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const includeArchived =
      request.nextUrl.searchParams.get("includeArchived") === "true";

    const contas = await contaService.listar(user.id, includeArchived);
    return sucesso(contas);
  } catch (error) {
    return tratarErro(error);
  }
}

// ============================================
// POST - Criar nova conta
// ============================================
export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const dados = schemaCriarConta.parse(body);

    const account = await contaService.criar(user.id, dados);
    return criadoComSucesso({ message: "Conta criada com sucesso", account });
  } catch (error) {
    return tratarErro(error);
  }
}
