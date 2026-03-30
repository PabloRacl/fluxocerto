import { prisma } from "@/biblioteca/prisma";
import { auditService } from "./AuditService";

/**
 * Serviço de Vendas — Inteligência Comercial (P13 - MEI)
 */
export class VendaService {
  /**
   * Registra uma venda comercial, calcula lucro e baixa o estoque.
   */
  async registrarVenda(usuarioId: string, dados: {
    estoqueId: string;
    quantidade: number;
    valorVenda: number; // centavos
    contaId: string;
    categoriaId: string; // Ex: "Receita de Vendas"
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Validar Estoque (Apenas COMERCIAL)
      const item = await tx.estoque.findFirst({
        where: { id: dados.estoqueId, usuarioId, tipo: 'COMERCIAL', isDeleted: false }
      });

      if (!item) throw new Error("Item de estoque comercial não encontrado.");
      if (Number(item.quantidade) < dados.quantidade) throw new Error("Saldo insuficiente no estoque para esta venda.");

      // 2. Calcular Custo e Lucro
      // Usamos o precoUltimo ou precoMedio do Estoque como custo para o histórico da venda
      const custoTotalVenda = Math.round(Number(item.precoUltimo) * dados.quantidade);
      const lucro = dados.valorVenda - custoTotalVenda;

      // 3. Criar o Registro de Venda
      const venda = await tx.venda.create({
        data: {
          usuarioId,
          estoqueId: dados.estoqueId,
          quantidade: dados.quantidade,
          valorVenda: dados.valorVenda,
          custoVenda: custoTotalVenda,
          lucro,
          contaId: dados.contaId,
          dataVenda: new Date()
        }
      });

      // 4. Baixar Estoque
      await tx.estoque.update({
        where: { id: dados.estoqueId },
        data: { quantidade: { decrement: dados.quantidade } }
      });

      // 5. Gerar Receita Financeira (Cash Flow PJ) e Atualizar Saldo
      await tx.transaction.create({
        data: {
          userId: usuarioId,
          accountId: dados.contaId,
          categoryId: dados.categoriaId,
          description: `Venda: ${item.nome} (x${dados.quantidade})`,
          amount: dados.valorVenda,
          type: "INCOME",
          status: "PAID",
          occurrenceDate: new Date(),
          paidAt: new Date(),
          notes: `Lucro estimado: R$ ${(lucro/100).toFixed(2)}`
        }
      });

      await tx.account.update({
        where: { id: dados.contaId },
        data: { balance: { increment: dados.valorVenda } }
      });

      // 6. Auditoria
      await auditService.log({
        userId: usuarioId,
        action: "REGISTRO_VENDA",
        entityType: "VENDA",
        entityId: venda.id,
        newValue: { venda, lucro }
      });

      return { venda, lucro };
    });
  }

  /**
   * Resumo de Performance Comercial do Mês Atual.
   */
  async obterPerformance(usuarioId: string) {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const vendas = await prisma.venda.findMany({
      where: { usuarioId, dataVenda: { gte: inicioMes } },
      include: { estoque: { select: { nome: true } } },
      orderBy: { dataVenda: 'desc' }
    });

    const faturamentoTotal = vendas.reduce((acc, v) => acc + v.valorVenda, 0);
    const lucroTotal = vendas.reduce((acc, v) => acc + v.lucro, 0);
    const margemMedia = faturamentoTotal > 0 ? (lucroTotal / faturamentoTotal) * 100 : 0;

    return {
      vendas,
      resumo: {
        faturamentoTotal,
        lucroTotal,
        margemMedia: margemMedia.toFixed(1) + "%",
        ticketMedio: vendas.length > 0 ? Math.round(faturamentoTotal / vendas.length) : 0
      }
    };
  }
}

export const vendaService = new VendaService();
