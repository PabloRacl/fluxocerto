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

    const exactMatch = await (prisma as any).itemImportMapping.findFirst({
      where: {
        userId,
        itemNormalized: normalized,
      },
    });

    if (exactMatch) return exactMatch;

    const fallback = await (prisma as any).itemImportMapping.findFirst({
      where: {
        userId,
        itemNormalized: { contains: normalized },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (fallback) return fallback;

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
    const promises = mappings.map((m) =>
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
