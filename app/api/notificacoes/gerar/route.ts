import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";
import { notificacaoService } from "@/servicos/NotificacaoService";

// POST - Gerar notificações automáticas baseadas nos dados do usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await (prisma as any).user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // O serviço agora encapsula toda a lógica financeira e de estoque
    await notificacaoService.processarTriggers(user.id);

    return NextResponse.json({
      message: "Processamento de notificações e proatividade concluído com sucesso.",
      ok: true
    });
  } catch (error) {
    console.error("Erro ao gerar notificações:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
