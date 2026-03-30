import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/biblioteca/prisma";
import { authOptions } from "@/biblioteca/autenticacao";
import { dividaService } from "@/servicos/DividaService";

// PATCH - Registrar pagamento de parcela / Antecipar
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const debt = await prisma.debt.findUnique({
      where: { id: params.id },
      include: { user: { select: { email: true, id: true } } },
    });

    if (!debt || debt.user.email !== session.user.email) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const { tipo, quantidadeParcelas = 1, valorPago } = body;

    const result = await dividaService.registrarPagamento(
      debt.user.id,
      params.id,
      { tipo, quantidadeParcelas, valorPago }
    );

    return NextResponse.json({
      message: result.quitada ? "🎉 Dívida quitada!" : `${quantidadeParcelas} parcela(s) registrada(s)`,
      divida: result.divida,
      economia: result.economia,
      quitada: result.quitada,
      valorPago: result.valorPago,
    });
  } catch (error) {
    console.error("Erro ao pagar parcela:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
