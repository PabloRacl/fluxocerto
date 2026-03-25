// prisma/seed.ts
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================
// DADOS DE TESTE - FLUXOCERTO
// ============================================

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // 1. Criar Usuário de Teste
  console.log("📝 Criando usuário de teste...");
  const hashedPassword = await bcrypt.hash("123456", 12);

  const user = await prisma.user.upsert({
    where: { email: "teste@fluxocerto.com" },
    update: {},
    create: {
      email: "teste@fluxocerto.com",
      name: "Usuário Teste",
      password: hashedPassword,
      emailVerified: new Date(),
      currency: "BRL",
      timezone: "America/Sao_Paulo",
      darkMode: false,
    },
  });
  console.log("✅ Usuário criado:", user.email);

  // 2. Criar Contas Bancárias
  console.log("\n🏦 Criando contas bancárias...");
  const contas = await Promise.all([
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Conta Corrente",
        type: "CHECKING",
        balance: 1500000, // R$ 15.000,00
        color: "#047857",
        icon: "wallet",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Poupança",
        type: "SAVINGS",
        balance: 2500000, // R$ 25.000,00
        color: "#10B981",
        icon: "piggy-bank",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cartão de Crédito",
        type: "CREDIT_CARD",
        balance: -80000, // R$ -800,00
        color: "#EF4444",
        icon: "credit-card",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Investimentos",
        type: "INVESTMENT",
        balance: 5000000, // R$ 50.000,00
        color: "#3B82F6",
        icon: "landmark",
        isActive: true,
      },
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "PIX",
        type: "PIX",
        balance: 50000, // R$ 500,00
        color: "#8B5CF6",
        icon: "banknote",
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ ${contas.length} contas criadas`);

  // 3. Criar Categorias
  console.log("\n📂 Criando categorias...");

  // Categorias de Receita
  const categoriasReceita = await Promise.all([
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Salário",
        type: "INCOME",
        color: "#10B981",
        icon: "wallet",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Freelance",
        type: "INCOME",
        color: "#059669",
        icon: "briefcase",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Investimentos",
        type: "INCOME",
        color: "#047857",
        icon: "trending-up",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Renda Extra",
        type: "INCOME",
        color: "#14B8A6",
        icon: "coins",
        isActive: true,
      },
    }),
  ]);

  // Categorias de Despesa
  const categoriasDespesa = await Promise.all([
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Alimentação",
        type: "EXPENSE",
        color: "#F59E0B",
        icon: "utensils",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Moradia",
        type: "EXPENSE",
        color: "#DC2626",
        icon: "home",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Transporte",
        type: "EXPENSE",
        color: "#3B82F6",
        icon: "car",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Saúde",
        type: "EXPENSE",
        color: "#EF4444",
        icon: "heart",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Educação",
        type: "EXPENSE",
        color: "#8B5CF6",
        icon: "book",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Lazer",
        type: "EXPENSE",
        color: "#EC4899",
        icon: "coffee",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Compras",
        type: "EXPENSE",
        color: "#D97706",
        icon: "shopping-cart",
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: "Contas Fixas",
        type: "EXPENSE",
        color: "#6366F1",
        icon: "credit-card",
        isActive: true,
      },
    }),
  ]);

  const todasCategorias = [...categoriasReceita, ...categoriasDespesa];
  console.log(`✅ ${todasCategorias.length} categorias criadas`);

  // 4. Gerar Transações para Múltiplos Meses
  console.log("\n💰 Gerando transações de teste...");

  const meses = [
    { mes: 10, ano: 2025 }, // Outubro 2025
    { mes: 11, ano: 2025 }, // Novembro 2025
    { mes: 12, ano: 2025 }, // Dezembro 2025
    { mes: 1, ano: 2026 }, // Janeiro 2026
    { mes: 2, ano: 2026 }, // Fevereiro 2026
    { mes: 3, ano: 2026 }, // Março 2026 (mês atual)
  ];

  let totalTransacoes = 0;

  for (const { mes, ano } of meses) {
    console.log(`\n📅 Gerando transações para ${mes}/${ano}...`);

    const transacoesMes: Prisma.TransactionCreateManyInput[] = [];

    // Receita fixa (Salário) - dia 5
    transacoesMes.push({
      userId: user.id,
      accountId: contas[0].id, // Conta Corrente
      categoryId: categoriasReceita[0].id, // Salário
      description: "Salário Mensal",
      amount: 500000, // R$ 5.000,00
      type: "INCOME",
      status: "PAID",
      occurrenceDate: new Date(ano, mes - 1, 5),
      dueDate: new Date(ano, mes - 1, 5),
      paidAt: new Date(ano, mes - 1, 5),
      isRecurring: false,
      isInstallment: false,
      isReconciled: true,
      isDeleted: false,
    });

    // Receita variável (Freelance) - aleatória
    if (Math.random() > 0.5) {
      transacoesMes.push({
        userId: user.id,
        accountId: contas[0].id,
        categoryId: categoriasReceita[1].id, // Freelance
        description: "Projeto Freelance",
        amount: Math.floor(Math.random() * 150000) + 50000, // R$ 500-2.000
        type: "INCOME",
        status: "PAID",
        occurrenceDate: new Date(
          ano,
          mes - 1,
          Math.floor(Math.random() * 20) + 10,
        ),
        isRecurring: false,
        isInstallment: false,
        isReconciled: true,
        isDeleted: false,
      });
    }

    // Despesas Fixas
    // Aluguel - dia 1
    transacoesMes.push({
      userId: user.id,
      accountId: contas[0].id,
      categoryId: categoriasDespesa[1].id, // Moradia
      description: "Aluguel",
      amount: 150000, // R$ 1.500,00
      type: "EXPENSE",
      status: "PAID",
      occurrenceDate: new Date(ano, mes - 1, 1),
      dueDate: new Date(ano, mes - 1, 1),
      paidAt: new Date(ano, mes - 1, 1),
      isRecurring: false,
      isInstallment: false,
      isReconciled: true,
      isDeleted: false,
    });

    // Internet - dia 10
    transacoesMes.push({
      userId: user.id,
      accountId: contas[0].id,
      categoryId: categoriasDespesa[7].id, // Contas Fixas
      description: "Internet",
      amount: 9990, // R$ 99,90
      type: "EXPENSE",
      status: "PAID",
      occurrenceDate: new Date(ano, mes - 1, 10),
      dueDate: new Date(ano, mes - 1, 10),
      paidAt: new Date(ano, mes - 1, 10),
      isRecurring: false,
      isInstallment: false,
      isReconciled: true,
      isDeleted: false,
    });

    // Energia - dia 15
    transacoesMes.push({
      userId: user.id,
      accountId: contas[0].id,
      categoryId: categoriasDespesa[7].id,
      description: "Energia Elétrica",
      amount: Math.floor(Math.random() * 20000) + 15000, // R$ 150-350
      type: "EXPENSE",
      status: "PAID",
      occurrenceDate: new Date(ano, mes - 1, 15),
      dueDate: new Date(ano, mes - 1, 15),
      paidAt: new Date(ano, mes - 1, 15),
      isRecurring: false,
      isInstallment: false,
      isReconciled: true,
      isDeleted: false,
    });

    // Água - dia 20
    transacoesMes.push({
      userId: user.id,
      accountId: contas[0].id,
      categoryId: categoriasDespesa[7].id,
      description: "Água",
      amount: Math.floor(Math.random() * 10000) + 8000, // R$ 80-180
      type: "EXPENSE",
      status: "PAID",
      occurrenceDate: new Date(ano, mes - 1, 20),
      dueDate: new Date(ano, mes - 1, 20),
      paidAt: new Date(ano, mes - 1, 20),
      isRecurring: false,
      isInstallment: false,
      isReconciled: true,
      isDeleted: false,
    });

    // Despesas Variáveis (aleatórias)
    const numDespesasVariaveis = Math.floor(Math.random() * 10) + 10; // 10-20 despesas

    for (let i = 0; i < numDespesasVariaveis; i++) {
      const categoriaIndex = Math.floor(
        Math.random() * categoriasDespesa.length,
      );
      const categoria = categoriasDespesa[categoriaIndex];

      transacoesMes.push({
        userId: user.id,
        accountId: contas[Math.floor(Math.random() * contas.length)].id,
        categoryId: categoria.id,
        description: gerarDescricaoAleatoria(categoria.name),
        amount: Math.floor(Math.random() * 30000) + 2000, // R$ 20-320
        type: "EXPENSE",
        status: Math.random() > 0.8 ? "PENDING" : "PAID", // 20% pendentes
        occurrenceDate: new Date(
          ano,
          mes - 1,
          Math.floor(Math.random() * 28) + 1,
        ),
        dueDate: new Date(ano, mes - 1, Math.floor(Math.random() * 28) + 1),
        paidAt:
          Math.random() > 0.2
            ? new Date(ano, mes - 1, Math.floor(Math.random() * 28) + 1)
            : null,
        isRecurring: false,
        isInstallment: false,
        isReconciled: Math.random() > 0.5,
        isDeleted: false,
      });
    }

    // Criar transações no banco
    await prisma.transaction.createMany({
      data: transacoesMes,
    });

    totalTransacoes += transacoesMes.length;
    console.log(`   ✅ ${transacoesMes.length} transações criadas`);
  }

  console.log(`\n✅ Total de ${totalTransacoes} transações criadas`);

  // 5. Resumo Final
  console.log("\n📊 RESUMO DO SEED:");
  console.log("==================");
  console.log(`👤 Usuário: ${user.email}`);
  console.log(`🏦 Contas: ${contas.length}`);
  console.log(`📂 Categorias: ${todasCategorias.length}`);
  console.log(`💰 Transações: ${totalTransacoes}`);
  console.log(`📅 Período: Out/2025 a Mar/2026`);
  console.log("\n🔐 CREDENCIAIS DE TESTE:");
  console.log("======================");
  console.log("Email: teste@fluxocerto.com");
  console.log("Senha: 123456");
  console.log("\n✅ Seed concluído com sucesso!\n");
}

// Função auxiliar para gerar descrições aleatórias
function gerarDescricaoAleatoria(categoria: string): string {
  const descricoes: Record<string, string[]> = {
    Alimentação: [
      "Supermercado",
      "Restaurante",
      "Lanche",
      "Delivery",
      "Padaria",
      "Açougue",
    ],
    Moradia: [
      "Aluguel",
      "Condomínio",
      "IPTU",
      "Manutenção",
      "Material de Limpeza",
    ],
    Transporte: [
      "Combustível",
      "Uber",
      "Ônibus",
      "Estacionamento",
      "Manutenção Carro",
      "Pedágio",
    ],
    Saúde: [
      "Farmácia",
      "Consulta Médica",
      "Exames",
      "Plano de Saúde",
      "Academia",
    ],
    Educação: [
      "Curso",
      "Livros",
      "Material Escolar",
      "Mensalidade",
      "Workshop",
    ],
    Lazer: ["Cinema", "Restaurante", "Viagem", "Streaming", "Jogos", "Bares"],
    Compras: ["Roupas", "Eletrônicos", "Móveis", "Presentes", "Decoração"],
    "Contas Fixas": [
      "Internet",
      "Energia",
      "Água",
      "Gás",
      "Telefone",
      "TV a Cabo",
    ],
  };

  const opcoes = descricoes[categoria] || ["Despesa Diversa"];
  return opcoes[Math.floor(Math.random() * opcoes.length)];
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
