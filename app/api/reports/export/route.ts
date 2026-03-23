import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Parser } from "json2csv";

// ============================================
// GET - Exportar Dados (CSV)
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Buscar Usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // 3. Parsear Query Params
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const format = searchParams.get("format") || "csv";

    // 4. Buscar Transações
    const whereClause: any = {
      userId: user.id,
      isDeleted: false,
    };

    if (startDate || endDate) {
      whereClause.occurrenceDate = {};
      if (startDate) whereClause.occurrenceDate.gte = new Date(startDate);
      if (endDate) whereClause.occurrenceDate.lte = new Date(endDate);
    }

    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { occurrenceDate: "desc" },
    });

    // 5. Formatar Dados para Exportação
    const formattedData = transactions.map((t) => ({
      Data: new Date(t.occurrenceDate).toLocaleDateString("pt-BR"),
      Descrição: t.description,
      Tipo: t.type === "INCOME" ? "Receita" : "Despesa",
      Categoria: t.category.name,
      Conta: t.account.name,
      Valor: `R$ ${(t.amount / 100).toFixed(2)}`,
      Status: t.status === "PAID" ? "Pago" : t.status === "PENDING" ? "Pendente" : "Cancelado",
      Observações: t.notes || "",
    }));

    // 6. Exportar CSV
    if (format === "csv") {
      const parser = new Parser({
        fields: ["Data", "Descrição", "Tipo", "Categoria", "Conta", "Valor", "Status", "Observações"],
      });
      const csv = parser.parse(formattedData);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="transacoes_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // 7. Exportar JSON
    return NextResponse.json({
      message: "Exportação realizada com sucesso",
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Erro ao exportar dados:", error);
    return NextResponse.json(
      { error: "Erro interno ao exportar dados" },
      { status: 500 }
    );
  }
}