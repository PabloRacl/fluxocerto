
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function recoverAdmin() {
  const email = "pabloracl@gmail.com";
  const tempPassword = "AdminForce@123"; // Lembre-se de trocar depois
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        plan: 'ENTERPRISE', // Plano máximo do seu sistema
        password: hashedPassword,
      }
    });

    console.log(`✅ CONTA DE ADMINISTRADOR RECUPERADA!`);
    console.log(`USUÁRIO: ${email}`);
    console.log(`SENHA TEMPORÁRIA: ${tempPassword}`);
    console.log(`CARGO ATUALIZADO: ${updatedUser.role}`);
    console.log(`PLANO ATUALIZADO: ${updatedUser.plan}`);
    console.log(`-------------------------------------------`);
    console.log(`DICA: Tente logar agora com e-mail e a senha acima.`);
  } catch (error) {
    console.error("ERRO AO RECUPERAR ADMIN:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

recoverAdmin();
