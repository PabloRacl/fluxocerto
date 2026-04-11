import { NextRequest, NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { painelService } from "@/servicos/PainelService";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await obterUsuarioAutenticado();
    
    // Phase 2 - Implementação de Cache no Server-Side
    const getCachedResumo = unstable_cache(
      async (userId: string) => await painelService.obterResumoRapido(userId),
      [`resumo-${user.id}`],
      { tags: [`resumo-${user.id}`], revalidate: 3600 }
    );
    
    const resumo = await getCachedResumo(user.id);
    
    return NextResponse.json({ 
      ok: true, 
      data: {
        ...resumo,
        tourStatus: (user as any).tourStatus || "PENDING", // Injetado DENTRO de data para o HttpClient capturar
      },
      meta: { generatedAt: new Date().toISOString() } 
    });
  } catch (error) {
    return tratarErro(error);
  }
}
