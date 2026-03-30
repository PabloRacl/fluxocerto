import { prisma } from "@/biblioteca/prisma";

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ");
}

export class ItemImportMappingService {
  async findForItem(userId: string, itemName: string) {
    const normalized = normalizeName(itemName);

    // 1. Busca Mapeamento Direto do Usuário (Prioridade Máxima)
    const exactMatch = await (prisma as any).itemImportMapping.findFirst({
      where: {
        userId,
        itemNormalized: normalized,
      },
    });

    if (exactMatch) return { 
       categoryId: exactMatch.categoryId, 
       accountId: exactMatch.accountId,
       confidence: "exact" 
    };

    // 2. Busca Mapeamento Parcial do Usuário
    const fallback = await (prisma as any).itemImportMapping.findFirst({
      where: {
        userId,
        itemNormalized: { contains: normalized },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (fallback) return { 
       categoryId: fallback.categoryId, 
       accountId: fallback.accountId,
       confidence: "partial" 
    };

    // 3. Motor Neural de Sugestão (Dicionário de Contexto)
    const suggestions = [
      { keywords: ["arroz", "feijao", "leite", "oleo", "acucar", "cafe", "pao", "manteiga", "biscoito", "macarrao"], category: "Alimentação", icon: "🍎" },
      { keywords: ["shampoo", "sabonete", "dental", "papel higienico", "fralda", "absorvente", "desodorante"], category: "Higiene", icon: "🚿" },
      { keywords: ["detergente", "amaciante", "sabao", "desinfetante", "esponja", "cloro", "agua sanitaria"], category: "Limpeza", icon: "🧹" },
      { keywords: ["cerveja", "vinho", "refrigerante", "suco", "agua mineral", "vodka"], category: "Bebidas", icon: "🥤" },
      { keywords: ["carne", "frango", "picanha", "alcatra", "linguica", "salsicha", "presunto", "mussarela"], category: "Açougue / Frios", icon: "🥩" },
      { keywords: ["gasolina", "etanol", "diesel", "oleo motor"], category: "Transporte", icon: "🚗" },
      { keywords: ["farmacia", "remedio", "dipirona", "paracetamol", "gaz", "curativo"], category: "Saúde", icon: "💊" },
    ];

    for (const suggest of suggestions) {
      if (suggest.keywords.some(k => normalized.includes(k))) {
        // Busca se o usuário tem essa categoria cadastrada pelo NOME
        const systemCategory = await (prisma as any).category.findFirst({
          where: {
            userId,
            name: { contains: suggest.category, mode: 'insensitive' }
          }
        });

        if (systemCategory) {
          return { 
             categoryId: systemCategory.id, 
             accountId: null,
             confidence: "neural",
             suggestionIcon: suggest.icon
          };
        }
      }
    }

    return null;
  }

  async applyMappingsToItems(userId: string, items: any[]) {
    const results = [];
    for (const item of items) {
      const mapping = await this.findForItem(userId, item.name);
      results.push({
        ...item,
        mappedCategoryId: mapping?.categoryId || null,
        mappedAccountId: mapping?.accountId || null,
        confidence: (mapping as any)?.confidence || "none",
        suggestionIcon: (mapping as any)?.suggestionIcon || null
      });
    }
    return results;
  }

  async upsertMapping(
    userId: string,
    itemName: string,
    categoryId?: string | null,
    accountId?: string | null,
  ) {
    if (!categoryId && !accountId) return null;

    const normalized = normalizeName(itemName);

    return (prisma as any).itemImportMapping.upsert({
      where: {
        userId_itemNormalized: { userId, itemNormalized: normalized },
      },
      create: {
        userId,
        itemPattern: itemName,
        itemNormalized: normalized,
        categoryId: categoryId || null,
        accountId: accountId || null,
      },
      update: {
        itemPattern: itemName,
        categoryId: categoryId || null,
        accountId: accountId || null,
      },
    });
  }

  async upsertMany(userId: string, mappings: Array<{ name: string; categoryId?: string | null; accountId?: string | null }>) {
    const validMappings = mappings.filter(m => m.categoryId || m.accountId);
    if (validMappings.length === 0) return [];

    const promises = validMappings.map((m) =>
      this.upsertMapping(userId, m.name, m.categoryId, m.accountId),
    );
    return Promise.all(promises);
  }

  async getAllForUser(userId: string) {
    return (prisma as any).itemImportMapping.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }
}

export const itemImportMappingService = new ItemImportMappingService();
