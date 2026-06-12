const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db"
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Limpando banco de dados...");
  await prisma.lead.deleteMany();

  console.log("Inserindo leads fictícios para teste...");

  const leads = [
    {
      name: "Rafael Silva",
      phone: "5511999998888",
      product: "Energia Solar Residencial",
      status: "NOVO",
      observations: "Casa com telhado face norte livre de sombras. Consumo médio de R$ 450,00.",
      createdAt: new Date(),
    },
    {
      name: "Ana Oliveira Santos",
      phone: "5521988887777",
      product: "Assinatura de Energia Livre",
      status: "EM_CONTATO",
      observations: "Apartamento alugado. Interessada em desconto na conta sem instalar painéis.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      name: "Roberto Camargo de Souza",
      phone: "5519977776666",
      product: "Energia Solar Comercial",
      status: "CONVERTIDO",
      observations: "Supermercado de bairro. Fechou contrato de projeto de 15kWp.",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      name: "Mariana Costa",
      phone: "5531966665555",
      product: "Adequação Tarifária / Demanda",
      status: "PERDIDO",
      lossReason: "Orçamento concorrente 15% mais barato",
      observations: "Indústria de panificação. Reclama de multa por excesso de demanda reativa.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      name: "Juliana Mendes",
      phone: "5511955554444",
      product: "Energia Solar Residencial",
      status: "NOVO",
      observations: "Quer fazer orçamento para casa de praia em Ubatuba.",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
    {
      name: "Carlos Eduardo Gimenes",
      phone: "5581944443333",
      product: "Assinatura de Energia Livre",
      status: "EM_CONTATO",
      observations: "Quer saber mais sobre o prazo de fidelidade do contrato.",
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    },
    {
      name: "Padaria Bella Vista Ltda",
      phone: "5511933332222",
      product: "Energia Solar Comercial",
      status: "CONVERTIDO",
      observations: "Consumo alto em horário comercial. Assinatura do contrato de compra facilitada.",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    },
    {
      name: "Bruno Albuquerque",
      phone: "5521922221111",
      product: "Energia Solar Residencial",
      status: "PERDIDO",
      lossReason: "Financiamento bancário reprovado",
      observations: "Fez simulação de parcelas, mas score de crédito impediu aprovação da taxa especial.",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    },
    {
      name: "Fernanda Lima Reis",
      phone: "5571911110000",
      product: "Outro",
      status: "NOVO",
      observations: "Interesse em consultoria de eficiência energética em galpão logístico.",
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: lead,
    });
  }

  console.log("Banco de dados populado com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
