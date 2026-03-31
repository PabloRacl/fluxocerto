
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      include: { accounts: true },
    });

    if (admins.length === 0) {
      console.log("❌ NENHUM ADMIN ENCONTRADO NO BANCO DE DADOS.");
      return;
    }

    console.log(`--- SCAN DE ADMINISTRADORES [${admins.length}] ---`);
    admins.forEach(user => {
      console.log(`USUÁRIO: ${user.email}`);
      console.log("ID:", user.id);
      console.log("POSSUI SENHA (PASSWORD):", user.password ? "✅ SIM (Login E-mail/Senha)" : "❌ NÃO (Esta conta só loga via Google)");
      console.log("CONTAS VINCULADAS:", user.accounts.length > 0 ? user.accounts.map(a => a.provider).join(", ") : "❌ NENHUMA (Apenas e-mail/senha)");
      console.log("PLAN:", user.plan || "FREE");
      console.log("----------------------------------");
    });
  } catch (error) {
    console.error("ERRO AO BUSCAR ADMINS:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
