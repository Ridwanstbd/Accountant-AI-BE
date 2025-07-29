// prisma/seed.js
const {
  PrismaClient,
  AccountType,
  JournalType,
  JournalStatus,
} = require("@prisma/client");
const { Decimal } = require("@prisma/client/runtime/library");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (optional - hati-hati di production!)
  // await prisma.journalEntry.deleteMany();
  // await prisma.journal.deleteMany();
  // await prisma.saleItem.deleteMany();
  // await prisma.sale.deleteMany();
  // await prisma.customer.deleteMany();
  // await prisma.account.deleteMany();
  // await prisma.monthlyAIRecommendation.deleteMany();

  // Seed Chart of Accounts (Bagan Akun)
  const accounts = [
    // ASSETS (Aktiva)
    {
      code: "101",
      name: "Kas",
      type: AccountType.ASSET,
      category: "Current Asset",
      balance: new Decimal(0),
    },
    {
      code: "102",
      name: "Bank BCA",
      type: AccountType.ASSET,
      category: "Current Asset",
      balance: new Decimal(0),
    },
    {
      code: "103",
      name: "Bank Mandiri",
      type: AccountType.ASSET,
      category: "Current Asset",
      balance: new Decimal(0),
    },
    {
      code: "111",
      name: "Piutang Usaha",
      type: AccountType.ASSET,
      category: "Current Asset",
      balance: new Decimal(0),
    },
    {
      code: "121",
      name: "Persediaan Barang",
      type: AccountType.ASSET,
      category: "Current Asset",
      balance: new Decimal(0),
    },
    {
      code: "131",
      name: "Peralatan",
      type: AccountType.ASSET,
      category: "Fixed Asset",
      balance: new Decimal(0),
    },
    {
      code: "132",
      name: "Akumulasi Penyusutan Peralatan",
      type: AccountType.ASSET,
      category: "Fixed Asset",
      balance: new Decimal(0),
    },

    // LIABILITIES (Kewajiban)
    {
      code: "201",
      name: "Utang Usaha",
      type: AccountType.LIABILITY,
      category: "Current Liability",
      balance: new Decimal(0),
    },
    {
      code: "202",
      name: "Utang Bank",
      type: AccountType.LIABILITY,
      category: "Long Term Liability",
      balance: new Decimal(0),
    },
    {
      code: "211",
      name: "PPN Keluaran",
      type: AccountType.LIABILITY,
      category: "Tax Liability",
      balance: new Decimal(0),
    },

    // EQUITY (Modal)
    {
      code: "301",
      name: "Modal Pemilik",
      type: AccountType.EQUITY,
      category: "Owner Equity",
      balance: new Decimal(100000000),
    },
    {
      code: "302",
      name: "Laba Ditahan",
      type: AccountType.EQUITY,
      category: "Retained Earnings",
      balance: new Decimal(0),
    },

    // REVENUE (Pendapatan)
    {
      code: "401",
      name: "Penjualan",
      type: AccountType.REVENUE,
      category: "Sales Revenue",
      balance: new Decimal(0),
    },
    {
      code: "402",
      name: "Pendapatan Lain-lain",
      type: AccountType.REVENUE,
      category: "Other Revenue",
      balance: new Decimal(0),
    },

    // EXPENSES (Beban)
    {
      code: "501",
      name: "Beban Gaji",
      type: AccountType.EXPENSE,
      category: "Operating Expense",
      balance: new Decimal(0),
    },
    {
      code: "502",
      name: "Beban Listrik",
      type: AccountType.EXPENSE,
      category: "Operating Expense",
      balance: new Decimal(0),
    },
    {
      code: "503",
      name: "Beban Telepon",
      type: AccountType.EXPENSE,
      category: "Operating Expense",
      balance: new Decimal(0),
    },
    {
      code: "504",
      name: "Beban Penyusutan",
      type: AccountType.EXPENSE,
      category: "Operating Expense",
      balance: new Decimal(0),
    },
    {
      code: "505",
      name: "Beban Lain-lain",
      type: AccountType.EXPENSE,
      category: "Other Expense",
      balance: new Decimal(0),
    },
  ];

  console.log("📊 Creating Chart of Accounts...");
  for (const account of accounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: {
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        balance: account.balance,
        isActive: true,
      },
    });
  }

  // Seed Customers
  const customers = [
    {
      code: "CUST-0001",
      name: "PT. Maju Jaya",
      address: "Jl. Sudirman No. 123, Jakarta",
      phone: "021-1234567",
    },
    {
      code: "CUST-0002",
      name: "CV. Berkah Sentosa",
      address: "Jl. Gatot Subroto No. 45, Surabaya",
      phone: "031-9876543",
    },
    {
      code: "CUST-0003",
      name: "Toko Sinar Harapan",
      address: "Jl. Malioboro No. 67, Yogyakarta",
      phone: "0274-555666",
    },
  ];

  console.log("👥 Creating Customers...");
  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { code: customer.code },
      update: {},
      create: customer,
    });
  }

  // Seed Sample Sales
  console.log("💰 Creating Sample Sales...");
  const sampleCustomers = await prisma.customer.findMany();

  if (sampleCustomers.length > 0) {
    const sampleSale = await prisma.sale.create({
      data: {
        saleNo: "SALE-202507-0001",
        date: new Date("2025-07-15"),
        customerId: sampleCustomers[0].id,
        subtotal: new Decimal(1000000),
        tax: new Decimal(100000),
        total: new Decimal(1100000),
        status: "PAID",
        items: {
          create: [
            {
              productName: "Laptop Asus",
              quantity: 1,
              price: new Decimal(800000),
              amount: new Decimal(800000),
            },
            {
              productName: "Mouse Wireless",
              quantity: 2,
              price: new Decimal(100000),
              amount: new Decimal(200000),
            },
          ],
        },
      },
    });

    console.log("📝 Creating Sample Journal Entry...");
    // Buat jurnal penjualan untuk sample sale
    const kasAccount = await prisma.account.findUnique({
      where: { code: "101" },
    });
    const penjualanAccount = await prisma.account.findUnique({
      where: { code: "401" },
    });
    const ppnAccount = await prisma.account.findUnique({
      where: { code: "211" },
    });

    if (kasAccount && penjualanAccount && ppnAccount) {
      const journal = await prisma.journal.create({
        data: {
          journalNo: "JP-202412-0001",
          date: new Date("2024-12-15"),
          reference: `Penjualan ${sampleSale.saleNo} - ${sampleCustomers[0].name}`,
          type: JournalType.SALES,
          totalAmount: new Decimal(1100000),
          status: JournalStatus.POSTED,
          entries: {
            create: [
              {
                debitAccountId: kasAccount.id,
                description: `Penerimaan dari penjualan ${sampleSale.saleNo}`,
                debitAmount: new Decimal(1100000),
                creditAmount: new Decimal(0),
              },
              {
                creditAccountId: penjualanAccount.id,
                description: `Penjualan kepada ${sampleCustomers[0].name}`,
                debitAmount: new Decimal(0),
                creditAmount: new Decimal(1000000),
              },
              {
                creditAccountId: ppnAccount.id,
                description: `PPN Penjualan ${sampleSale.saleNo}`,
                debitAmount: new Decimal(0),
                creditAmount: new Decimal(100000),
              },
            ],
          },
        },
      });

      // Update sale dengan journal ID dan update saldo akun
      await prisma.sale.update({
        where: { id: sampleSale.id },
        data: { journalId: journal.id },
      });

      // Update account balances
      await prisma.account.update({
        where: { id: kasAccount.id },
        data: { balance: { increment: new Decimal(1100000) } },
      });

      await prisma.account.update({
        where: { id: penjualanAccount.id },
        data: { balance: { increment: new Decimal(1000000) } },
      });

      await prisma.account.update({
        where: { id: ppnAccount.id },
        data: { balance: { increment: new Decimal(100000) } },
      });
    }
  }

  console.log("✅ Seeding completed successfully!");
  console.log("📋 Summary:");
  console.log(`- ${accounts.length} accounts created`);
  console.log(`- ${customers.length} customers created`);
  console.log("- 1 sample sale with journal entry created");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
