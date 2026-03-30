import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/biblioteca/prisma";
import { notificacaoService } from "@/servicos/NotificacaoService";
import { withAuthRoute } from "@/biblioteca/route-wrapper";

const bodySchema = z
  .object({
    action: z.enum(["subscribe", "read"]),
    id: z.string().optional(),
    subscription: z.unknown().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.action === "read" && !val.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Campo `id` é obrigatório para action 'read'.",
        path: ["id"],
      });
    }
    if (val.action === "subscribe" && !val.subscription) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Campo `subscription` é obrigatório para action 'subscribe'.",
        path: ["subscription"],
      });
    }
  });

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
  marcarTodas: z.boolean().optional(),
});

/**
 * API de Notificações (P14) - Fix: UUID Integrity
 */
export const GET = withAuthRoute(async (_req, user) => {
  // Compat com o front: suporta filtro via query param.
  const req = _req; // alias apenas para clareza
  const apenasNaoLidas = req.nextUrl.searchParams.get("apenasNaoLidas") === "true";

  const where = {
    usuarioId: user.id,
    ...(apenasNaoLidas ? { lido: false } : {}),
  };

  const [notificacoes, naoLidas] = await Promise.all([
    prisma.lembrete.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      take: 20,
    }),
    apenasNaoLidas
      ? Promise.resolve(0)
      : prisma.lembrete.count({ where: { usuarioId: user.id, lido: false } }),
  ]);

  return NextResponse.json({ ok: true, data: { notificacoes, naoLidas } });
});

export const POST = withAuthRoute(async (req, user) => {
  const parsed = bodySchema.parse(await req.json());

  if (parsed.action === "subscribe") {
    await notificacaoService.salvarSubscricao(user.id, parsed.subscription);
    return NextResponse.json({ success: true });
  }

  if (parsed.action === "read") {
    const result = await prisma.lembrete.updateMany({
      where: { id: parsed.id, usuarioId: user.id },
      data: { lido: true, lidoEm: new Date() },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});

export const PATCH = withAuthRoute(async (req, user) => {
  const parsed = patchSchema.parse(await req.json());
  const body = parsed as z.infer<typeof patchSchema>;

  const now = new Date();

  if (body.marcarTodas) {
    await prisma.lembrete.updateMany({
      where: { usuarioId: user.id },
      data: { lido: true, lidoEm: now },
    });
    return NextResponse.json({ success: true });
  }

  if (body.ids && body.ids.length > 0) {
    await prisma.lembrete.updateMany({
      where: { usuarioId: user.id, id: { in: body.ids } },
      data: { lido: true, lidoEm: now },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Body inválido" }, { status: 400 });
});
