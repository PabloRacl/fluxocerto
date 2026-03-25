import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const params = request.nextUrl.searchParams;
    const mes = parseInt(params.get("mes") || `${new Date().getMonth() + 1}`);
    const ano = parseInt(params.get("ano") || `${new Date().getFullYear()}`);

    const budget = await prisma.budget.findFirst({
      where: { userId: user.id, month: mes, year: ano, isDeleted: false },
    });

    if (!budget) {
      return NextResponse.json({
        budget: null,
        resumo: {
          mes,
          ano,
          globalLimit: 0,
          spentAmount: 0,
          restante: 0,
          percentualGasto: 0,
        },
      });
    }

    const restante = budget.globalLimit - budget.spentAmount;
    const percentualGasto =
      budget.globalLimit > 0
        ? (budget.spentAmount / budget.globalLimit) * 100
        : 0;

    return NextResponse.json({
      budget,
      resumo: {
        mes,
        ano,
        globalLimit: budget.globalLimit,
        spentAmount: budget.spentAmount,
        restante,
        percentualGasto: Math.round(percentualGasto),
        alerta: budget.alertEnabled && percentualGasto >= budget.alertThreshold,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const body = await request.json();
    const {
      month,
      year,
      globalLimit,
      rolloverEnabled,
      rolloverType,
      alertThreshold,
      alertEnabled,
    } = body;

    if (!month || !year || !globalLimit) {
      return NextResponse.json(
        { error: "Mês, ano e limite são obrigatórios" },
        { status: 400 },
      );
    }

    const existing = await prisma.budget.findFirst({
      where: { userId: user.id, month, year, isDeleted: false },
    });

    if (existing) {
      const updated = await prisma.budget.update({
        where: { id: existing.id },
        data: {
          globalLimit: Math.round(globalLimit * 100),
          rolloverEnabled: rolloverEnabled ?? existing.rolloverEnabled,
          rolloverType: rolloverType ?? existing.rolloverType,
          alertThreshold: alertThreshold ?? existing.alertThreshold,
          alertEnabled: alertEnabled ?? existing.alertEnabled,
        },
      });
      return NextResponse.json({
        message: "Orçamento atualizado",
        budget: updated,
      });
    }

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        month,
        year,
        globalLimit: Math.round(globalLimit * 100),
        rolloverEnabled: rolloverEnabled ?? true,
        rolloverType: rolloverType || "NEXT_MONTH",
        alertThreshold: alertThreshold ?? 80,
        alertEnabled: alertEnabled ?? true,
      },
    });

    return NextResponse.json(
      { message: "Orçamento criado", budget },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
