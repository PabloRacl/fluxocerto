import { withAuthRoute } from "@/biblioteca/route-wrapper";
import { insightService } from "@/servicos/InsightService";
import { NextResponse } from "next/server";

/**
 * API: /api/painel/insights
 * Retorna o diagnóstico de saúde financeira e sugestões inteligentes.
 */
export const GET = withAuthRoute(async (req, user) => {
  const saude = await insightService.calcularSaudeFinanceira(user.id);
  return NextResponse.json({ ok: true, data: saude });
});
