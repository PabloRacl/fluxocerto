import { prisma } from "../biblioteca/prisma";
import { painelService } from "../servicos/PainelService";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("Nenhum usuário encontrado.");
    return;
  }

  console.log(`Sincronizando saldos para: ${user.email} (${user.id})`);
  const resultado = await painelService.sincronizarSaldos(user.id);
  console.log(JSON.stringify(resultado, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
