import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

// ============================================
// GET - Listar Compras
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const params = request.nextUrl.searchParams;
    const showDeleted = params.get("showDeleted") === "true";
    const loja = params.get("loja");
    const mes = params.get("mes"); // YYYY-MM

    const where: any = { userId: user.id, isDeleted: showDeleted };
    if (loja) where.storeName = { contains: loja, mode: "insensitive" };

    if (mes) {
      const [ano, mesNum] = mes.split("-").map(Number);
      const inicio = new Date(ano, mesNum - 1, 1);
      const fim = new Date(ano, mesNum, 0, 23, 59, 59);
      where.purchaseDate = { gte: inicio, lte: fim };
    }

    const compras = await prisma.purchase.findMany({
      where,
      include: {
        items: { orderBy: { createdAt: "asc" } },
        category: { select: { id: true, name: true, color: true } },
        account: { select: { id: true, name: true, color: true } },
      },
      orderBy: { purchaseDate: "desc" },
    });

    // Resumo
    const ativas = compras.filter((c) => !c.isDeleted);
    const totalMes = ativas.reduce((acc, c) => acc + c.totalAmount, 0);
    const ticketMedio = ativas.length > 0 ? Math.round(totalMes / ativas.length) : 0;
    const maiorCompra = ativas.length > 0 ? Math.max(...ativas.map((c) => c.totalAmount)) : 0;

    return NextResponse.json({
      compras,
      resumo: {
        totalMes,
        ticketMedio,
        maiorCompra,
        totalCompras: ativas.length,
      },
    });
  } catch (error) {
    console.error("Erro ao listar compras:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ============================================
// POST - Criar Nova Compra (com itens + transação automática)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const body = await request.json();
    const {
      description,
      totalAmount,
      purchaseDate,
      storeName,
      paymentMethod,
      accountId,
      categoryId,
      items = [],
      isInstallment = false,
      installmentTotal,
      installmentValue,
      gerarTransacao = true,
    } = body;

    if (!description || !totalAmount || !purchaseDate || !paymentMethod) {
      return NextResponse.json({
        error: "Campos obrigatórios: descrição, valor total, data e forma de pagamento",
      }, { status: 400 });
    }

    // Calcular total dos itens (se informados)
    const totalItens = items.length > 0
      ? items.reduce((acc: number, item: any) => acc + Math.round(item.quantity * item.unitPrice * 100), 0)
      : totalAmount;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar compra
      const compra = await tx.purchase.create({
        data: {
          userId: user.id,
          description,
          totalAmount: totalItens || totalAmount,
          purchaseDate: new Date(purchaseDate),
          storeName: storeName || null,
          paymentMethod,
          accountId: accountId || null,
          categoryId: categoryId || null,
          isInstallment,
          installmentTotal: isInstallment ? installmentTotal : null,
          installmentValue: isInstallment ? installmentValue : null,
        },
      });

      // 2. Criar itens (se houver)
      if (items.length > 0) {
        await tx.purchaseItem.createMany({
          data: items.map((item: any) => ({
            purchaseId: compra.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || null,
            unitPrice: Math.round(item.unitPrice * 100),
            totalPrice: Math.round(item.quantity * item.unitPrice * 100),
            category: item.category || null,
            barcode: item.barcode || null,
          })),
        });
      }

      // 3. Gerar transação financeira automática
      let transacao = null;
      if (gerarTransacao && accountId && categoryId) {
        transacao = await tx.transaction.create({
          data: {
            userId: user.id,
            accountId,
            categoryId,
            description: `Compra: ${description}${storeName ? ` - ${storeName}` : ""}`,
            amount: totalItens || totalAmount,
            type: "EXPENSE",
            status: "PAID",
            occurrenceDate: new Date(purchaseDate),
            paidAt: new Date(purchaseDate),
            isInstallment,
            installmentTotal: isInstallment ? installmentTotal : null,
            installmentCurrent: isInstallment ? 1 : null,
            transactionId: compra.id,
          },
        });

        // 4. Atualizar saldo da conta
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: totalItens || totalAmount } },
        });
      }

      return { compra, transacao };
    });

    return NextResponse.json({
      message: "Compra registrada com sucesso",
      compra: result.compra,
      transacao: result.transacao,
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar compra:", error);
    return NextResponse.json({ error: "Erro interno ao criar compra" }, { status: 500 });
  }
}
