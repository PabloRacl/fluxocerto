import { NextResponse } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { prisma } from "@/biblioteca/prisma";

export async function POST(req: Request) {
  try {
    const user = await obterUsuarioAutenticado();
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { tourStatus: status } as any
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json({ error: "Falha ao salvar tour" }, { status: 500 });
  }
}
