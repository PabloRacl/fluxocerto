import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso, criadoComSucesso } from "@/biblioteca/resposta-api";
import { schemaCriarLista } from "@/validacoes/lista.schema";
import { listaService } from "@/servicos/ListaService";

// ============================================
// GET - Listar Listas de Compras
// ============================================
export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const listas = await listaService.listar(user.id);

    return sucesso({ listas });
  } catch (error) {
    return tratarErro(error);
  }
}

// ============================================
// POST - Criar Nova Lista e Itens
// ============================================
export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const dados = schemaCriarLista.parse(body);

    const lista = await listaService.criar(user.id, dados);

    return criadoComSucesso({ message: "Lista criada", lista });
  } catch (error) {
    return tratarErro(error);
  }
}
