export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/biblioteca/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 },
      );
    }

    if (password.length < 1) {
      return NextResponse.json(
        { error: "A senha não pode estar vazia" },
        { status: 400 },
      );
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Se já tiver senha, não permite definir por aqui (segurança)
    if (existingUser.password) {
      return NextResponse.json(
        { error: "Esta conta já possui uma senha definida. Use a recuperação de senha." },
        { status: 400 },
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atualizar usuário com a nova senha
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "Senha definida com sucesso" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao definir senha:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar sua solicitação" },
      { status: 500 },
    );
  }
}
