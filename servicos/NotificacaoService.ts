import { prisma } from "@/biblioteca/prisma";
import type { TipoLembrete } from "@prisma/client";

/**
 * Serviço de Notificações — Proatividade Inteligente (P14)
 * Gerencia lembretes internos e gatilhos financeiros.
 */
export class NotificacaoService {
  /**
   * Salva uma subscrição push para o usuário.
   */
  async salvarSubscricao(usuarioId: string, subscription: unknown) {
    await prisma.notificationPref.upsert({
      where: { userId: usuarioId },
      update: { pushToken: JSON.stringify(subscription), pushEnabled: true },
      create: { userId: usuarioId, pushToken: JSON.stringify(subscription), pushEnabled: true }
    });
  }

  /**
   * Cria um lembrete no banco e simula Web Push.
   */
  async notificar(usuarioId: string, dados: {
    titulo: string;
    mensagem: string;
    tipo: 'INFO' | 'WARNING' | 'SUCCESS';
    url?: string;
    lembreteTipo?: TipoLembrete;
    referenciaId?: string;
    referenciaTipo?: string;
  }) {
    const lembreteTipo: TipoLembrete =
      dados.lembreteTipo ?? (dados.tipo === "SUCCESS" ? "PROGRESSO_META" : "GERAL");

    const lembrete = await prisma.lembrete.create({
      data: {
        usuarioId: usuarioId,
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        tipo: lembreteTipo,
        notificarEm: new Date(),
        lido: false,
        url: dados.url || null,
        referenciaId: dados.referenciaId || null,
        referenciaTipo: dados.referenciaTipo || null
      }
    });

    console.log(`[NOTIFICAÇÃO] Para: ${usuarioId} -> ${dados.titulo}`);
    return lembrete;
  }

  /**
   * Processa todos os gatilhos financeiros proativos.
   */
  async processarTriggers(usuarioId: string) {
    try {
      await Promise.all([
        this.processarTransacoesPendentes(usuarioId),
        this.processarDividasVencendo(usuarioId),
        this.processarAssinaturasVencendo(usuarioId),
        this.processarMetas(usuarioId),
        this.processarOrcamentos(usuarioId),
        this.processarLimitesCartao(usuarioId),
        this.processarEstoque(usuarioId)
      ]);
    } catch (error) {
      console.error("Erro ao processar triggers de notificação:", error);
    }
  }

  private async processarTransacoesPendentes(usuarioId: string) {
    const agora = new Date();
    const limite = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);

    const transacoes = await prisma.transaction.findMany({
      where: {
        userId: usuarioId,
        status: "PENDING",
        isDeleted: false,
        dueDate: { gte: agora, lte: limite }
      },
      include: { category: { select: { name: true } } }
    });

