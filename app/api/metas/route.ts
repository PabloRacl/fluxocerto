export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso, criadoComSucesso } from "@/biblioteca/resposta-api";
import { schemaCriarMeta } from "@/validacoes/meta.schema";
import { metaService } from "@/servicos/MetaService";

// get - listar metas do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const showDeleted =
      request.nextUrl.searchParams.get("showDeleted") === "true";

    const resultado = await metaService.listar(user.id, showDeleted);

    return sucesso(resultado);
  } catch (error) {
    return tratarErro(error);
  }
}

// post - criar nova meta
export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const dados = schemaCriarMeta.parse(body);

    const meta = await metaService.criar(user.id, dados);

    return criadoComSucesso({ message: "Meta criada com sucesso", meta });
  } catch (error) {
    return tratarErro(error);
  }
}
