export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { painelService } from "@/servicos/PainelService";

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      throw new Error("Datas de início e fim são obrigatórias");
    }

    const expenses = await painelService.obterExpensesByCategory(
      user.id,
      startDate,
      endDate
    );

    return NextResponse.json({ ok: true, data: expenses });
  } catch (error) {
    return tratarErro(error);
  }
}
