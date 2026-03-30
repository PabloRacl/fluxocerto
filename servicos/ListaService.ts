import { prisma } from "@/biblioteca/prisma";
import type { CriarListaInput } from "@/validacoes/lista.schema";

/**
 * Serviço de Listas (Listas de Compras Parent-Child Arrays).
 */
export class ListaService {
  /**
   * Lista relacional dos itens na Lista de acordo com Ordem.
   */
  async listar(usuarioId: string) {
    return prisma.listaCompra.findMany({
      where: { usuarioId },
      include: { itens: { orderBy: { ordem: "asc" } } },
      orderBy: { criadoEm: "desc" },
    });
  }

  /**
   * Cria recursão (Lista e Nested Item).
   */
  async criar(usuarioId: string, dados: CriarListaInput) {
    return prisma.listaCompra.create({
      data: {
        usuarioId,
        nome: dados.nome,
        itens: dados.itens.length
          ? {
              create: dados.itens.map((item, i) => ({
                nome: item.nome,
                quantidade: item.quantidade,
                unidade: item.unidade,
                precoMaximo: item.precoMaximo
                  ? Math.round(item.precoMaximo * 100)
                  : null,
                observacao: item.observacao || null,
                ordem: i,
              })),
            }
          : undefined,
      },
      include: { itens: true },
    });
  }
}

export const listaService = new ListaService();
