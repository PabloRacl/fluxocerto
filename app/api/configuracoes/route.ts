export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso } from "@/biblioteca/resposta-api";
import { schemaAtualizarConfiguracao } from "@/validacoes/configuracao.schema";
import { configuracaoService } from "@/servicos/ConfiguracaoService";

// ============================================
// GET - Obter configurações do usuário
// ============================================
export async function GET() {
  try {
    const user = await obterUsuarioAutenticado();
    const configuracoes = await configuracaoService.obter(user.id);

    return sucesso({ usuario: configuracoes });
  } catch (error) {
    return tratarErro(error);
  }
}

// ============================================
// PUT - Atualizar Configurações Parciais
// ============================================
export async function PUT(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();
    const dados = schemaAtualizarConfiguracao.parse(body);

    const usuarioAtualizado = await configuracaoService.atualizar(user.id, dados);

    return sucesso({
      message: "Configurações atualizadas",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    return tratarErro(error);
  }
}
