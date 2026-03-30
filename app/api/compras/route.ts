import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso, criadoComSucesso } from "@/biblioteca/resposta-api";
import { schemaCriarCompra } from "@/validacoes/compra.schema";
import { compraService } from "@/servicos/CompraService";

// ============================================
// GET - Listar Compras do Usuário
// ============================================
export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const params = request.nextUrl.searchParams;

    const resultado = await compraService.listar(user.id, {
      showDeleted: params.get("showDeleted") === "true",
      loja: params.get("loja"),
      mes: params.get("mes"),
    });

    return sucesso(resultado);
  } catch (error) {
    return tratarErro(error);
  }
}

// ============================================
// POST - Criar Nova Compra Lote / Master Root
// ============================================
export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const dados = schemaCriarCompra.parse(body);

    const result = await compraService.criar(user.id, dados);

    return criadoComSucesso({
      message: "Compra registrada com sucesso",
      compra: result.compra,
      transacao: result.transacao,
    });
  } catch (error) {
    return tratarErro(error);
  }
}
