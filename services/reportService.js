const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit-table");

const { prisma } = require("../models");

class ReportService {
  async getGeneralLedger(businessId, filters) {
    const { startDate, endDate, accountId } = filters;

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    return await prisma.journalEntry.findMany({
      where: {
        journal: {
          businessId,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
        },
        OR: [{ debitAccountId: accountId }, { creditAccountId: accountId }],
      },
      include: { journal: true, debitAccount: true, creditAccount: true },
      orderBy: { journal: { date: "asc" } },
    });
  }

  async getProfitAndLoss(businessId, startDate, endDate) {
    const isValidDate = (d) => d instanceof Date && !isNaN(d);

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isValidDate(start) || !isValidDate(end)) {
      console.error("DEBUG: StartDate:", startDate, "EndDate:", endDate);
      throw new Error(
        "Laporan tidak dapat diproses karena rentang tanggal tidak valid"
      );
    }

    const accounts = await prisma.account.findMany({
      where: { businessId, type: { in: ["REVENUE", "EXPENSE"] } },
      include: {
        debitEntries: {
          where: { journal: { date: { gte: start, lte: end } } },
        },
        creditEntries: {
          where: { journal: { date: { gte: start, lte: end } } },
        },
      },
    });

    let totalRevenue = 0;
    let totalExpense = 0;

    const report = accounts.map((acc) => {
      const debitTotal = acc.debitEntries.reduce(
        (sum, e) => sum + Number(e.debitAmount || 0),
        0
      );
      const creditTotal = acc.creditEntries.reduce(
        (sum, e) => sum + Number(e.creditAmount || 0),
        0
      );

      // Revenue + di Credit, Expense + di Debit
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
      period: { start, end },
    };
  }

  async getBalanceSheet(businessId, endDate = new Date()) {
    const end = new Date(endDate);

    // Ambil semua akun Asset, Liability, Equity
    const accounts = await prisma.account.findMany({
      where: {
        businessId,
        type: { in: ["ASSET", "LIABILITY", "EQUITY"] },
        isActive: true,
      },
      include: {
        debitEntries: { where: { journal: { date: { lte: end } } } },
        creditEntries: { where: { journal: { date: { lte: end } } } },
      },
    });

    const calculateHistoricalBalance = (acc) => {
      const d = acc.debitEntries.reduce(
        (s, e) => s + Number(e.debitAmount || 0),
        0
      );
      const c = acc.creditEntries.reduce(
        (s, e) => s + Number(e.creditAmount || 0),
        0
      );

      return acc.type === "ASSET" ? d - c : c - d;
    };

    const formattedAccounts = accounts.map((acc) => ({
      ...acc,
      calculatedBalance: calculateHistoricalBalance(acc),
    }));

    const assets = formattedAccounts.filter((a) => a.type === "ASSET");
    const liabilities = formattedAccounts.filter((a) => a.type === "LIABILITY");
    const equity = formattedAccounts.filter((a) => a.type === "EQUITY");

    const sum = (items) => items.reduce((s, a) => s + a.calculatedBalance, 0);

    return {
      assets: { items: assets, total: sum(assets) },
      liabilities: { items: liabilities, total: sum(liabilities) },
      equity: { items: equity, total: sum(equity) },
      isBalanced:
        Math.abs(sum(assets) - (sum(liabilities) + sum(equity))) < 0.01, // Avoid float precision issues
      asOf: end,
    };
  }

  async getFinancialRatios(businessId, startDate, endDate) {
    // Gunakan fungsi yang sudah ada agar logika perhitungan tunggal
    const pl = await this.getProfitAndLoss(businessId, startDate, endDate);
    const bs = await this.getBalanceSheet(businessId, endDate);

    // Asumsi Fixed & Variable Cost (bisa disempurnakan dengan kategori akun di masa depan)
    const fixedCosts = pl.totalExpense * 0.6;
    const variableCosts = pl.totalExpense * 0.4;

    const bep =
      pl.totalRevenue > 0
        ? fixedCosts / (1 - variableCosts / pl.totalRevenue)
        : 0;
    const roi =
      bs.assets.total > 0 ? (pl.netProfit / bs.assets.total) * 100 : 0;

    return {
      ...pl, // Sertakan data P&L agar AI tidak perlu hitung ulang
      totalAssets: bs.assets.total,
      bep: Math.round(bep),
      roi: parseFloat(roi.toFixed(2)),
    };
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
