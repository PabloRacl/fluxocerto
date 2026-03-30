import { prisma } from "@/biblioteca/prisma";
import type { CriarAssetInput, AtualizarAssetInput } from "@/validacoes/asset.schema";
import { NotFoundError } from "@/biblioteca/erros-customizados";
import { auditService } from "./AuditService";

/**
 * Serviço de Patrimônio — Gere bens e ativos do usuário.
 */
export class AssetService {
  /**
   * Lista todos os ativos do usuário com cálculo de Valorização (ROI).
   */
  async listar(usuarioId: string, includeArchived: boolean = false) {
    const assets = await prisma.asset.findMany({
      where: { 
        usuarioId, 
        isDeleted: false, 
        isArchived: includeArchived 
      },
      orderBy: { criadoEm: "desc" }
    });

    const totais = assets.reduce((acc, asset) => {
      acc.totalCompra += asset.valorCompra;
      acc.totalAtual += asset.valorAtual;
      return acc;
    }, { totalCompra: 0, totalAtual: 0 });

    const valorizacaoTotal = totais.totalCompra > 0 
      ? ((totais.totalAtual - totais.totalCompra) / totais.totalCompra) * 100 
      : 0;

    return {
      assets: assets.map((a) => ({
        ...a,
        valorizacaoStatus: a.valorAtual >= a.valorCompra ? 'PROFIT' : 'LOSS',
        percentualValorizacao: a.valorCompra > 0 ? ((a.valorAtual - a.valorCompra) / a.valorCompra) * 100 : 0
      })),
      resumo: {
        totalItens: assets.length,
        totalCompra: totais.totalCompra,
        totalAtual: totais.totalAtual,
        valorizacaoGeral: Math.round(valorizacaoTotal * 100) / 100
      }
    };
  }

  /**
   * Cria um novo registro de patrimônio com auditoria.
   */
  async criar(usuarioId: string, dados: CriarAssetInput) {
    return prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          usuarioId,
          nome: dados.nome,
          descricao: dados.descricao,
          tipo: (dados.tipo as any),
          valorCompra: Math.round(dados.valorCompra * 100),
          valorAtual: Math.round((dados.valorAtual ?? dados.valorCompra) * 100),
          dataCompra: dados.dataCompra ? new Date(dados.dataCompra) : null,
          instituicao: dados.instituicao,
          cor: dados.cor,
          icone: dados.icone,
        }
      });

      // --- P9 AUDIT LOG ---
      await auditService.log({
        userId: usuarioId,
        action: "CREATE_ASSET",
        entityType: "ASSET",
        entityId: asset.id,
        newValue: asset as any,
      });

      return asset;
    });
  }

  /**
   * Atualiza valor de mercado ou dados do bem com auditoria.
   */
  async atualizar(id: string, usuarioId: string, dados: AtualizarAssetInput) {
    const asset = await prisma.asset.findFirst({
      where: { id, usuarioId, isDeleted: false }
    });

    if (!asset) throw new NotFoundError("Ativo não encontrado");

    return prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          nome: dados.nome || asset.nome,
          descricao: dados.descricao !== undefined ? dados.descricao : asset.descricao,
          valorAtual: dados.valorAtual !== undefined ? Math.round(dados.valorAtual * 100) : asset.valorAtual,
          instituicao: dados.instituicao !== undefined ? dados.instituicao : asset.instituicao,
          cor: dados.cor || asset.cor,
          icone: dados.icone || asset.icone,
        }
      });

      // --- P9 AUDIT LOG ---
      await auditService.log({
        userId: usuarioId,
        action: "UPDATE_ASSET",
        entityType: "ASSET",
        entityId: id,
        oldValue: asset as any,
        newValue: updatedAsset as any,
      });

      return updatedAsset;
    });
  }

  /**
   * Move para a lixeira (P2 Governance compatible).
   */
  async arquivar(id: string, usuarioId: string) {
    return prisma.asset.updateMany({
      where: { id, usuarioId },
      data: { 
        isArchived: true, 
        archivedAt: new Date() 
      }
    });
  }
}

export const assetService = new AssetService();