    for (const t of transacoes) {
      const existe = await prisma.lembrete.findFirst({
        where: { usuarioId, referenciaId: t.id, referenciaTipo: "TRANSACAO" }
      });

      if (!existe) {
        await this.notificar(usuarioId, {
          titulo: `Vencimento: ${t.description}`,
          mensagem: `${t.category?.name || "Conta"} vence em breve. Valor: R$ ${(t.amount / 100).toFixed(2)}`,
          tipo: "WARNING",
          lembreteTipo: "VENCIMENTO_TRANSACAO",
          referenciaId: t.id,
          referenciaTipo: "TRANSACAO"
        });
      }
    }
  }

  private async processarDividasVencendo(usuarioId: string) {
    const agora = new Date();
    const limite = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);

    const dividas = await prisma.debt.findMany({
      where: {
        userId: usuarioId,
        isDeleted: false,
        isPaidOff: false,
        nextDueDate: { gte: agora, lte: limite }
      }
    });

    for (const d of dividas) {
      const existe = await prisma.lembrete.findFirst({
        where: { usuarioId, referenciaId: d.id, referenciaTipo: "DIVIDA" }
      });

      if (!existe) {
        await this.notificar(usuarioId, {
          titulo: `Parcela: ${d.name}`,
          mensagem: `Uma parcela de R$ ${(d.installmentValue / 100).toFixed(2)} vence em breve.`,
          tipo: "WARNING",
          lembreteTipo: "VENCIMENTO_DIVIDA",
          referenciaId: d.id,
          referenciaTipo: "DIVIDA"
        });
      }
    }
  }

  private async processarAssinaturasVencendo(usuarioId: string) {
    const agora = new Date();
    const limite = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);

    const assinaturas = await prisma.assinatura.findMany({
      where: {
        usuarioId,
        ativa: true,
        isDeleted: false,
        isArchived: false,
        proximaRenovacao: { gte: agora, lte: limite }
      }
    });

    for (const a of assinaturas) {
      const existe = await prisma.lembrete.findFirst({
        where: { usuarioId, referenciaId: a.id, referenciaTipo: "ASSINATURA" }
      });

      if (!existe) {
        await this.notificar(usuarioId, {
          titulo: `Renovação: ${a.nome}`,
          mensagem: `Sua assinatura de R$ ${(a.valor / 100).toFixed(2)} será renovada em breve.`,
          tipo: "WARNING",
          lembreteTipo: "RENOVACAO_ASSINATURA",
          referenciaId: a.id,
          referenciaTipo: "ASSINATURA"
        });
      }
    }
  }

  private async processarMetas(usuarioId: string) {
    const metas = await prisma.meta.findMany({
      where: { usuarioId, isDeleted: false, concluida: false }
    });

    for (const m of metas) {
      if (m.valorAlvo <= 0) continue;
      const percentual = (m.montanteAtual / m.valorAlvo) * 100;
      let milestone = 0;
      
      if (percentual >= 100) milestone = 100;
      else if (percentual >= 80) milestone = 80;
      else if (percentual >= 50) milestone = 50;

      if (milestone > 0) {
        const titulo = `Meta: ${milestone}% atingido!`;
        const existe = await prisma.lembrete.findFirst({
          where: { usuarioId, titulo, referenciaId: m.id }
        });

        if (!existe) {
          await this.notificar(usuarioId, {
            titulo,
            mensagem: `Parabéns! Você alcançou ${milestone}% do objetivo "${m.nome}".`,
            tipo: "SUCCESS",
            lembreteTipo: "PROGRESSO_META",
            referenciaId: m.id,
            referenciaTipo: "META"
          });
        }
      }
    }
  }

  private async processarOrcamentos(usuarioId: string) {
    const categorias = await prisma.category.findMany({
      where: { userId: usuarioId, budgetLimit: { gt: 0 }, isDeleted: false }
    });

    for (const cat of categorias) {
      const transacoes = await prisma.transaction.aggregate({
        where: { 
          categoryId: cat.id, 
          userId: usuarioId, 
          type: "EXPENSE",
          occurrenceDate: { 
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
          }
        },
        _sum: { amount: true }
      });

      const gasto = transacoes._sum.amount || 0;
      const percentual = (gasto / cat.budgetLimit!) * 100;

      if (percentual >= 80) {
        const titulo = `Orçamento: ${cat.name} em ${Math.round(percentual)}%`;
        const existe = await prisma.lembrete.findFirst({
          where: { usuarioId, titulo, referenciaId: cat.id }
        });

        if (!existe) {
          await this.notificar(usuarioId, {
            titulo,
            mensagem: `Você utilizou ${Math.round(percentual)}% do orçamento de "${cat.name}".`,
            tipo: "WARNING",
            lembreteTipo: "ALERTA_ORCAMENTO",
            referenciaId: cat.id,
            referenciaTipo: "CATEGORIA"
          });
        }
      }
    }
  }

  private async processarLimitesCartao(usuarioId: string) {
    const cartoes = await prisma.account.findMany({
      where: { userId: usuarioId, type: "CREDIT_CARD", isActive: true, isDeleted: false, limiteCredito: { gt: 0 } }
    });

    for (const cartao of cartoes) {
      const comprometido = await prisma.transaction.aggregate({
        where: { accountId: cartao.id, userId: usuarioId, status: "PENDING" },
        _sum: { amount: true }
      });

      const total = comprometido._sum.amount || 0;
      const percentual = (total / cartao.limiteCredito!) * 100;

      if (percentual >= 80) {
        const titulo = `Cartão ${cartao.name}: Limite Atingido`;
        const existe = await prisma.lembrete.findFirst({
          where: { usuarioId, titulo, referenciaId: cartao.id }
        });

        if (!existe) {
          await this.notificar(usuarioId, {
            titulo,
            mensagem: `Seu cartão ${cartao.name} está com ${Math.round(percentual)}% do limite comprometido.`,
            tipo: "WARNING",
            lembreteTipo: "ALERTA_LIMITE_CARTAO",
            referenciaId: cartao.id,
            referenciaTipo: "CARTAO"
          });
        }
      }
    }
  }

  private async processarEstoque(usuarioId: string) {
    const itensBaixos = await prisma.estoque.findMany({
      where: { usuarioId, isDeleted: false, quantidade: { lte: 5 } }
    });

    for (const item of itensBaixos) {
      const titulo = `Reposição Necessária: ${item.nome}`;
      const existe = await prisma.lembrete.findFirst({
        where: { 
          usuarioId, 
          tipo: "ALERTA_ESTOQUE", 
          titulo, 
          criadoEm: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        }
      });

      if (!existe) {
        await this.notificar(usuarioId, {
          titulo,
          mensagem: `O item "${item.nome}" está abaixo do estoque mínimo.`,
          tipo: "WARNING",
          lembreteTipo: "ALERTA_ESTOQUE",
          url: "/painel/estoque"
        });
      }
    }
  }
}

export const notificacaoService = new NotificacaoService();
