export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso, criadoComSucesso } from "@/biblioteca/resposta-api";
import { schemaCriarDivida } from "@/validacoes/divida.schema";
import { dividaService } from "@/servicos/DividaService";

// get - listar dívidas do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const params = request.nextUrl.searchParams;

    const resultado = await dividaService.listar(user.id, {
      status: params.get("status"),
      showDeleted: params.get("showDeleted") === "true",
    });

    return sucesso(resultado);
  } catch (error) {
    return tratarErro(error);
  }
}

// post - criar nova dívida
export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const dados = schemaCriarDivida.parse(body);

    const divida = await dividaService.criar(user.id, dados);

    return criadoComSucesso({
      message: "Dívida criada com sucesso",
      divida,
    });
  } catch (error) {
    return tratarErro(error);
  }
}
