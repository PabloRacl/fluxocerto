import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/biblioteca/autenticacao";
import prisma from "@/biblioteca/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { senhaAtual, novaSenha } = await req.json();

    if (!senhaAtual || !novaSenha || novaSenha.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (!usuario.password) {
      return NextResponse.json({ error: "Você acessa via Google OAuth. Não é possível alterar a senha." }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(senhaAtual, usuario.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: "A senha atual está incorreta." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Senha atualizada com sucesso no banco de dados." });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return NextResponse.json({ error: "Falha na comunicação com o banco." }, { status: 500 });
  }
}
