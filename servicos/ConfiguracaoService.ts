import { prisma } from "@/biblioteca/prisma";
import type { AtualizarConfiguracaoInput } from "@/validacoes/configuracao.schema";

/**
 * Serviço de Configurações (Settings).
 * Cuida das preferências individuais da conta do User.
 */
export class ConfiguracaoService {
  /**
   * Obtém os dados de sessão preferenciais do Usuário.
   */
  async obter(usuarioId: string) {
    const user = await prisma.user.findUnique({
      where: { id: usuarioId },
    });

    if (!user) throw new Error("Usuário não encontrado");

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      sessionDuration: user.sessionDuration,
      autoLogoutMinutes: user.autoLogoutMinutes,
      darkMode: user.darkMode,
      currency: user.currency,
      timezone: user.timezone,
    };
  }

  /**
   * Atualiza as configurações.
   */
  async atualizar(usuarioId: string, dados: AtualizarConfiguracaoInput) {
    const user = await prisma.user.findUnique({
      where: { id: usuarioId },
    });

    if (!user) throw new Error("Usuário não encontrado");

    const updated = await prisma.user.update({
      where: { id: usuarioId },
      data: {
        name: dados.name !== undefined ? dados.name : user.name,
        sessionDuration: dados.sessionDuration ?? user.sessionDuration,
        autoLogoutMinutes: dados.autoLogoutMinutes ?? user.autoLogoutMinutes,
        darkMode: dados.darkMode ?? user.darkMode,
        currency: dados.currency ?? user.currency,
        timezone: dados.timezone ?? user.timezone,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      sessionDuration: updated.sessionDuration,
      autoLogoutMinutes: updated.autoLogoutMinutes,
      darkMode: updated.darkMode,
      currency: updated.currency,
      timezone: updated.timezone,
    };
  }
}

export const configuracaoService = new ConfiguracaoService();
