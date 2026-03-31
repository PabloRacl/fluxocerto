export const dynamic = "force-dynamic";
import { sucesso } from "@/biblioteca/resposta-api";
import { withAuthRoute } from "@/biblioteca/route-wrapper";
import { schemaAtualizarEstoque } from "@/validacoes/estoque.schema";
import { estoqueService } from "@/servicos/EstoqueService";

// ============================================
// GET - Detalhe do Item de Estoque
// ============================================
export const GET = withAuthRoute(async (request, user, { params }) => {
  const item = await estoqueService.obterPorId(params!.id as string, user.id);
  return sucesso({ item });
});

// ============================================
// PUT - Atualizar Item de Estoque
// ============================================
export const PUT = withAuthRoute(async (request, user, { params }) => {
  const body = await request.json();
  const dados = schemaAtualizarEstoque.parse(body);

  const updated = await estoqueService.atualizar(params!.id as string, user.id, dados);
  return sucesso({ message: "Item atualizado", item: updated });
});

// ============================================
// DELETE - Desativar Item de Estoque (Soft Delete)
// ============================================
export const DELETE = withAuthRoute(async (request, user, { params }) => {
  await estoqueService.desativar(params!.id as string, user.id);
  return sucesso({ message: "Item desativado" });
});
