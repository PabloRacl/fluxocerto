const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- INSPECIONANDO BANCO DE DADOS ---");
  
  const users = await prisma.user.findMany();
  console.log(`Usuários: ${users.length}`);
  users.forEach(u => console.log(` - ${u.email} (${u.id})`));

  if (users.length > 0) {
    const userId = users[0].id;
    const accounts = await prisma.account.findMany({ where: { userId } });
    console.log(`Contas do usuário ${userId}: ${accounts.length}`);
    accounts.forEach(a => console.log(` - ${a.name}: R$ ${a.balance / 100} (ID: ${a.id})`));

    const transactions = await prisma.transaction.findMany({ where: { userId }, take: 5 });
    console.log(`Transações totais: ${await prisma.transaction.count({ where: { userId } })}`);
    console.log("Ultimas 5 transações:");
    transactions.forEach(t => console.log(` - ${t.description}: ${t.amount} (${t.type})`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
