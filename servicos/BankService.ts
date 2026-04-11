import { prisma } from "@/biblioteca/prisma";
import { ForbiddenError } from "@/biblioteca/erros-customizados";

/**
 * BankService - Hub de integração bancária via Pluggy.ai (Sandbox).
 * Responsável por gerenciar conexões, sincronização e agregação de dados.
 */
export class BankService {
  private baseUrl = "https://api.pluggy.ai";
  private clientId = process.env.PLUGGY_CLIENT_ID;
  private clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  /**
   * Obtém token de acesso para a API do Pluggy.
   */
  private async getAccessToken() {
    const response = await fetch(`${this.baseUrl}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      }),
    });

    if (!response.ok) throw new Error("Erro ao autenticar com Pluggy");
    const data = await response.json();
    return data.apiKey;
  }

  /**
   * Cria um widget de conexão (Connect Token).
   */
  async createConnectToken(userId: string) {
    // Phase 1 - Freemium Gate
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    
    if (usuario?.plan === "FREE") {
      throw new ForbiddenError(
        "PREMIUM_FEATURE: Sincronização automática com Open Finance está disponível apenas nos planos PRO e ENTERPRISE."
      );
    }

    const apiKey = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/connect_token`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-KEY": apiKey
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    return data.accessToken;
  }

  /**
   * Sincroniza um Item (Conexão Bancária) e importa contas/transações.
   */
  async syncItem(usuarioId: string, itemId: string) {
    // Phase 1 - Freemium Gate
    const usuario = await prisma.user.findUnique({
      where: { id: usuarioId },
      select: { plan: true },
    });
    
    if (usuario?.plan === "FREE") {
      throw new ForbiddenError(
        "PREMIUM_FEATURE: Sincronização automática com Open Finance está disponível apenas nos planos PRO e ENTERPRISE."
      );
    }

    const apiKey = await this.getAccessToken();
    
    // 1. Buscar detalhes do item
    const itemRes = await fetch(`${this.baseUrl}/items/${itemId}`, {
      headers: { "X-API-KEY": apiKey }
    });
    const itemData = await itemRes.json();

    // 2. Atualizar ou criar BankItem no banco local
    const bankItem = await prisma.bankItem.upsert({
      where: { externalId: itemId },
      update: {
        status: itemData.status,
        lastSyncAt: new Date(),
      },
      create: {
        userId: usuarioId,
        externalId: itemId,
        providerId: itemData.connector?.id?.toString(),
        providerName: itemData.connector?.name,
        providerImageUrl: itemData.connector?.imageUrl,
        status: itemData.status,
        lastSyncAt: new Date(),
      }
    });

    // 3. Buscar Contas vinculadas a esse Item
    const accountsRes = await fetch(`${this.baseUrl}/accounts?itemId=${itemId}`, {
      headers: { "X-API-KEY": apiKey }
    });
    const { results: accounts } = await accountsRes.json();

    for (const acc of accounts) {
      // Upsert na tabela de Contas do FluxoCerto
      const localAccount = await prisma.conta.upsert({
        where: { id: acc.id }, // Usando o ID externo como ID local para simplificar, ou mapear externalId
        update: {
          balance: Math.round(acc.balance * 100),
          lastSync: new Date(),
        },
        create: {
          userId: usuarioId,
          name: acc.name,
          type: this.mapAccountType(acc.type),
          balance: Math.round(acc.balance * 100),
          color: "#047857",
          icon: this.mapIconByType(acc.type),
          provider: "PLUGGY",
          externalId: acc.id,
          isActive: true,
        }
      });

      // 4. Buscar Transações (últimos 30 dias por padrão no sync inicial)
      await this.syncTransactions(usuarioId, localAccount.id, acc.id, apiKey);
    }

    return bankItem;
  }

  /**
   * Sincroniza transações de uma conta específica.
   */
  private async syncTransactions(usuarioId: string, localAccountId: string, externalAccountId: string, apiKey: string) {
    const transRes = await fetch(`${this.baseUrl}/transactions?accountId=${externalAccountId}`, {
      headers: { "X-API-KEY": apiKey }
    });
    const { results: transactions } = await transRes.json();

    for (const tx of transactions) {
      // Verificar se já existe (deduplicação via externalId)
      const existing = await prisma.transaction.findUnique({
        where: { externalId: tx.id }
      });

      if (existing) continue;

      // Criar transação local
      await prisma.transaction.create({
        data: {
          userId: usuarioId,
          accountId: localAccountId,
          categoryId: "OUTROS_ID", // TODO: Mapear via ItemImportMapping ou API
          description: tx.description,
          amount: Math.abs(Math.round(tx.amount * 100)),
          type: tx.amount < 0 ? "EXPENSE" : "INCOME",
          status: "PAID",
          occurrenceDate: new Date(tx.date),
          externalId: tx.id,
        }
      });
    }
  }

  /**
   * Mapeia tipos de conta do Pluggy para o Enum do FluxoCerto.
   */
  private mapAccountType(pluggyType: string): any {
    const map: any = {
      "CHECKING_ACCOUNT": "CHECKING",
      "SAVINGS_ACCOUNT": "SAVINGS",
      "CREDIT_CARD": "CREDIT_CARD",
      "INVESTMENT_ACCOUNT": "INVESTMENT",
    };
    return map[pluggyType] || "OTHER";
  }

  private mapIconByType(pluggyType: string): string {
    if (pluggyType === "CREDIT_CARD") return "credit-card";
    if (pluggyType === "SAVINGS_ACCOUNT") return "piggy-bank";
    return "landmark";
  }
}

export const bankService = new BankService();
