const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- AUDITORIA GLOBAL DE TRANSAÇÕES ---");
  const count = await prisma.transaction.count();
  console.log(`Total de transações no sistema: ${count}`);

  if (count > 0) {
    const samples = await prisma.transaction.findMany({
      take: 10,
      select: {
        userId: true,
        amount: true,
        type: true,
        status: true,
        occurrenceDate: true
      }
    });
    console.log("Amostra das últimas transações:");
    console.table(samples);

    const byUser = await prisma.transaction.groupBy({
      by: ['userId'],
      _count: true,
      _sum: { amount: true }
    });
    console.log("Resumo por Usuário:");
    console.table(byUser);
  } else {
    console.log("Nenhuma transação encontrada na tabela Transaction.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
