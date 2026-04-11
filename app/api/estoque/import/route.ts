import { NextRequest, NextResponse } from "next/server";

/**
 * Redirecionador ou Wrapper para importação de estoque via OCR.
 * Centraliza o acesso conforme planejado na Fase 2.
 */
export async function POST(request: NextRequest) {
  // Simplesmente delega para o serviço de importação de imagem/OCR já implementado
  return NextResponse.redirect(new URL("/api/compras/importar-imagem", request.url), { status: 307 });
}
