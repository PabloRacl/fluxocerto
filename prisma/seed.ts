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
    prisma.conta.create({
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
    prisma.conta.create({
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
    prisma.conta.create({
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
    prisma.conta.create({
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
    prisma.conta.create({
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

  // 5. Criar Compras de teste
  await seedCompras(contas, todasCategorias, user);

  // 6. Popular catálogo de produtos
  await seedProdutos();

  // 7. Resumo Final
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

// ============================================
// COMPRAS DE TESTE
// ============================================

async function seedCompras(contas: any[], categorias: any[], user: any) {
  console.log("🛒 Criando compras de teste...");

  const contaPrincipal =
    contas.find((c: any) => c.type === "CHECKING") || contas[0];
  const categoriaAlimentacao =
    categorias.find((c: any) => c.name === "Alimentação") || categorias[0];

  const compras = [
    {
      description: "Compra semanal - Supermercado",
      totalAmount: 35890,
      purchaseDate: new Date("2026-03-15"),
      storeName: "Atacadão",
      paymentMethod: "PIX",
      items: [
        {
          name: "Arroz Branco 5kg",
          quantity: 1,
          unit: "pac",
          unitPrice: 2290,
          totalPrice: 2290,
        },
        {
          name: "Feijão Carioca 1kg",
          quantity: 2,
          unit: "pac",
          unitPrice: 750,
          totalPrice: 1500,
        },
        {
          name: "Óleo de Soja 900ml",
          quantity: 2,
          unit: "un",
          unitPrice: 650,
          totalPrice: 1300,
        },
        {
          name: "Leite Integral 1L",
          quantity: 6,
          unit: "un",
          unitPrice: 550,
          totalPrice: 3300,
        },
        {
          name: "Peito de Frango 1kg",
          quantity: 2,
          unit: "kg",
          unitPrice: 1890,
          totalPrice: 3780,
        },
        {
          name: "Macarrão Espaguete 500g",
          quantity: 3,
          unit: "pac",
          unitPrice: 350,
          totalPrice: 1050,
        },
        {
          name: "Molho de Tomate 340g",
          quantity: 4,
          unit: "un",
          unitPrice: 320,
          totalPrice: 1280,
        },
        {
          name: "Café em Pó 500g",
          quantity: 1,
          unit: "pac",
          unitPrice: 1890,
          totalPrice: 1890,
        },
      ],
    },
    {
      description: "Feira da semana",
      totalAmount: 12500,
      purchaseDate: new Date("2026-03-17"),
      storeName: "Feira Livre",
      paymentMethod: "CASH",
      items: [
        {
          name: "Banana Prata 1kg",
          quantity: 2,
          unit: "kg",
          unitPrice: 590,
          totalPrice: 1180,
        },
        {
          name: "Maçã Fuji 1kg",
          quantity: 1,
          unit: "kg",
          unitPrice: 790,
          totalPrice: 790,
        },
        {
          name: "Tomate 1kg",
          quantity: 1,
          unit: "kg",
          unitPrice: 690,
          totalPrice: 690,
        },
        {
          name: "Alface Crespa",
          quantity: 2,
          unit: "un",
          unitPrice: 290,
          totalPrice: 580,
        },
        {
          name: "Cenoura 1kg",
          quantity: 1,
          unit: "kg",
          unitPrice: 390,
          totalPrice: 390,
        },
        {
          name: "Ovos Brancos Dúzia",
          quantity: 2,
          unit: "dz",
          unitPrice: 1290,
          totalPrice: 2580,
        },
      ],
    },
    {
      description: "Limpeza mensal",
      totalAmount: 8950,
      purchaseDate: new Date("2026-03-10"),
      storeName: "Supermercado Extra",
      paymentMethod: "CREDIT_CARD",
      items: [
        {
          name: "Detergente 500ml",
          quantity: 3,
          unit: "un",
          unitPrice: 290,
          totalPrice: 870,
        },
        {
          name: "Sabão em Pó 1kg",
          quantity: 1,
          unit: "pac",
          unitPrice: 1290,
          totalPrice: 1290,
        },
        {
          name: "Água Sanitária 2L",
          quantity: 1,
          unit: "un",
          unitPrice: 590,
          totalPrice: 590,
        },
        {
          name: "Papel Higiênico 12un",
          quantity: 1,
          unit: "pac",
          unitPrice: 1690,
          totalPrice: 1690,
        },
        {
          name: "Esponja de Aço 8un",
          quantity: 1,
          unit: "pac",
          unitPrice: 390,
          totalPrice: 390,
        },
        {
          name: "Saco de Lixo 50L 10un",
          quantity: 2,
          unit: "pac",
          unitPrice: 890,
          totalPrice: 1780,
        },
      ],
    },
    {
      description: "Compras do mês",
      totalAmount: 52750,
      purchaseDate: new Date("2026-03-01"),
      storeName: "Atacadão",
      paymentMethod: "DEBIT_CARD",
      items: [
        {
          name: "Arroz Branco 5kg",
          quantity: 2,
          unit: "pac",
          unitPrice: 2290,
          totalPrice: 4580,
        },
        {
          name: "Feijão Carioca 1kg",
          quantity: 4,
          unit: "pac",
          unitPrice: 750,
          totalPrice: 3000,
        },
        {
          name: "Óleo de Soja 900ml",
          quantity: 3,
          unit: "un",
          unitPrice: 650,
          totalPrice: 1950,
        },
        {
          name: "Café em Pó 500g",
          quantity: 2,
          unit: "pac",
          unitPrice: 1890,
          totalPrice: 3780,
        },
        {
          name: "Açúcar Cristal 1kg",
          quantity: 2,
          unit: "pac",
          unitPrice: 420,
          totalPrice: 840,
        },
        {
          name: "Sal Refinado 1kg",
          quantity: 1,
          unit: "pac",
          unitPrice: 250,
          totalPrice: 250,
        },
        {
          name: "Leite Integral 6un",
          quantity: 2,
          unit: "cx",
          unitPrice: 2990,
          totalPrice: 5980,
        },
        {
          name: "Manteiga c/Sal 200g",
          quantity: 2,
          unit: "un",
          unitPrice: 890,
          totalPrice: 1780,
        },
        {
          name: "Queijo Mussarela 300g",
          quantity: 2,
          unit: "pac",
          unitPrice: 1490,
          totalPrice: 2980,
        },
        {
          name: "Presunto 200g",
          quantity: 3,
          unit: "pac",
          unitPrice: 690,
          totalPrice: 2070,
        },
        {
          name: "Peito de Frango 1kg",
          quantity: 3,
          unit: "kg",
          unitPrice: 1890,
          totalPrice: 5670,
        },
        {
          name: "Carne Moída 1kg",
          quantity: 2,
          unit: "kg",
          unitPrice: 3290,
          totalPrice: 6580,
        },
        {
          name: "Ovos Brancos 30un",
          quantity: 1,
          unit: "un",
          unitPrice: 2890,
          totalPrice: 2890,
        },
        {
          name: "Papel Higiênico 12un",
          quantity: 1,
          unit: "pac",
          unitPrice: 1690,
          totalPrice: 1690,
        },
        {
          name: "Sabão em Pó 1kg",
          quantity: 1,
          unit: "pac",
          unitPrice: 1290,
          totalPrice: 1290,
        },
        {
          name: "Amaciante 2L",
          quantity: 1,
          unit: "un",
          unitPrice: 1490,
          totalPrice: 1490,
        },
      ],
    },
    {
      description: "Compras rápidas",
      totalAmount: 4560,
      purchaseDate: new Date("2026-03-20"),
      storeName: "Padaria do Bairro",
      paymentMethod: "PIX",
      items: [
        {
          name: "Pão Francês 1kg",
          quantity: 1,
          unit: "kg",
          unitPrice: 1290,
          totalPrice: 1290,
        },
        {
          name: "Pão de Forma 500g",
          quantity: 1,
          unit: "pac",
          unitPrice: 890,
          totalPrice: 890,
        },
        {
          name: "Iogurte Natural 170g",
          quantity: 4,
          unit: "un",
          unitPrice: 350,
          totalPrice: 1400,
        },
      ],
    },
  ];

  for (const compra of compras) {
    await prisma.purchase.create({
      data: {
        userId: user.id,
        description: compra.description,
        totalAmount: compra.totalAmount,
        purchaseDate: compra.purchaseDate,
        storeName: compra.storeName,
        paymentMethod: compra.paymentMethod as any,
        accountId: contaPrincipal?.id,
        categoryId: categoriaAlimentacao?.id,
        items: {
          create: compra.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
    });
  }

  console.log(`✅ ${compras.length} compras criadas!`);
}

// ============================================
// PRODUTOS DO ATACAREJO
// ============================================

async function seedProdutos() {
  console.log("🛒 Populando catálogo de produtos...");

  const produtos = [
    // Grãos e Cereais
    {
      nome: "Arroz Branco 5kg",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 2290,
      popular: true,
    },
    {
      nome: "Arroz Branco 1kg",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 550,
      popular: true,
    },
    {
      nome: "Feijão Carioca 1kg",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 750,
      popular: true,
    },
    {
      nome: "Feijão Preto 1kg",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 790,
      popular: true,
    },
    {
      nome: "Feijão Carioca 500g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 420,
      popular: false,
    },
    {
      nome: "Macarrão Espaguete 500g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 350,
      popular: true,
    },
    {
      nome: "Macarrão Parafuso 500g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 380,
      popular: true,
    },
    {
      nome: "Macarrão Penne 500g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 390,
      popular: false,
    },
    {
      nome: "Macarrão Instantâneo",
      categoria: "Grãos e Cereais",
      unidade: "un",
      precoMedio: 180,
      popular: true,
    },
    {
      nome: "Farinha de Trigo 1kg",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 420,
      popular: true,
    },
    {
      nome: "Farinha de Mandioca 500g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 350,
      popular: false,
    },
    {
      nome: "Fubá 500g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 320,
      popular: false,
    },
    {
      nome: "Aveia em Flocos 200g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Cuscuz 500g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 280,
      popular: false,
    },
    {
      nome: "Lentilha 500g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 550,
      popular: false,
    },
    {
      nome: "Grão de Bico 500g",
      categoria: "Grãos e Cereais",
      unidade: "pac",
      precoMedio: 650,
      popular: false,
    },

    // Óleos e Azeites
    {
      nome: "Óleo de Soja 900ml",
      categoria: "Óleos e Azeites",
      unidade: "un",
      precoMedio: 650,
      popular: true,
    },
    {
      nome: "Óleo de Soja 500ml",
      categoria: "Óleos e Azeites",
      unidade: "un",
      precoMedio: 380,
      popular: false,
    },
    {
      nome: "Azeite Extra Virgem 500ml",
      categoria: "Óleos e Azeites",
      unidade: "un",
      precoMedio: 2890,
      popular: true,
    },
    {
      nome: "Azeite Extra Virgem 250ml",
      categoria: "Óleos e Azeites",
      unidade: "un",
      precoMedio: 1590,
      popular: false,
    },
    {
      nome: "Vinagre de Álcool 500ml",
      categoria: "Óleos e Azeites",
      unidade: "un",
      precoMedio: 250,
      popular: true,
    },
    {
      nome: "Vinagre de Maçã 500ml",
      categoria: "Óleos e Azeites",
      unidade: "un",
      precoMedio: 590,
      popular: false,
    },

    // Temperos e Condimentos
    {
      nome: "Sal Refinado 1kg",
      categoria: "Temperos",
      unidade: "pac",
      precoMedio: 250,
      popular: true,
    },
    {
      nome: "Açúcar Cristal 1kg",
      categoria: "Temperos",
      unidade: "pac",
      precoMedio: 420,
      popular: true,
    },
    {
      nome: "Açúcar Refinado 1kg",
      categoria: "Temperos",
      unidade: "pac",
      precoMedio: 450,
      popular: true,
    },
    {
      nome: "Açúcar Mascavo 500g",
      categoria: "Temperos",
      unidade: "pac",
      precoMedio: 590,
      popular: false,
    },
    {
      nome: "Adoçante Líquido",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 890,
      popular: false,
    },
    {
      nome: "Café em Pó 500g",
      categoria: "Temperos",
      unidade: "pac",
      precoMedio: 1890,
      popular: true,
    },
    {
      nome: "Café em Pó 250g",
      categoria: "Temperos",
      unidade: "pac",
      precoMedio: 990,
      popular: true,
    },
    {
      nome: "Café Solúvel 200g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 1290,
      popular: false,
    },
    {
      nome: "Leite em Pó 400g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 1590,
      popular: true,
    },
    {
      nome: "Creme de Leite 300g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 350,
      popular: true,
    },
    {
      nome: "Leite Condensado 395g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 550,
      popular: true,
    },
    {
      nome: "Molho de Tomate 340g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 320,
      popular: true,
    },
    {
      nome: "Extrato de Tomate 340g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 280,
      popular: true,
    },
    {
      nome: "Ketchup 400g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 790,
      popular: true,
    },
    {
      nome: "Maionese 500g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Mostarda 200g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 550,
      popular: false,
    },
    {
      nome: "Pimenta do Reino 30g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 450,
      popular: false,
    },
    {
      nome: "Orégano 20g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 350,
      popular: true,
    },
    {
      nome: "Colorau 100g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Caldo de Carne",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 180,
      popular: true,
    },
    {
      nome: "Caldo de Galinha",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 180,
      popular: true,
    },
    {
      nome: "Fermento Biológico 100g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 350,
      popular: false,
    },
    {
      nome: "Fermento em Pó 100g",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 290,
      popular: false,
    },
    {
      nome: "Leite de Coco 200ml",
      categoria: "Temperos",
      unidade: "un",
      precoMedio: 290,
      popular: false,
    },

    // Carnes
    {
      nome: "Peito de Frango 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 1890,
      popular: true,
    },
    {
      nome: "Coxa de Frango 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 1290,
      popular: true,
    },
    {
      nome: "Sobrecoxa 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 1390,
      popular: true,
    },
    {
      nome: "Asa de Frango 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 1590,
      popular: false,
    },
    {
      nome: "Filé de Frango 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 2290,
      popular: true,
    },
    {
      nome: "Patinho Bovino 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 3990,
      popular: true,
    },
    {
      nome: "Acém Bovino 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 2990,
      popular: true,
    },
    {
      nome: "Costela Bovina 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 3590,
      popular: true,
    },
    {
      nome: "Carne Moída 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 3290,
      popular: true,
    },
    {
      nome: "Lombo Suíno 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 2590,
      popular: false,
    },
    {
      nome: "Linguiça Toscana 1kg",
      categoria: "Carnes",
      unidade: "kg",
      precoMedio: 1990,
      popular: true,
    },
    {
      nome: "Linguiça Calabresa 500g",
      categoria: "Carnes",
      unidade: "pac",
      precoMedio: 1290,
      popular: true,
    },
    {
      nome: "Salsicha 500g",
      categoria: "Carnes",
      unidade: "pac",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Presunto 200g",
      categoria: "Carnes",
      unidade: "pac",
      precoMedio: 690,
      popular: true,
    },
    {
      nome: "Mussarela 200g",
      categoria: "Carnes",
      unidade: "pac",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Peito de Peru 200g",
      categoria: "Carnes",
      unidade: "pac",
      precoMedio: 990,
      popular: false,
    },
    {
      nome: "Bacon 300g",
      categoria: "Carnes",
      unidade: "pac",
      precoMedio: 1290,
      popular: false,
    },
    {
      nome: "Ovos Brancos Dúzia",
      categoria: "Carnes",
      unidade: "dz",
      precoMedio: 1290,
      popular: true,
    },
    {
      nome: "Ovos Brancos 30un",
      categoria: "Carnes",
      unidade: "un",
      precoMedio: 2890,
      popular: true,
    },

    // Leites e Derivados
    {
      nome: "Leite Integral 1L",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 550,
      popular: true,
    },
    {
      nome: "Leite Integral 6un",
      categoria: "Leites e Derivados",
      unidade: "cx",
      precoMedio: 2990,
      popular: true,
    },
    {
      nome: "Leite Desnatado 1L",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 590,
      popular: false,
    },
    {
      nome: "Iogurte Natural 170g",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 350,
      popular: true,
    },
    {
      nome: "Iogurte Morango 170g",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Iogurte com Frutas 1kg",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Manteiga c/Sal 200g",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Manteiga s/Sal 200g",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 950,
      popular: false,
    },
    {
      nome: "Margarina 500g",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 590,
      popular: true,
    },
    {
      nome: "Queijo Mussarela 300g",
      categoria: "Leites e Derivados",
      unidade: "pac",
      precoMedio: 1490,
      popular: true,
    },
    {
      nome: "Queijo Prato 300g",
      categoria: "Leites e Derivados",
      unidade: "pac",
      precoMedio: 1390,
      popular: false,
    },
    {
      nome: "Requeijão 250g",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 690,
      popular: true,
    },
    {
      nome: "Creme de Leite 300g",
      categoria: "Leites e Derivados",
      unidade: "un",
      precoMedio: 350,
      popular: true,
    },

    // Frutas
    {
      nome: "Banana Prata 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 590,
      popular: true,
    },
    {
      nome: "Banana Nanica 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Maçã Fuji 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 790,
      popular: true,
    },
    {
      nome: "Maçã Gala 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 690,
      popular: true,
    },
    {
      nome: "Laranja Pera 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Limão Siciliano 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 590,
      popular: false,
    },
    {
      nome: "Limão Tahiti 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Mamão Papaia 1un",
      categoria: "Frutas",
      unidade: "un",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Manga Palmer 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 590,
      popular: false,
    },
    {
      nome: "Abacaxi 1un",
      categoria: "Frutas",
      unidade: "un",
      precoMedio: 590,
      popular: true,
    },
    {
      nome: "Melancia 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 290,
      popular: false,
    },
    {
      nome: "Melão Amarelo 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 390,
      popular: false,
    },
    {
      nome: "Uva Itália 500g",
      categoria: "Frutas",
      unidade: "pac",
      precoMedio: 890,
      popular: false,
    },
    {
      nome: "Morango 250g",
      categoria: "Frutas",
      unidade: "pac",
      precoMedio: 790,
      popular: false,
    },
    {
      nome: "Abacate 1kg",
      categoria: "Frutas",
      unidade: "kg",
      precoMedio: 690,
      popular: false,
    },
    {
      nome: "Kiwi 300g",
      categoria: "Frutas",
      unidade: "pac",
      precoMedio: 690,
      popular: false,
    },

    // Verduras e Legumes
    {
      nome: "Alface Crespa 1un",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 290,
      popular: true,
    },
    {
      nome: "Tomate 1kg",
      categoria: "Verduras e Legumes",
      unidade: "kg",
      precoMedio: 690,
      popular: true,
    },
    {
      nome: "Cebola 1kg",
      categoria: "Verduras e Legumes",
      unidade: "kg",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Alho 200g",
      categoria: "Verduras e Legumes",
      unidade: "pac",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Batata 1kg",
      categoria: "Verduras e Legumes",
      unidade: "kg",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Cenoura 1kg",
      categoria: "Verduras e Legumes",
      unidade: "kg",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Cenoura Baby 300g",
      categoria: "Verduras e Legumes",
      unidade: "pac",
      precoMedio: 490,
      popular: false,
    },
    {
      nome: "Chuchu 1kg",
      categoria: "Verduras e Legumes",
      unidade: "kg",
      precoMedio: 350,
      popular: false,
    },
    {
      nome: "Abobrinha 1kg",
      categoria: "Verduras e Legumes",
      unidade: "kg",
      precoMedio: 390,
      popular: false,
    },
    {
      nome: "Berinjela 1kg",
      categoria: "Verduras e Legumes",
      unidade: "kg",
      precoMedio: 490,
      popular: false,
    },
    {
      nome: "Pimentão Verde 1un",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 290,
      popular: true,
    },
    {
      nome: "Pimentão Vermelho 1un",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 390,
      popular: false,
    },
    {
      nome: "Couve Manteiga 1maço",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 290,
      popular: true,
    },
    {
      nome: "Brócolis 1un",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Couve Flor 1un",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 590,
      popular: false,
    },
    {
      nome: "Repolho 1un",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Milho Verde Lata 200g",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 250,
      popular: true,
    },
    {
      nome: "Ervilha Lata 200g",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 280,
      popular: true,
    },
    {
      nome: "Palmito 300g",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 1290,
      popular: false,
    },
    {
      nome: "Azeitona Verde 200g",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 690,
      popular: false,
    },
    {
      nome: "Pepino 1un",
      categoria: "Verduras e Legumes",
      unidade: "un",
      precoMedio: 190,
      popular: true,
    },
    {
      nome: "Rúcula 100g",
      categoria: "Verduras e Legumes",
      unidade: "pac",
      precoMedio: 350,
      popular: false,
    },

    // Padaria
    {
      nome: "Pão de Forma 500g",
      categoria: "Padaria",
      unidade: "pac",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Pão Francês 1kg",
      categoria: "Padaria",
      unidade: "kg",
      precoMedio: 1290,
      popular: true,
    },
    {
      nome: "Pão Integral 500g",
      categoria: "Padaria",
      unidade: "pac",
      precoMedio: 990,
      popular: true,
    },
    {
      nome: "Pão de Hambúrguer 6un",
      categoria: "Padaria",
      unidade: "pac",
      precoMedio: 690,
      popular: false,
    },
    {
      nome: "Pão de Hot Dog 8un",
      categoria: "Padaria",
      unidade: "pac",
      precoMedio: 590,
      popular: false,
    },
    {
      nome: "Biscoito Cream Cracker 400g",
      categoria: "Padaria",
      unidade: "pac",
      precoMedio: 550,
      popular: true,
    },
    {
      nome: "Biscoito Água e Sal 400g",
      categoria: "Padaria",
      unidade: "pac",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Biscoito Recheado Chocolate 140g",
      categoria: "Padaria",
      unidade: "pac",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Biscoito Recheado Morango 140g",
      categoria: "Padaria",
      unidade: "pac",
      precoMedio: 390,
      popular: false,
    },
    {
      nome: "Torrada 150g",
      categoria: "Padaria",
      unidade: "pac",
      precoMedio: 390,
      popular: false,
    },

    // Bebidas
    {
      nome: "Refrigerante Cola 2L",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 790,
      popular: true,
    },
    {
      nome: "Refrigerante Guaraná 2L",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 690,
      popular: true,
    },
    {
      nome: "Refrigerante Laranja 2L",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 690,
      popular: false,
    },
    {
      nome: "Refrigerante Cola 350ml Lata",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 350,
      popular: true,
    },
    {
      nome: "Refrigerante Guaraná 350ml Lata",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 320,
      popular: true,
    },
    {
      nome: "Suco de Laranja 1L",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 690,
      popular: true,
    },
    {
      nome: "Suco de Uva 1L",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Suco de Maracujá 1L",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 790,
      popular: false,
    },
    {
      nome: "Água Mineral 500ml",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 190,
      popular: true,
    },
    {
      nome: "Água Mineral 1,5L",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 290,
      popular: true,
    },
    {
      nome: "Água com Gás 500ml",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 250,
      popular: false,
    },
    {
      nome: "Cerveja Lata 350ml 12un",
      categoria: "Bebidas",
      unidade: "cx",
      precoMedio: 4590,
      popular: true,
    },
    {
      nome: "Cerveja Lata 350ml",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Vinho Tinto 750ml",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 3590,
      popular: false,
    },
    {
      nome: "Energético 250ml",
      categoria: "Bebidas",
      unidade: "un",
      precoMedio: 890,
      popular: false,
    },

    // Limpeza
    {
      nome: "Detergente 500ml",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 290,
      popular: true,
    },
    {
      nome: "Sabão em Pó 1kg",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 1290,
      popular: true,
    },
    {
      nome: "Sabão em Pó 500g",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 750,
      popular: true,
    },
    {
      nome: "Amaciante 2L",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 1490,
      popular: true,
    },
    {
      nome: "Amaciante 1L",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Água Sanitária 2L",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 590,
      popular: true,
    },
    {
      nome: "Água Sanitária 1L",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 350,
      popular: false,
    },
    {
      nome: "Desinfetante 500ml",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Limpa Vidros 500ml",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 690,
      popular: false,
    },
    {
      nome: "Esponja de Aço 8un",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 390,
      popular: true,
    },
    {
      nome: "Esponja de Cozinha 3un",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Pano de Chão 2un",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 590,
      popular: true,
    },
    {
      nome: "Vassoura",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 1290,
      popular: false,
    },
    {
      nome: "Rodo",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 990,
      popular: false,
    },
    {
      nome: "Saco de Lixo 50L 10un",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Saco de Lixo 30L 10un",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 690,
      popular: true,
    },
    {
      nome: "Papel Toalha 2un",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 790,
      popular: true,
    },
    {
      nome: "Papel Higiênico 12un",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 1690,
      popular: true,
    },
    {
      nome: "Papel Higiênico 4un",
      categoria: "Limpeza",
      unidade: "pac",
      precoMedio: 590,
      popular: true,
    },
    {
      nome: "Sabonete 90g",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 250,
      popular: true,
    },
    {
      nome: "Shampoo 350ml",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 1290,
      popular: true,
    },
    {
      nome: "Condicionador 350ml",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 1290,
      popular: true,
    },
    {
      nome: "Creme Dental 90g",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Fio Dental 50m",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 590,
      popular: false,
    },
    {
      nome: "Desodorante Aerosol",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 1590,
      popular: true,
    },
    {
      nome: "Álcool Gel 70 500ml",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 890,
      popular: false,
    },
    {
      nome: "Luvas de Limpeza",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 590,
      popular: false,
    },
    {
      nome: "Cloro 1L",
      categoria: "Limpeza",
      unidade: "un",
      precoMedio: 490,
      popular: false,
    },

    // Enlatados e Conservas
    {
      nome: "Atum em Óleo 170g",
      categoria: "Enlatados",
      unidade: "un",
      precoMedio: 790,
      popular: true,
    },
    {
      nome: "Atum na Água 170g",
      categoria: "Enlatados",
      unidade: "un",
      precoMedio: 850,
      popular: false,
    },
    {
      nome: "Sardinha em Óleo 125g",
      categoria: "Enlatados",
      unidade: "un",
      precoMedio: 490,
      popular: true,
    },
    {
      nome: "Sardinha em Molho 125g",
      categoria: "Enlatados",
      unidade: "un",
      precoMedio: 550,
      popular: false,
    },
    {
      nome: "Milho Verde Lata 200g",
      categoria: "Enlatados",
      unidade: "un",
      precoMedio: 250,
      popular: true,
    },
    {
      nome: "Ervilha Lata 200g",
      categoria: "Enlatados",
      unidade: "un",
      precoMedio: 280,
      popular: true,
    },
    {
      nome: "Extrato de Tomate 340g",
      categoria: "Enlatados",
      unidade: "un",
      precoMedio: 280,
      popular: true,
    },

    // Congelados
    {
      nome: "Pizza Congelada 400g",
      categoria: "Congelados",
      unidade: "un",
      precoMedio: 1590,
      popular: true,
    },
    {
      nome: "Lasanha Congelada 600g",
      categoria: "Congelados",
      unidade: "un",
      precoMedio: 1890,
      popular: true,
    },
    {
      nome: "Nuggets de Frango 500g",
      categoria: "Congelados",
      unidade: "pac",
      precoMedio: 1690,
      popular: true,
    },
    {
      nome: "Hambúrguer Bovino 560g",
      categoria: "Congelados",
      unidade: "pac",
      precoMedio: 1890,
      popular: true,
    },
    {
      nome: "Hambúrguer de Frango 560g",
      categoria: "Congelados",
      unidade: "pac",
      precoMedio: 1590,
      popular: false,
    },
    {
      nome: "Batata Congelada 500g",
      categoria: "Congelados",
      unidade: "pac",
      precoMedio: 990,
      popular: true,
    },
    {
      nome: "Legumes Congelados 300g",
      categoria: "Congelados",
      unidade: "pac",
      precoMedio: 690,
      popular: true,
    },
    {
      nome: "Polpa de Fruta 300g",
      categoria: "Congelados",
      unidade: "un",
      precoMedio: 490,
      popular: false,
    },
    {
      nome: "Sorvete 1,5L",
      categoria: "Congelados",
      unidade: "un",
      precoMedio: 2290,
      popular: true,
    },
    {
      nome: "Açaí 1L",
      categoria: "Congelados",
      unidade: "un",
      precoMedio: 2990,
      popular: false,
    },

    // Higiene Pessoal
    {
      nome: "Papel Higiênico 12un",
      categoria: "Higiene",
      unidade: "pac",
      precoMedio: 1690,
      popular: true,
    },
    {
      nome: "Sabonete Líquido 200ml",
      categoria: "Higiene",
      unidade: "un",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Absorvente 16un",
      categoria: "Higiene",
      unidade: "pac",
      precoMedio: 890,
      popular: true,
    },
    {
      nome: "Algodão 50g",
      categoria: "Higiene",
      unidade: "pac",
      precoMedio: 390,
      popular: false,
    },
    {
      nome: "Lenço Umedecido 48un",
      categoria: "Higiene",
      unidade: "pac",
      precoMedio: 690,
      popular: true,
    },

    // Utilidades
    {
      nome: "Prato Descartável 20un",
      categoria: "Utilidades",
      unidade: "pac",
      precoMedio: 890,
      popular: false,
    },
    {
      nome: "Copo Descartável 50un",
      categoria: "Utilidades",
      unidade: "pac",
      precoMedio: 790,
      popular: false,
    },
    {
      nome: "Guardanapo 50un",
      categoria: "Utilidades",
      unidade: "pac",
      precoMedio: 390,
      popular: false,
    },
    {
      nome: "Filme Plástico 30m",
      categoria: "Utilidades",
      unidade: "un",
      precoMedio: 890,
      popular: false,
    },
    {
      nome: "Papel Alumínio 30m",
      categoria: "Utilidades",
      unidade: "un",
      precoMedio: 1290,
      popular: false,
    },
    {
      nome: "Pilha AA 4un",
      categoria: "Utilidades",
      unidade: "pac",
      precoMedio: 1290,
      popular: false,
    },
    {
      nome: "Pilha AAA 4un",
      categoria: "Utilidades",
      unidade: "pac",
      precoMedio: 1290,
      popular: false,
    },
  ];

  // Usar createMany para performance
  try {
    await prisma.produto.createMany({
      data: produtos.map((p) => ({
        nome: p.nome,
        categoria: p.categoria,
        unidade: p.unidade,
        precoMedio: p.precoMedio,
        popular: p.popular,
      })),
      skipDuplicates: true,
    });
  } catch {
    // Se createMany falhar, usar upsert individual
    for (const p of produtos) {
      await prisma.produto.upsert({
        where: { nome: p.nome },
        update: {},
        create: {
          nome: p.nome,
          categoria: p.categoria,
          unidade: p.unidade,
          precoMedio: p.precoMedio,
          popular: p.popular,
        },
      });
    }
  }

  console.log(`✅ ${produtos.length} produtos cadastrados!`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
