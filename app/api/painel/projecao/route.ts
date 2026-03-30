import { withAuthRoute } from "@/biblioteca/route-wrapper";
import { projecaoService } from "@/servicos/ProjecaoService";
import { NextResponse } from "next/server";

/**
 * API Route: GET /api/painel/projecao
 * Retorna a linha do tempo financeira preditiva do usuário.
 */
export const GET = withAuthRoute(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const dias = parseInt(searchParams.get("dias") || "30");

  const projecao = await projecaoService.gerarProjecao(user.id, dias);

  return NextResponse.json({ ok: true, data: projecao });
});
