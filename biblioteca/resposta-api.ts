import { NextResponse } from "next/server";
import { tratarErro } from "./tratar-erro";

export { tratarErro };

/**
 * Helpers para respostas API padronizadas.
 */

/** Resposta de sucesso (200) */
export function sucesso<T>(dados: T, status = 200) {
  return NextResponse.json(dados, { status });
}

/** Resposta de criação bem-sucedida (201) */
export function criadoComSucesso<T>(dados: T) {
  return NextResponse.json(dados, { status: 201 });
}
