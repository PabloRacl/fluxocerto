export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// ============================================
// GET - Detalhe da Dívida
// ============================================
export async function GET(
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
      include: {
        user: { select: { email: true } },
        account: { select: { id: true, name: true, color: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });

    if (!debt || debt.user.email !== session.user.email) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 });
    }

    // Calcular tabela de amortização
    const parcelas = [];
    let saldoDevedor = debt.totalAmount;
    const taxaMensal = debt.interestRate ? Number(debt.interestRate) / 100 : 0;

    for (let i = 1; i <= debt.installmentTotal; i++) {
      const juros = Math.round(saldoDevedor * taxaMensal);
      let amortizacao = 0;
      let prestacao = 0;

      if (debt.amortizationType === "SAC") {
        amortizacao = Math.round(debt.totalAmount / debt.installmentTotal);
        prestacao = amortizacao + juros;
      } else if (debt.amortizationType === "PRICE") {
        if (taxaMensal > 0) {
          prestacao = Math.round(debt.totalAmount * (taxaMensal * Math.pow(1 + taxaMensal, debt.installmentTotal)) / (Math.pow(1 + taxaMensal, debt.installmentTotal) - 1));
        } else {
          prestacao = Math.round(debt.totalAmount / debt.installmentTotal);
        }
        amortizacao = prestacao - juros;
      } else {
        // FIXED
        prestacao = debt.installmentValue;
        amortizacao = prestacao - juros;
      }

      saldoDevedor = Math.max(0, saldoDevedor - amortizacao);

      parcelas.push({
        numero: i,
        prestacao,
        amortizacao,
        juros,
        saldoDevedor,
        paga: i <= debt.installmentPaid,
      });
    }

    const totalJuros = parcelas.reduce((acc, p) => acc + p.juros, 0);
    const totalPago = parcelas.filter((p) => p.paga).reduce((acc, p) => acc + p.prestacao, 0);
    const totalRestante = parcelas.filter((p) => !p.paga).reduce((acc, p) => acc + p.prestacao, 0);

    return NextResponse.json({
      divida: debt,
      parcelas,
      resumo: {
        totalJuros,
        totalPago,
        totalRestante,
        parcelasRestantes: debt.installmentTotal - debt.installmentPaid,
        progresso: Math.round((debt.installmentPaid / debt.installmentTotal) * 100),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dívida:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ============================================
// PUT - Atualizar Dívida
// ============================================
export async function PUT(
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

    const updated = await prisma.debt.update({
      where: { id: params.id },
      data: {
        name: body.name ?? debt.name,
        totalAmount: body.totalAmount ?? debt.totalAmount,
        installmentValue: body.installmentValue ?? debt.installmentValue,
        installmentTotal: body.installmentTotal ?? debt.installmentTotal,
        installmentPaid: body.installmentPaid ?? debt.installmentPaid,
        interestRate: body.interestRate !== undefined ? body.interestRate : debt.interestRate,
        amortizationType: body.amortizationType ?? debt.amortizationType,
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : debt.nextDueDate,
        creditor: body.creditor !== undefined ? body.creditor : debt.creditor,
        allowsPrepayment: body.allowsPrepayment ?? debt.allowsPrepayment,
      },
    });

    return NextResponse.json({ message: "Dívida atualizada", divida: updated });
  } catch (error) {
    console.error("Erro ao atualizar dívida:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ============================================
// PATCH - Atualizar Parcialmente a Dívida (Frontend Edit)
// ============================================
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

    const updated = await prisma.debt.update({
      where: { id: params.id },
      data: {
        name: body.name ?? undefined,
        totalAmount: body.totalAmount ?? undefined,
        installmentValue: body.installmentValue ?? undefined,
        installmentTotal: body.installmentTotal ?? undefined,
        installmentPaid: body.installmentPaid !== undefined ? body.installmentPaid : undefined,
        interestRate: body.interestRate !== undefined ? body.interestRate : undefined,
        amortizationType: body.amortizationType !== undefined ? body.amortizationType : undefined,
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : undefined,
        creditor: body.creditor !== undefined ? body.creditor : undefined,
        allowsPrepayment: body.allowsPrepayment !== undefined ? body.allowsPrepayment : undefined,
        accountId: body.accountId ?? undefined,
        categoryId: body.categoryId ?? undefined,
      },
    });

    return NextResponse.json({ message: "Dívida atualizada", divida: updated });
  } catch (error) {
    console.error("Erro ao atualizar via PATCH:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar" }, { status: 500 });
  }
}

// ============================================
// DELETE - Soft Delete da Dívida
// ============================================
export async function DELETE(
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

    await prisma.debt.update({
      where: { id: params.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Dívida enviada para lixeira" });
  } catch (error) {
    console.error("Erro ao excluir dívida:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
