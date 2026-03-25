export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// ============================================
// GET - Exportar Transações em CSV
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Buscar Usuário
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

    // 4. Calcular Período (prioridade: data customizada > preset > mês/ano)
    let dataInicio: Date;
    let dataFim: Date;
    let nomePeriodo: string;

    if (dataInicioParam && dataFimParam) {
      // Período customizado
      dataInicio = new Date(dataInicioParam);
      dataFim = new Date(dataFimParam);
      nomePeriodo = `${format(dataInicio, "dd/MM/yyyy")} a ${format(dataFim, "dd/MM/yyyy")}`;
    } else if (periodoParam) {
      // Presets de período
      switch (periodoParam) {
        case "ULTIMOS_3_MESES":
          dataInicio = startOfMonth(subMonths(agora, 2));
          dataFim = endOfMonth(agora);
          nomePeriodo = "Últimos 3 Meses";
          break;
        case "SEMESTRAL":
          dataInicio = startOfMonth(subMonths(agora, 5));
          dataFim = endOfMonth(agora);
          nomePeriodo = "Últimos 6 Meses";
          break;
        case "ANUAL":
          dataInicio = startOfYear(agora);
          dataFim = endOfYear(agora);
          nomePeriodo = `Ano ${agora.getFullYear()}`;
          break;
        default:
          dataInicio = startOfMonth(agora);
          dataFim = endOfMonth(agora);
          nomePeriodo = format(agora, "MMMM yyyy", { locale: ptBR });
      }
    } else if (mesParam && anoParam) {
      // Mês e ano específicos
      const mes = parseInt(mesParam);
      const ano = parseInt(anoParam);
      dataInicio = startOfMonth(new Date(ano, mes - 1, 1));
      dataFim = endOfMonth(new Date(ano, mes - 1, 1));
      nomePeriodo = format(dataInicio, "MMMM yyyy", { locale: ptBR });
    } else {
      // Default: mês atual
      dataInicio = startOfMonth(agora);
      dataFim = endOfMonth(agora);
      nomePeriodo = format(agora, "MMMM yyyy", { locale: ptBR });
    }

    // 5. Buscar Transações do Período
    const where: any = {
      userId: usuario.id,
      status: "PAID",
      isDeleted: false,
      occurrenceDate: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    // Filtros opcionais
    if (tipoParam && tipoParam !== "ALL") {
      where.type = tipoParam;
    }
    if (contaIdParam) {
      where.accountId = contaIdParam;
    }
    if (categoriaIdParam) {
      where.categoryId = categoriaIdParam;
    }

    const transacoes = await prisma.transaction.findMany({
      where,
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
      orderBy: {
        occurrenceDate: "asc",
      },
    });

    // 6. Calcular Resumo para o Relatório
    const totalReceitas = transacoes
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDespesas = transacoes
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const saldo = totalReceitas - totalDespesas;

    // 7. Formatar Dados para CSV
    const bom = "\uFEFF"; // BOM UTF-8 para Excel reconhecer acentos (BUG-001)
    const cabecalho = [
      "Data",
      "Descrição",
      "Categoria",
      "Tipo",
      "Conta",
      "Status",
      "Valor",
      "Observações",
    ];

    const linhas = transacoes.map((t) => [
      formatarData(t.occurrenceDate),
      escapeCSV(t.description),
      escapeCSV(t.category?.name || "Sem categoria"),
      t.type === "INCOME" ? "Receita" : "Despesa",
      escapeCSV(t.account?.name || "Sem conta"),
      formatarStatus(t.status),
      formatarMoeda(t.amount),
      escapeCSV(t.notes || ""),
    ]);

    // Adicionar linha de resumo no final
    linhas.push([]);
    linhas.push(["RESUMO DO PERÍODO", "", "", "", "", "", "", ""]);
    linhas.push([
      "Total Receitas",
      "",
      "",
      "",
      "",
      "",
      formatarMoeda(totalReceitas),
      "",
    ]);
    linhas.push([
      "Total Despesas",
      "",
      "",
      "",
      "",
      "",
      formatarMoeda(totalDespesas),
      "",
    ]);
    linhas.push(["Saldo", "", "", "", "", "", formatarMoeda(saldo), ""]);
    linhas.push(["Período", "", "", "", "", "", nomePeriodo, ""]);
    linhas.push([
      "Total Transações",
      "",
      "",
      "",
      "",
      "",
      transacoes.length.toString(),
      "",
    ]);

    // 8. Montar Conteúdo CSV
    const conteudoCSV =
      bom +
      [cabecalho.join(";"), ...linhas.map((linha) => linha.join(";"))].join(
        "\n",
      );

    // 9. Gerar Nome do Arquivo
    const tipoArquivo =
      tipoParam === "ALL"
        ? "completo"
        : tipoParam === "INCOME"
          ? "receitas"
          : "despesas";
    const nomeArquivo = `fluxocerto-${tipoArquivo}-${nomePeriodo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()}.csv`;

    // 10. Retornar Resposta
    return new NextResponse(conteudoCSV, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar exportação" },
      { status: 500 },
    );
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Formatar data para padrão brasileiro DD/MM/YYYY
 */
function formatarData(data: Date): string {
  return format(data, "dd/MM/yyyy");
}

/**
 * Formatar valor em centavos para padrão brasileiro R$ 1.000,00
 */
function formatarMoeda(valorEmCentavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorEmCentavos / 100);
}

/**
 * Formatar status para português
 */
function formatarStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PAID: "Pago",
    PENDING: "Pendente",
    CANCELLED: "Cancelado",
  };
  return statusMap[status] || status;
}

/**
 * Escape de campos CSV para evitar quebra de formato
 * - Envolve em aspas duplas se tiver vírgula, aspas ou quebra de linha
 * - Escapa aspas duplas internas duplicando-as
 */
function escapeCSV(campo: string): string {
  if (!campo) return '""';

  const precisaAspas = /[",\n\r]/.test(campo);

  if (precisaAspas) {
    const escapado = campo.replace(/"/g, '""');
    return `"${escapado}"`;
  }

  return campo;
}
