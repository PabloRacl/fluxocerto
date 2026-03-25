// app/api/relatorios/exportar-pdf/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { pdf } from "@react-pdf/renderer";
import { RelatorioPDF } from "@/componentes/pdf/RelatorioPDF";

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Buscar usuário
    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // 3. Parsear Query Params
    const searchParams = request.nextUrl.searchParams;
    const mesParam = searchParams.get("mes");
    const anoParam = searchParams.get("ano");
    const tipoParam = searchParams.get("tipo") || "ALL";
    const contaIdParam = searchParams.get("contaId");
    const categoriaIdParam = searchParams.get("categoriaId");
    const dataInicioParam = searchParams.get("dataInicio");
    const dataFimParam = searchParams.get("dataFim");
    const periodoParam = searchParams.get("periodo");

    const agora = new Date();
    let dataInicio: Date;
    let dataFim: Date;
    let nomePeriodo: string;

    // 4. Calcular Período
    if (dataInicioParam && dataFimParam) {
      dataInicio = new Date(dataInicioParam);
      dataFim = new Date(dataFimParam);
      nomePeriodo = `${format(dataInicio, "dd/MM/yyyy")} a ${format(dataFim, "dd/MM/yyyy")}`;
    } else if (periodoParam) {
      switch (periodoParam) {
        case "ULTIMOS_3_MESES":
          dataInicio = startOfMonth(
            new Date(agora.getFullYear(), agora.getMonth() - 2, 1),
          );
          dataFim = endOfMonth(agora);
          nomePeriodo = "Últimos 3 Meses";
          break;
        case "SEMESTRAL":
          dataInicio = startOfMonth(
            new Date(agora.getFullYear(), agora.getMonth() - 5, 1),
          );
          dataFim = endOfMonth(agora);
          nomePeriodo = "Últimos 6 Meses";
          break;
        case "ANUAL":
          dataInicio = new Date(agora.getFullYear(), 0, 1);
          dataFim = new Date(agora.getFullYear(), 11, 31);
          nomePeriodo = `Ano ${agora.getFullYear()}`;
          break;
        default:
          dataInicio = startOfMonth(agora);
          dataFim = endOfMonth(agora);
          nomePeriodo = format(agora, "MMMM yyyy", { locale: ptBR });
      }
    } else if (mesParam && anoParam) {
      const mes = parseInt(mesParam);
      const ano = parseInt(anoParam);
      dataInicio = startOfMonth(new Date(ano, mes - 1, 1));
      dataFim = endOfMonth(new Date(ano, mes - 1, 1));
      nomePeriodo = format(dataInicio, "MMMM yyyy", { locale: ptBR });
    } else {
      dataInicio = startOfMonth(agora);
      dataFim = endOfMonth(agora);
      nomePeriodo = format(agora, "MMMM yyyy", { locale: ptBR });
    }

    // 5. Buscar Transações
    const where: any = {
      userId: usuario.id,
      status: "PAID",
      isDeleted: false,
      occurrenceDate: { gte: dataInicio, lte: dataFim },
    };
    if (tipoParam && tipoParam !== "ALL") where.type = tipoParam;
    if (contaIdParam) where.accountId = contaIdParam;
    if (categoriaIdParam) where.categoryId = categoriaIdParam;

    const transacoes = await prisma.transaction.findMany({
      where,
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
      orderBy: { occurrenceDate: "asc" },
    });

    // 6. Gerar PDF - USANDO COMPONENTE IMPORTADO (SEM JSX DIRETO)
    const pdfBuffer = await pdf(
      RelatorioPDF({
        dados: transacoes,
        periodo: nomePeriodo,
        filtros: {
          tipo: tipoParam !== "ALL" ? tipoParam : undefined,
          conta: contaIdParam || undefined,
          categoria: categoriaIdParam || undefined,
        },
      }),
    ).toBuffer();

    // 7. Nome do arquivo
    const nomeArquivo = `relatorio-fluxocerto-${nomePeriodo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()}.pdf`;

    // 8. Retornar resposta
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar PDF" },
      { status: 500 },
    );
  }
}
