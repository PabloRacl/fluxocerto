import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// POST - Gerar notificações automáticas baseadas nos dados do usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { notificationPrefs: true },
    });
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const prefs = user.notificationPrefs;
    const diasAntes = prefs?.dueDateDaysBefore || 3;
    const agora = new Date();
    const notificacoes: any[] = [];

    // 1. Vencimentos de transações pendentes
    if (prefs?.dueDateAlert !== false) {
      const limiteData = new Date(agora);
      limiteData.setDate(limiteData.getDate() + diasAntes);

      const transacoesVencendo = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          status: "PENDING",
          isDeleted: false,
          dueDate: { gte: agora, lte: limiteData },
        },
        include: { category: { select: { name: true } } },
      });

      for (const t of transacoesVencendo) {
        const existente = await prisma.lembrete.findFirst({
          where: {
            usuarioId: user.id,
            referenciaId: t.id,
            referenciaTipo: "TRANSACAO",
          },
        });

        if (!existente) {
          const diasRestantes = Math.ceil(
            (t.dueDate!.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24),
          );
          const lembrete = await prisma.lembrete.create({
            data: {
              usuarioId: user.id,
              titulo: `Vencimento: ${t.description}`,
              mensagem: `${t.category?.name || "Transação"} vence em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}. Valor: R$ ${(t.amount / 100).toFixed(2)}`,
              tipo: "VENCIMENTO_TRANSACAO",
              notificarEm: agora,
              referenciaId: t.id,
              referenciaTipo: "TRANSACAO",
            },
          });
          notificacoes.push(lembrete);
        }
      }
    }

    // 2. Vencimentos de dívidas
    const dividasVencendo = await prisma.debt.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
        isPaidOff: false,
        nextDueDate: {
          gte: agora,
          lte: new Date(agora.getTime() + diasAntes * 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const d of dividasVencendo) {
      const existente = await prisma.lembrete.findFirst({
        where: {
          usuarioId: user.id,
          referenciaId: d.id,
          referenciaTipo: "DIVIDA",
        },
      });

      if (!existente) {
        const diasRestantes = Math.ceil(
          (d.nextDueDate.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24),
        );
        const lembrete = await prisma.lembrete.create({
          data: {
            usuarioId: user.id,
            titulo: `Parcela: ${d.name}`,
            mensagem: `Parcela ${d.installmentPaid + 1}/${d.installmentTotal} vence em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}. Valor: R$ ${(d.installmentValue / 100).toFixed(2)}`,
            tipo: "VENCIMENTO_DIVIDA",
            notificarEm: agora,
            referenciaId: d.id,
            referenciaTipo: "DIVIDA",
          },
        });
        notificacoes.push(lembrete);
      }
    }

    // 3. Renovações de assinaturas
    if (prefs?.dueDateAlert !== false) {
      const assinaturasVencendo = await prisma.assinatura.findMany({
        where: {
          usuarioId: user.id,
          ativa: true,
          excluida: false,
          proximaRenovacao: {
            gte: agora,
            lte: new Date(agora.getTime() + diasAntes * 24 * 60 * 60 * 1000),
          },
        },
      });

      for (const a of assinaturasVencendo) {
        const existente = await prisma.lembrete.findFirst({
          where: {
            usuarioId: user.id,
            referenciaId: a.id,
            referenciaTipo: "ASSINATURA",
          },
        });

        if (!existente) {
          const diasRestantes = Math.ceil(
            (a.proximaRenovacao.getTime() - agora.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const lembrete = await prisma.lembrete.create({
            data: {
              usuarioId: user.id,
              titulo: `Renovação: ${a.nome}`,
              mensagem: `Assinatura renova em ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"}. Valor: R$ ${(a.valor / 100).toFixed(2)}`,
              tipo: "RENOVACAO_ASSINATURA",
              notificarEm: agora,
              referenciaId: a.id,
              referenciaTipo: "ASSINATURA",
            },
          });
          notificacoes.push(lembrete);
        }
      }
    }

    // 4. Alertas de orçamento
    if (prefs?.budgetAlert !== false) {
      const budgets = await prisma.budget.findMany({
        where: { userId: user.id, isDeleted: false },
      });

      for (const budget of budgets) {
        if (budget.alertEnabled && budget.globalLimit > 0) {
          const percentual = Math.round(
            (budget.spentAmount / budget.globalLimit) * 100,
          );
          if (percentual >= budget.alertThreshold) {
            const mesAno = `${budget.month}/${budget.year}`;
            const existente = await prisma.lembrete.findFirst({
              where: {
                usuarioId: user.id,
                titulo: { contains: mesAno },
                tipo: "ALERTA_ORCAMENTO",
              },
            });

            if (!existente) {
              const lembrete = await prisma.lembrete.create({
                data: {
                  usuarioId: user.id,
                  titulo: `Orçamento de ${mesAno}: ${percentual}% utilizado`,
                  mensagem: `Você já gastou ${percentual}% do seu orçamento mensal. Limite: R$ ${(budget.globalLimit / 100).toFixed(2)}, Gasto: R$ ${(budget.spentAmount / 100).toFixed(2)}`,
                  tipo: "ALERTA_ORCAMENTO",
                  notificarEm: agora,
                  referenciaId: budget.id,
                  referenciaTipo: "ORCAMENTO",
                },
              });
              notificacoes.push(lembrete);
            }
          }
        }
      }
    }

    // 5. Alertas de limite de cartão
    const cartoes = await prisma.account.findMany({
      where: {
        userId: user.id,
        type: "CREDIT_CARD",
        isActive: true,
        isDeleted: false,
        limiteCredito: { gt: 0 },
      },
    });

    for (const cartao of cartoes) {
      const comprometido = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          accountId: cartao.id,
          isDeleted: false,
        },
        _sum: { amount: true },
      });

      const total = comprometido._sum.amount || 0;
      const percentualUsado = Math.round((total / cartao.limiteCredito!) * 100);

      if (percentualUsado >= 80) {
        const existente = await prisma.lembrete.findFirst({
          where: {
            usuarioId: user.id,
            referenciaId: cartao.id,
            referenciaTipo: "CARTAO",
            tipo: "ALERTA_LIMITE_CARTAO",
          },
        });

        if (!existente) {
          const lembrete = await prisma.lembrete.create({
            data: {
              usuarioId: user.id,
              titulo: `Limite do cartão ${cartao.name}: ${percentualUsado}% usado`,
              mensagem: `Seu cartão ${cartao.name} está com ${percentualUsado}% do limite utilizado. Disponível: R$ ${((cartao.limiteCredito! - total) / 100).toFixed(2)}`,
              tipo: "ALERTA_LIMITE_CARTAO",
              notificarEm: agora,
              referenciaId: cartao.id,
              referenciaTipo: "CARTAO",
            },
          });
          notificacoes.push(lembrete);
        }
      }
    }

    return NextResponse.json({
      message: `${notificacoes.length} notificação(ões) gerada(s)`,
      notificacoes,
    });
  } catch (error) {
    console.error("Erro ao gerar notificações:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
