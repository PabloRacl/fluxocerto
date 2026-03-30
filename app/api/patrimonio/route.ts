import { withAuthRoute } from "@/biblioteca/route-wrapper";
import { assetService } from "@/servicos/AssetService";
import { schemaCriarAsset } from "@/validacoes/asset.schema";
import { NextResponse } from "next/server";

/**
 * API: /api/patrimonio
 * Lista bens do usuário ou cria um novo.
 */
export const GET = withAuthRoute(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("arquivados") === "true";

  const data = await assetService.listar(user.id, includeArchived);
  return NextResponse.json(data);
});

export const POST = withAuthRoute(async (req, user) => {
  const body = await req.json();
  const validado = schemaCriarAsset.parse(body);

  const asset = await assetService.criar(user.id, validado);
  return NextResponse.json(asset, { status: 201 });
});
