export const dynamic = "force-dynamic";
import { sucesso } from "@/biblioteca/resposta-api";
import { withAuthRoute } from "@/biblioteca/route-wrapper";
import { schemaAtualizarEstoque } from "@/validacoes/estoque.schema";
import { estoqueService } from "@/servicos/EstoqueService";

// get - detalhe do item de estoque
export const GET = withAuthRoute(async (request, user, { params }) => {
  const { id } = await params;
  const item = await estoqueService.obterPorId(id as string, user.id);
  return sucesso({ item });
});

// put - atualizar item de estoque
export const PUT = withAuthRoute(async (request, user, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const dados = schemaAtualizarEstoque.parse(body);

  const updated = await estoqueService.atualizar(id as string, user.id, dados);
  return sucesso({ message: "Item atualizado", item: updated });
});

// delete - desativar item de estoque (soft delete)
export const DELETE = withAuthRoute(async (request, user, { params }) => {
  const { id } = await params;
  await estoqueService.desativar(id as string, user.id);
  return sucesso({ message: "Item desativado" });
});
