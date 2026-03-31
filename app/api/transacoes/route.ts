export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso, criadoComSucesso } from "@/biblioteca/resposta-api";
import { schemaCriarTransacao } from "@/validacoes/transacao.schema";
import { transacaoService } from "@/servicos/TransacaoService";

// ============================================
// GET - Listar Transações do Usuário
// ============================================
export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const params = request.nextUrl.searchParams;

    const resultado = await transacaoService.listar(user.id, {
      page: parseInt(params.get("page") || "1"),
      limit: parseInt(params.get("limit") || "25"),
      type: params.get("type"),
      accountId: params.get("accountId"),
      categoryId: params.get("categoryId"),
      status: params.get("status"),
      search: params.get("search"),
      startDate: params.get("startDate"),
      endDate: params.get("endDate"),
      showArchived: params.get("showArchived") === "true",
    });

    return sucesso(resultado);
  } catch (error) {
    return tratarErro(error);
  }
}

// ============================================
// POST - Criar Nova Transação
// ============================================
export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const dados = schemaCriarTransacao.parse(body);

    const transaction = await transacaoService.criar(user.id, dados);

    return criadoComSucesso({
      message: "Transação criada com sucesso",
      transaction,
    });
  } catch (error) {
    return tratarErro(error);
  }
}
