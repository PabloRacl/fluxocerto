import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ErroAutenticacao } from "./obter-usuario-autenticado";
import { ApiError } from "./erros-customizados";

/**
 * Tratamento centralizado de erros para route handlers.
 */
export function tratarErro(erro: unknown): NextResponse {
  // Log apenas em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.error("Erro no servidor:", erro);
  }

  // Tratamento Nativo de ApiError (Substitui Returns 404 manuais)
  if (erro instanceof ApiError) {
    return NextResponse.json(
      { error: erro.message },
      { status: erro.statusCode },
    );
  }

  // Erro de autenticação customizado
  if (erro instanceof ErroAutenticacao) {
    return NextResponse.json(
      { error: erro.message },
      { status: erro.statusCode },
    );
  }

  // Erro de validação Zod
  if (erro instanceof ZodError) {
    const detalhes = erro.errors.map((e) => e.message).join(", ");
    return NextResponse.json(
      { error: "Dados inválidos fornecidos", detalhes },
      { status: 400 },
    );
  }

  // Erros conhecidos do Prisma
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    switch (erro.code) {
      case "P2025": // Registro não encontrado
        return NextResponse.json(
          { error: "Registro não encontrado" },
          { status: 404 },
        );
      case "P2002": // Violação de unicidade
        return NextResponse.json(
          { error: "Registro já existe com esses dados" },
          { status: 409 },
        );
      default:
        return NextResponse.json(
          { error: "Erro ao acessar o banco de dados" },
          { status: 503 },
        );
    }
  }

  // Erro genérico — não expõe detalhes em produção
  return NextResponse.json(
    { error: "Ocorreu um erro interno no servidor" },
    { status: 500 },
  );
}
