import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { painelService } from "@/servicos/PainelService";

export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const searchParams = request.nextUrl.searchParams;
    
    // Passamos diretamente pro serviço (validação optional de date fallsback no serviço)
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const evolution = await painelService.obterBalanceEvolution(
      user.id,
      startDate,
      endDate
    );

    return NextResponse.json({ ok: true, data: evolution });
  } catch (error) {
    return tratarErro(error);
  }
}
