import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso, criadoComSucesso } from "@/biblioteca/resposta-api";
import { schemaCriarAssinatura } from "@/validacoes/assinatura.schema";
import { assinaturaService } from "@/servicos/AssinaturaService";

export const dynamic = "force-dynamic";

// get - listar assinaturas do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const params = request.nextUrl.searchParams;

    const resultado = await assinaturaService.listar(user.id, {
      showDeleted: params.get("showDeleted") === "true",
      ativa: params.get("ativa"),
    });

    return sucesso(resultado);
  } catch (error) {
    return tratarErro(error);
  }
}

// post - criar nova assinatura
export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const dados = schemaCriarAssinatura.parse(body);

    const assinatura = await assinaturaService.criar(user.id, dados);

    return criadoComSucesso({ message: "Assinatura criada", assinatura });
  } catch (error) {
    return tratarErro(error);
  }
}
