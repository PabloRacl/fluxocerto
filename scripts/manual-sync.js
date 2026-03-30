const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    console.log(`\nSincronizando Usuário: ${user.email} (${user.id})`);
    const accounts = await prisma.account.findMany({
      where: { userId: user.id, isDeleted: false }
    });

    for (const account of accounts) {
      const transactions = await prisma.transaction.findMany({
        where: { accountId: account.id, status: "PAID", isDeleted: false }
      });

      const newBalance = transactions.reduce((sum, t) => {
        if (t.type === "INCOME") return sum + t.amount;
        if (t.type === "EXPENSE") return sum - t.amount;
        return sum;
      }, 0);

      await prisma.account.update({
        where: { id: account.id },
        data: { balance: newBalance }
      });

      console.log(` - Conta: ${account.name} | Antigo: ${account.balance} | Novo: ${newBalance}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
