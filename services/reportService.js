const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit-table");

const { prisma } = require("../models");

class ReportService {
  // 1. LAPORAN BUKU BESAR (General Ledger)
  async getGeneralLedger(businessId, filters) {
    const { startDate, endDate, accountId } = filters;
    const where = { journal: { businessId } };

    if (accountId) where.debitAccountId = accountId; // Atau creditAccountId (perlu logika OR)
    if (startDate || endDate) {
      where.journal.date = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    return await prisma.journalEntry.findMany({
      where: {
        OR: [
          {
            debitAccountId: accountId,
            journal: { businessId, date: where.journal.date },
          },
          {
            creditAccountId: accountId,
            journal: { businessId, date: where.journal.date },
          },
        ],
      },
      include: { journal: true, debitAccount: true, creditAccount: true },
      orderBy: { journal: { date: "asc" } },
    });
  }

  // 2. LAPORAN LABA RUGI (Profit & Loss)
  async getProfitAndLoss(businessId, startDate, endDate) {
    const accounts = await prisma.account.findMany({
      where: { businessId, type: { in: ["REVENUE", "EXPENSE"] } },
      include: {
        debitEntries: {
          where: { journal: { date: { gte: startDate, lte: endDate } } },
        },
        creditEntries: {
          where: { journal: { date: { gte: startDate, lte: endDate } } },
        },
      },
    });

    let totalRevenue = 0;
    let totalExpense = 0;

    const report = accounts.map((acc) => {
      const debitTotal = acc.debitEntries.reduce(
        (sum, e) => sum + e.debitAmount,
        0
      );
      const creditTotal = acc.creditEntries.reduce(
        (sum, e) => sum + e.creditAmount,
        0
      );

      // Revenue bertambah di Credit, Expense bertambah di Debit
      const balance =
        acc.type === "REVENUE"
          ? creditTotal - debitTotal
          : debitTotal - creditTotal;

      if (acc.type === "REVENUE") totalRevenue += balance;
      else totalExpense += balance;

      return { name: acc.name, type: acc.type, balance };
    });

    return {
      details: report,
      totalRevenue,
      totalExpense,
      netProfit: totalRevenue - totalExpense,
    };
  }

  // 3. NERACA (Balance Sheet)
  async getBalanceSheet(businessId) {
    const accounts = await prisma.account.findMany({
      where: {
        businessId,
        type: { in: ["ASSET", "LIABILITY", "EQUITY"] },
        isActive: true,
      },
    });

    const assets = accounts.filter((a) => a.type === "ASSET");
    const liabilities = accounts.filter((a) => a.type === "LIABILITY");
    const equity = accounts.filter((a) => a.type === "EQUITY");

    const sum = (accs) => accs.reduce((s, a) => s + parseFloat(a.balance), 0);

    return {
      assets: { items: assets, total: sum(assets) },
      liabilities: { items: liabilities, total: sum(liabilities) },
      equity: { items: equity, total: sum(equity) },
      isBalanced: sum(assets) === sum(liabilities) + sum(equity),
    };
  }

  // 4. ANALISIS BEP & ROI
  async getFinancialRatios(businessId) {
    const pl = await this.getProfitAndLoss(
      businessId,
      new Date(new Date().getFullYear(), 0, 1),
      new Date()
    );
    const bs = await this.getBalanceSheet(businessId);

    // Asumsi: Fixed Cost diambil dari kategori beban tertentu (misal: Gaji, Sewa)
    // Di sini kita sederhanakan: Total Expense sebagai proksi
    const fixedCosts = pl.totalExpense * 0.6; // Contoh asumsi 60% expense adalah fixed
    const variableCosts = pl.totalExpense * 0.4;
    const revenue = pl.totalRevenue;

    // BEP Formula: Fixed Cost / (1 - (Variable Cost / Revenue))
    const bep = revenue > 0 ? fixedCosts / (1 - variableCosts / revenue) : 0;

    // ROI Formula: (Net Profit / Total Asset) * 100
    const roi =
      bs.assets.total > 0 ? (pl.netProfit / bs.assets.total) * 100 : 0;

    return { bep, roi, netProfit: pl.netProfit, totalAssets: bs.assets.total };
  }

  async exportProfitLossExcel(businessId, data, filters) {
    // 1. Ambil Nama Bisnis agar laporan tidak "anonim"
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Profit and Loss");

    // 2. Menambahkan Header Informasi Bisnis
    sheet.mergeCells("A1:C1");
    sheet.getCell("A1").value = business?.name || "LAPORAN BISNIS";
    sheet.getCell("A1").font = { size: 16, bold: true };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    sheet.mergeCells("A2:C2");
    sheet.getCell("A2").value = `Periode: ${filters.startDate || "-"} s/d ${
      filters.endDate || "-"
    }`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]); // Baris kosong

    // 3. Header Tabel
    sheet.addRow(["Nama Akun", "Tipe", "Saldo (IDR)"]);
    sheet.getRow(4).font = { bold: true };
    sheet.getRow(4).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" },
    };

    // 4. Input Data
    data.details.forEach((item) => {
      sheet.addRow([item.name, item.type, item.balance]);
    });

    // 5. Total dan Garis Bawah
    sheet.addRow([]);
    const revenueRow = sheet.addRow([
      "TOTAL PENDAPATAN",
      "",
      data.totalRevenue,
    ]);
    const expenseRow = sheet.addRow(["TOTAL BEBAN", "", data.totalExpense]);
    const profitRow = sheet.addRow(["LABA/RUGI BERSIH", "", data.netProfit]);

    // Styling baris profit
    profitRow.font = { bold: true, size: 12 };
    profitRow.getCell(3).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: data.netProfit >= 0 ? "FFCCFFCC" : "FFFFCCCC" }, // Hijau jika untung, merah jika rugi
    };

    return await workbook.xlsx.writeBuffer();
  }

  // EKSPOR KE PDF
  async exportProfitLossPDF(businessId, data) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      let buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      doc.text("LAPORAN LABA RUGI", { align: "center", size: 18 });
      doc.moveDown();

      const table = {
        title: `Business ID: ${businessId}`,
        headers: ["Nama Akun", "Tipe", "Saldo (IDR)"],
        rows: [
          ...data.details.map((d) => [
            d.name,
            d.type,
            d.balance.toLocaleString(),
          ]),
          ["---", "---", "---"],
          ["NET PROFIT", "", data.netProfit.toLocaleString()],
        ],
      };

      doc.table(table, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
      });
      doc.end();
    });
  }
}

module.exports = new ReportService();
