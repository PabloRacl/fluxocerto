export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { painelService } from "@/servicos/PainelService";
import { unstable_cache } from "next/cache";

// get - gamificação e medalhas
export async function GET() {
  try {
    const user = await obterUsuarioAutenticado();

    const getCachedGamificacao = unstable_cache(
      async (userId: string) => await painelService.obterGamificacao(userId),
      [`gamificacao-${user.id}`],
      { tags: [`gamificacao-${user.id}`], revalidate: 3600 }
    );

    const gamificacao = await getCachedGamificacao(user.id);

    return NextResponse.json({ ok: true, data: gamificacao });
  } catch (error) {
    return tratarErro(error);
  }
}
