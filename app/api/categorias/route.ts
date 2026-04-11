export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso, criadoComSucesso } from "@/biblioteca/resposta-api";
import { schemaCriarCategoria } from "@/validacoes/categoria.schema";
import { categoriaService } from "@/servicos/CategoriaService";

// get - listar categorias do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const params = request.nextUrl.searchParams;

    const categorias = await categoriaService.listar(user.id, {
      type: params.get("type"),
      includeInactive: params.get("includeInactive") === "true",
      showArchived: params.get("showArchived") === "true",
    });

    return sucesso(categorias);
  } catch (error) {
    return tratarErro(error);
  }
}

// post - criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const dados = schemaCriarCategoria.parse(body);

    const category = await categoriaService.criar(user.id, dados);

    return criadoComSucesso({
      message: "Categoria criada com sucesso",
      category,
    });
  } catch (error) {
    return tratarErro(error);
  }
}
