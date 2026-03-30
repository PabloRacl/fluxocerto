import { withAuthRoute } from "@/biblioteca/route-wrapper";
import { assetService } from "@/servicos/AssetService";
import { schemaAtualizarAsset } from "@/validacoes/asset.schema";
import { NextResponse } from "next/server";
import { prisma } from "@/biblioteca/prisma";

/**
 * API: /api/patrimonio/[id]
 * CRUD de detalhe para um bem específico.
 */
export const GET = withAuthRoute(async (req, user, { params }) => {
  const asset = await prisma.asset.findFirst({
    where: { id: params?.id as string, usuarioId: user.id }
  });

  if (!asset) return NextResponse.json({ error: "Ativo não encontrado" }, { status: 404 });
  return NextResponse.json(asset);
});

export const PATCH = withAuthRoute(async (req, user, { params }) => {
  const body = await req.json();
  const validado = schemaAtualizarAsset.parse(body);

  const asset = await assetService.atualizar(params?.id as string, user.id, validado);
  return NextResponse.json(asset);
});

export const DELETE = withAuthRoute(async (req, user, { params }) => {
  // Soft delete P2 style
  await assetService.arquivar(params?.id as string, user.id);
  return NextResponse.json({ success: true, message: "Ativo movido para a lixeira" });
});
