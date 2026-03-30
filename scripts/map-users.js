const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- MAPEAMENTO DE USUÁRIOS (CORRIGIDO) ---");
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          accounts: true,
          transactions: true,
          vendas: true,
          assinaturas: true,
          metas: true,
          assets: true
        }
      }
    }
  });

  console.table(users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    contas: u._count.accounts,
    transacoes: u._count.transactions,
    vendas: u._count.vendas,
    assinaturas: u._count.assinaturas,
    metas: u._count.metas,
    assets: u._count.assets
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
