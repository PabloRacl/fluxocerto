import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  
  if (!email) {
    console.error("❌ Por favor, forneça o email do usuário.")
    console.log("Uso: npx tsx scripts/make-admin.ts usuario@email.com")
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`❌ Usuário com email ${email} não encontrado no banco de dados.`)
    process.exit(1)
  }

  // O "as any" aqui garante que se o TS estiver desatualizado localmente com o Prisma, ele não quebre a build do script.
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' } as any
  })

  console.log(`✅ Sucesso Supremo!`)
  console.log(`O usuário ${updatedUser.name || ''} (${updatedUser.email}) agora tem Nível de Acesso: administrador (ADMIN).`)
  console.log(`Ele já pode ver a Central Administrativa ao fazer login no painel.`)
}

main()
  .catch((e) => {
    console.error("Erro fatal:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
