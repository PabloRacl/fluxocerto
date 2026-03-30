import { prisma } from "@/biblioteca/prisma";
import type { CriarEstoqueInput, AtualizarEstoqueInput } from "@/validacoes/estoque.schema";
import { NotFoundError } from "@/biblioteca/erros-customizados";
import { auditService } from "./AuditService";

/**
 * Serviço de Estoque — Expandido para Enterprise P11
 */
export class EstoqueService {
  /**
   * Lista itens de estoque do usuário com resumo de alertas.
   */
  async listar(usuarioId: string, mostrarInativos: boolean) {
    const estoque = await prisma.estoque.findMany({
      where: { 
        usuarioId, 
        isDeleted: false, 
        isArchived: mostrarInativos 
      },
      orderBy: { nome: "asc" },
    });

    const totalItens = estoque.length;
    const valorTotal = estoque.reduce(
      (sum: number, e) => sum + e.precoMedio * Number(e.quantidade),
      0,
    );
    const alertasEstoque = estoque.filter(
      (e) => Number(e.quantidade) <= Number(e.estoqueMinimo),
    );
    const alertasValidade = estoque.filter((e) => {
      if (!e.validade) return false;
      const dias = Math.ceil(
        (new Date(e.validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return dias <= 7 && dias >= 0;
    });

    return {
      estoque,
      resumo: {
        totalItens,
        valorTotal,
        alertasEstoque: alertasEstoque.length,
        alertasValidade: alertasValidade.length,
      },
    };
  }

  /**
   * Obtém um item de estoque por ID.
   */
  async obterPorId(id: string, usuarioId: string) {
    const item = await prisma.estoque.findFirst({
      where: { id, usuarioId, isDeleted: false },
    });

    if (!item) {
      throw new NotFoundError("Item de estoque não encontrado");
    }
    
    return item;
  }

  /**
   * Cria item no estoque especificando o TIPO (P13).
   */
  async criar(usuarioId: string, dados: any) {
    const item = await prisma.estoque.create({
      data: {
        usuarioId,
        nome: dados.nome,
        categoria: dados.categoria,
        quantidade: dados.quantidade,
        unidade: dados.unidade,
        precoMedio: Math.round(dados.precoMedio * 100),
        precoUltimo: Math.round((dados.precoUltimo || dados.precoMedio) * 100),
        estoqueMinimo: dados.estoqueMinimo,
        validade: dados.validade ? new Date(dados.validade) : null,
        tipo: (dados.tipo as any) || 'PESSOAL', // P13: Default Pessoal (Despensa)
        barcode: dados.barcode || null
      }
    });

    await auditService.log({
      userId: usuarioId,
      action: "CREATE_STOCK_ITEM",
      entityType: "ESTOQUE",
      entityId: item.id,
      newValue: item as any
    });

    return item;
  }

  /**
   * Atualiza um item de estoque existente com auditoria.
   */
  async atualizar(id: string, usuarioId: string, dados: AtualizarEstoqueInput) {
    const existing = await this.obterPorId(id, usuarioId);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.estoque.update({
        where: { id },
        data: {
          nome: dados.nome ?? existing.nome,
          categoria: dados.categoria !== undefined ? dados.categoria : existing.categoria,
          quantidade: dados.quantidade !== undefined ? dados.quantidade : existing.quantidade,
          unidade: dados.unidade ?? existing.unidade,
          precoMedio: dados.precoMedio !== undefined ? Math.round(dados.precoMedio * 100) : existing.precoMedio,
          precoUltimo: dados.precoUltimo !== undefined ? Math.round(dados.precoUltimo * 100) : existing.precoUltimo,
          ultimaCompra: dados.ultimaCompra ? new Date(dados.ultimaCompra) : (existing.ultimaCompra ? new Date(existing.ultimaCompra) : null),
          validade: dados.validade !== undefined 
            ? dados.validade ? new Date(dados.validade) : null 
            : (existing.validade ? new Date(existing.validade) : null),
          estoqueMinimo: dados.estoqueMinimo ?? existing.estoqueMinimo,
          ativo: dados.ativo ?? existing.ativo,
          isArchived: dados.ativo === false ? true : undefined,
          archivedAt: dados.ativo === false ? new Date() : undefined,
        },
      });

      await auditService.log({
        userId: usuarioId,
        action: "UPDATE_STOCK_ITEM",
        entityType: "STOCK",
        entityId: id,
        oldValue: existing as any,
        newValue: updated as any,
      });

      return updated;
    });
  }

  /**
   * Desativa um item de estoque (soft delete).
   */
  async desativar(id: string, usuarioId: string) {
    const existing = await this.obterPorId(id, usuarioId);

    return prisma.$transaction(async (tx) => {
      await tx.estoque.update({
        where: { id },
        data: { 
          ativo: false,
          isArchived: true,
          archivedAt: new Date()
        },
      });

      await auditService.log({
        userId: usuarioId,
        action: "DELETE_STOCK_ITEM",
        entityType: "STOCK",
        entityId: id,
        oldValue: existing as any,
      });

      return true;
    });
  }
}

export const estoqueService = new EstoqueService();
