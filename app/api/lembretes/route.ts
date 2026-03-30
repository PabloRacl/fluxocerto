import { NextRequest } from "next/server";
import { obterUsuarioAutenticado } from "@/biblioteca/obter-usuario-autenticado";
import { tratarErro } from "@/biblioteca/tratar-erro";
import { sucesso, criadoComSucesso } from "@/biblioteca/resposta-api";
import { schemaCriarLembrete } from "@/validacoes/notificacao-lembrete.schema";
import { notificacaoService } from "@/servicos/NotificacaoLembreteService";

// ============================================
// GET - Listar Lembretes Explícitos
// ============================================
export async function GET(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const params = request.nextUrl.searchParams;

    const resultado = await notificacaoService.listarLembretes(user.id, {
      showRead: params.get("showRead") === "true",
    });

    return sucesso(resultado);
  } catch (error) {
    return tratarErro(error);
  }
}

// ============================================
// POST - Criar Lembrete / Alerta
// ============================================
export async function POST(request: NextRequest) {
  try {
    const user = await obterUsuarioAutenticado();
    const body = await request.json();

    // Reutilizando schema de notificacoes
    const dados = schemaCriarLembrete.parse(body);

    const lembrete = await notificacaoService.criar(user.id, dados);

    return criadoComSucesso({ message: "Lembrete criado", lembrete });
  } catch (error) {
    return tratarErro(error);
  }
}
