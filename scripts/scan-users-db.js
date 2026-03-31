
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function scanUsers() {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      include: { accounts: true },
    });

    console.log(`--- SCAN DE USUÁRIOS (TOP 10) ---`);
    users.forEach(user => {
      console.log(`E-MAIL: ${user.email}`);
      console.log("CARGO (ROLE):", (user.role || "Não definido"));
      console.log("POSSUI SENHA:", user.password ? "✅ SIM" : "❌ NÃO");
      console.log("CONTAS VINCULADAS:", user.accounts.length > 0 ? user.accounts.map(a => a.provider).join(", ") : "Nenhuma");
      console.log("----------------------------------");
    });
  } catch (error) {
    console.error("ERRO AO SCANEAR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

scanUsers();
