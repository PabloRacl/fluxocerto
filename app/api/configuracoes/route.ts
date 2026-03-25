import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    return NextResponse.json({
      usuario: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        sessionDuration: user.sessionDuration,
        autoLogoutMinutes: user.autoLogoutMinutes,
        darkMode: user.darkMode,
        currency: user.currency,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );

    const body = await request.json();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name !== undefined ? body.name : user.name,
        sessionDuration: body.sessionDuration ?? user.sessionDuration,
        autoLogoutMinutes: body.autoLogoutMinutes ?? user.autoLogoutMinutes,
        darkMode: body.darkMode ?? user.darkMode,
        currency: body.currency ?? user.currency,
        timezone: body.timezone ?? user.timezone,
      },
    });

    return NextResponse.json({
      message: "Configurações atualizadas",
      usuario: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        sessionDuration: updated.sessionDuration,
        autoLogoutMinutes: updated.autoLogoutMinutes,
        darkMode: updated.darkMode,
        currency: updated.currency,
        timezone: updated.timezone,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
