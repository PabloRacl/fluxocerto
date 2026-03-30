const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("--- INTROSPECÇÃO DO CLIENTE PRISMA ---");
  const dmmf = prisma._baseDmmf || prisma._dmmf;
  
  if (dmmf) {
    const userModel = dmmf.datamodel.models.find(m => m.name === "User");
    if (userModel) {
      console.log("Campos em 'User':");
      userModel.fields.forEach(f => console.log(` - ${f.name} (${f.kind})`));
    } else {
      console.log("Modelo 'User' não encontrado no DMMF.");
    }
    
    console.log("\nModelos disponíveis:");
    dmmf.datamodel.models.forEach(m => console.log(` - ${m.name}`));
  } else {
    console.log("DMMF não acessível. Tentando acessar chaves do objeto prisma:");
    console.log(Object.keys(prisma).filter(k => !k.startsWith("_")));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
