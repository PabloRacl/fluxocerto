import { revalidateTag } from "next/cache";

/**
 * Utilitário central para invalidação de cache do Dashboard ("Neuro HUD").
 * Deve ser chamado sempre que houver alteração em dados que afetam os cards de resumo,
 * gráficos de evolução ou gamificação.
 */
export async function revalidarCacheDashboard(userId: string) {
  try {
    // Tags padrão definidas nos routes do painel
    // @ts-ignore
    revalidateTag(`resumo-${userId}`);
    // @ts-ignore
    revalidateTag(`gamificacao-${userId}`);
    // @ts-ignore
    revalidateTag(`evolucao-${userId}`);
    // @ts-ignore
    revalidateTag(`categorias-${userId}`);
    // @ts-ignore
    revalidateTag(`previsao-${userId}`);
    
    console.log(`[Cache] Cache do dashboard revalidado para usuário: ${userId}`);
  } catch (error) {
    console.error(`[Cache] Erro ao revalidar cache do dashboard para ${userId}:`, error);
  }
}
