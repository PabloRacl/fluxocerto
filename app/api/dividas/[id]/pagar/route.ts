import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// PATCH - Registrar pagamento de parcela / Antecipar
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const debt = await prisma.debt.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true } } },
    });

    if (!debt || debt.user.email !== session.user.email) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { tipo, quantidadeParcelas = 1, valorPago } = body;
    // tipo: "PAGAR_PARCELA" | "ANTECIPAR"

    const novasPagas = debt.installmentPaid + quantidadeParcelas;
    const quitada = novasPagas >= debt.installmentTotal;

    // Calcular próximo vencimento
    const proximoVencimento = new Date(debt.nextDueDate);
    proximoVencimento.setMonth(proximoVencimento.getMonth() + quantidadeParcelas);

    // Calcular economia se antecipação
    let economia = 0;
    if (tipo === "ANTECIPAR" && debt.interestRate) {
      const taxaMensal = Number(debt.interestRate) / 100;
      const saldoRestante = debt.totalAmount - (debt.installmentValue * debt.installmentPaid);
      const jurosEconomizados = Math.round(saldoRestante * taxaMensal * quantidadeParcelas);
      economia = jurosEconomizados;
    }

    const updated = await prisma.debt.update({
      where: { id: params.id },
      data: {
        installmentPaid: novasPagas,
        isPaidOff: quitada,
        paidOffAt: quitada ? new Date() : null,
        status: quitada ? "PAID" : "ACTIVE",
        nextDueDate: quitada ? debt.nextDueDate : proximoVencimento,
      },
    });

    return NextResponse.json({
      message: quitada ? "🎉 Dívida quitada!" : `${quantidadeParcelas} parcela(s) registrada(s)`,
      divida: updated,
      economia,
      quitada,
    });
  } catch (error) {
    console.error("Erro ao pagar parcela:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
