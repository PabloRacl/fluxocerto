import { prisma } from "./biblioteca/prisma";

async function checkActualTransactions() {
  const user = await prisma.user.findUnique({
    where: { email: "pabloracl@gmail.com" }
  });

  if (!user) {
    console.log("Usuário não encontrado.");
    return;
  }

  console.log(`=== ULTIMAS 20 TRANSAÇÕES PARA ${user.id} ===`);

  const transacoes = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { occurrenceDate: 'desc' },
    take: 20,
    include: { category: true }
  });

  transacoes.forEach(t => {
    console.log(`[${t.occurrenceDate.toISOString()}] ${t.type} | R$ ${(t.amount/100).toFixed(2)} | Status: ${t.status} | Deleted: ${t.isDeleted} | Desc: ${t.description}`);
  });

  console.log("\n=== VERIFICANDO CONTAS ===");
  const contas = await prisma.account.findMany({ where: { userId: user.id } });
  contas.forEach(c => {
    console.log(`Conta: ${c.name} | Saldo: R$ ${(c.balance/100).toFixed(2)} | Active: ${c.isActive}`);
  });
}

checkActualTransactions().catch(console.error);
