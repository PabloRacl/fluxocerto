import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/biblioteca/prisma";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";

export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    if (!user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { type } = await request.json();

    if (!type) {
      return NextResponse.json({ error: "Tipo de reset não especificado" }, { status: 400 });
    }

    switch (type) {
      case "mappings":
        // Limpar apenas mapeamentos de notas fiscais
        await (prisma as any).itemImportMapping.deleteMany({
          where: { userId: user.id }
        });
        return NextResponse.json({ message: "Mapeamentos neurais resetados com sucesso." });

      case "transactions":
        // Limpar transações (mantendo as contas e categorias)
        await (prisma as any).transaction.deleteMany({
          where: { userId: user.id }
        });
        return NextResponse.json({ message: "Histórico de transações limpo com sucesso." });

      case "metas":
        // Limpar metas e objetivos
        await (prisma as any).meta.deleteMany({
          where: { usuarioId: user.id }
        });
        return NextResponse.json({ message: "Metas e objetivos resetados com sucesso." });

      case "full_account_delete":
        // EXCLUSÃO TOTAL - O Prisma Cascade cuidará da maioria das relações
        await (prisma as any).user.delete({
          where: { id: user.id }
        });
        return NextResponse.json({ message: "Sua conta e todos os dados foram removidos permanentemente." });

      default:
        return NextResponse.json({ error: "Tipo de reset inválido" }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro no reset de dados:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação de limpeza de dados" },
      { status: 500 }
    );
  }
}
