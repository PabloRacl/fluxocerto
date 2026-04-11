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
    
    // Passamos diretamente pro serviço (validação optional de date fallsback no serviço)
    const startDate = searchParams.get("startDate") || "default-start";
    const endDate = searchParams.get("endDate") || "default-end";

    const getCachedEvolution = unstable_cache(
      async (userId: string, start?: string, end?: string) => 
        await painelService.obterBalanceEvolution(userId, start === "default-start" ? undefined : start, end === "default-end" ? undefined : end),
      [`evolucao-${user.id}-${startDate}-${endDate}`],
      { tags: [`evolucao-${user.id}`], revalidate: 3600 }
    );

    const evolution = await getCachedEvolution(user.id, startDate, endDate);

    return NextResponse.json({ ok: true, data: evolution });
  } catch (error) {
    return tratarErro(error);
  }
}
