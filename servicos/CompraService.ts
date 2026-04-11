import { prisma } from "@/biblioteca/prisma";
import type { CriarCompraInput } from "@/validacoes/compra.schema";
import { itemImportMappingService } from "@/servicos/ItemImportMappingService";
import { revalidarCacheDashboard } from "@/biblioteca/cache-revalidation";

/**
 * Serviço de Compras — Orquestração complexa
 * encolvendo transações financeiras `$transaction` da ORM, itens em lote
 * e atualizações da conta atrelada numa única request.
 */
export class CompraService {
  /**
   * Lista as compras e gera um dashboard resumido na API
   * (Ticket Médio, Total Mensal, Maior Compra).
   */
  async listar(
    usuarioId: string,
    filtros: { showDeleted: boolean; loja: string | null; mes: string | null },
  ) {
    const { showDeleted, loja, mes } = filtros;
    const where: any = { 
      userId: usuarioId, 
      isDeleted: false,
      isArchived: showDeleted 
    };

    if (loja) {
      where.storeName = { contains: loja, mode: "insensitive" };
    }

    if (mes) {
      const [ano, mesNum] = mes.split("-").map(Number);
      const inicio = new Date(ano, mesNum - 1, 1);
      const fim = new Date(ano, mesNum, 0, 23, 59, 59);
      where.purchaseDate = { gte: inicio, lte: fim };
    }

    const compras = await prisma.purchase.findMany({
      where,
      include: {
        items: { orderBy: { createdAt: "asc" } },
        category: { select: { id: true, name: true, color: true } },
        account: { select: { id: true, name: true, color: true } },
      },
      orderBy: { purchaseDate: "desc" },
    });

    const ativas = compras.filter((c) => !c.isDeleted && !c.isArchived);
    const totalMes = ativas.reduce((acc, c) => acc + c.totalAmount, 0);
    const ticketMedio =
      ativas.length > 0 ? Math.round(totalMes / ativas.length) : 0;
    const maiorCompra =
      ativas.length > 0 ? Math.max(...ativas.map((c) => c.totalAmount)) : 0;

    return {
      compras,
      resumo: {
        totalMes,
        ticketMedio,
        maiorCompra,
        totalCompras: ativas.length,
      },
    };
  }

  /**
   * Cria registro da Compra Master, os Itens Filhos
   * e Transação Financeira subtraindo o Saldo. Modos operante "Ou tudo ou nada".
   */
  async criar(usuarioId: string, dados: CriarCompraInput) {
    const { items = [], totalAmount } = dados;

    // Calcular total fiel e preciso através dos itens quando presentes
    const totalItens =
      items.length > 0
        ? items.reduce(
            (acc, item) =>
              acc + Math.round(item.quantity * item.unitPrice * 100),
            0,
          )
        : totalAmount;

    // Garantia de Integridade Relacional (Transação Atômica)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar compra (Master Root)
      const compra = await tx.purchase.create({
        data: {
          userId: usuarioId,
          description: dados.description,
          totalAmount: totalItens || totalAmount,
          purchaseDate: new Date(dados.purchaseDate),
          storeName: dados.storeName || null,
          paymentMethod: dados.paymentMethod as any,
          accountId: dados.accountId || null,
          categoryId: dados.categoryId || null,
          isInstallment: dados.isInstallment,
          installmentTotal: dados.isInstallment ? dados.installmentTotal : null,
          installmentValue: dados.isInstallment ? dados.installmentValue : null,
        },
      });

      // 2. Insert Massivo dos Filhos Opcionais ($CreateMany Batch Insert)
      if (items.length > 0) {
        await tx.purchaseItem.createMany({
          data: items.map((item) => ({
            purchaseId: compra.id,
            name: item.name,
            quantity: item.quantity as any, // Decimal map handled down database internally
            unit: item.unit || null,
            unitPrice: Math.round(item.unitPrice * 100),
            totalPrice: Math.round(item.quantity * item.unitPrice * 100),
            category: item.category || null,
            barcode: item.barcode || null,
          })),
        });
      }

      // 3. Orquestração com o Sistema Financeiro Sub-relacional.
      let transacao = null;
      if (dados.gerarTransacao && dados.accountId && dados.categoryId) {
        transacao = await tx.transaction.create({
          data: {
            userId: usuarioId,
            accountId: dados.accountId,
            categoryId: dados.categoryId,
            description: `Compra: ${dados.description}${
              dados.storeName ? ` - ${dados.storeName}` : ""
            }`,
            amount: totalItens || totalAmount,
            type: "EXPENSE",
            status: "PAID",
            occurrenceDate: new Date(dados.purchaseDate),
            paidAt: new Date(dados.purchaseDate),
            isInstallment: dados.isInstallment,
            installmentTotal: dados.isInstallment
              ? dados.installmentTotal
              : null,
            installmentCurrent: dados.isInstallment ? 1 : null,
            transactionId: compra.id,
          },
        });

        // 4. Update Saldo (Diminuição Matemática)
        await tx.conta.update({
          where: { id: dados.accountId },
          data: { balance: { decrement: totalItens || totalAmount } },
        });
      }

      // 5. ATUALIZAÇÃO AUTOMÁTICA DE ESTOQUE (P12 CONSOLIDADO)
      if (items.length > 0) {
        for (const item of items) {
          // Busca item no estoque pelo nome exato (ou barcode)
          const itemExistente = await tx.estoque.findFirst({
            where: { 
              usuarioId, 
              isDeleted: false,
              OR: [
                { nome: { equals: item.name, mode: 'insensitive' } },
                { barcode: item.barcode ? { equals: item.barcode } : undefined }
              ].filter(Boolean) as any
            }
          });

          if (itemExistente) {
            await tx.estoque.update({
              where: { id: itemExistente.id },
              data: {
                quantidade: { increment: item.quantity },
                precoUltimo: Math.round(item.unitPrice * 100),
                ultimaCompra: new Date(dados.purchaseDate)
              }
            });
          } else {
            // Cria novo item no estoque se não existir
            await tx.estoque.create({
              data: {
                usuarioId,
                nome: item.name,
                categoria: item.category || dados.description, // fallback para nome da compra
                quantidade: item.quantity,
                unidade: item.unit || "un",
                precoUltimo: Math.round(item.unitPrice * 100),
                ultimaCompra: new Date(dados.purchaseDate),
                barcode: item.barcode || null,
                estoqueMinimo: 1
              }
            });
          }
        }
      }

      return { compra, transacao };
    });

    if (dados.itemMappings?.length > 0) {
      await itemImportMappingService.upsertMany(usuarioId, dados.itemMappings);
    }

    // Invalida cache do painel
    await revalidarCacheDashboard(usuarioId);

    return result;
  }
}

export const compraService = new CompraService();
