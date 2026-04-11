export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { painelService } from "@/servicos/PainelService";
import { unstable_cache } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Fallback inteligente para o mês atual caso os parâmetros não venham na requisição inicial
    const dataAtual = new Date();
    const defaultStart = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1).toISOString();
    const defaultEnd = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const finalStartDate = startDate || defaultStart;
    const finalEndDate = endDate || defaultEnd;

    const getCachedExpenses = unstable_cache(
      async (userId: string, start: string, end: string) => 
        await painelService.obterExpensesByCategory(userId, start, end),
      [`categorias-${user.id}-${finalStartDate}-${finalEndDate}`],
      { tags: [`categorias-${user.id}`], revalidate: 3600 }
    );

    const expenses = await getCachedExpenses(user.id, finalStartDate, finalEndDate);

    return NextResponse.json({ ok: true, data: expenses });
  } catch (error) {
    return tratarErro(error);
  }
}
