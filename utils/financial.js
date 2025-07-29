const processFinancialData = (journalEntries) => {
  let totalRevenue = 0;
  let totalExpense = 0;
  const expenseCategories = {};
  const revenueCategories = {};
  const transactionSummaries = [];

  journalEntries.forEach((entry) => {
    const description = entry.description;
    const debitAccountType = entry.debitAccount?.type;
    const creditAccountType = entry.creditAccount?.type;

    // Process expenses
    if (debitAccountType === "EXPENSE") {
      totalExpense += entry.debitAmount.toNumber();
      const category = entry.debitAccount?.category || "Uncategorized Expense";
      expenseCategories[category] =
        (expenseCategories[category] || 0) + entry.debitAmount.toNumber();
    }

    // Process revenue
    if (creditAccountType === "REVENUE") {
      totalRevenue += entry.creditAmount.toNumber();
      const category = entry.creditAccount?.category || "Uncategorized Revenue";
      revenueCategories[category] =
        (revenueCategories[category] || 0) + entry.creditAmount.toNumber();
    }

    // Create transaction summary
    transactionSummaries.push(
      `- ${entry.journal.journalNo}: ${description} (Debit: ${
        entry.debitAccount?.name || "N/A"
      }, Credit: ${entry.creditAccount?.name || "N/A"}, Amount: ${
        entry.debitAmount.toNumber() || entry.creditAmount.toNumber()
      })`
    );
  });

  return {
    totalRevenue,
    totalExpense,
    expenseCategories,
    revenueCategories,
    transactionSummaries,
    netIncome: totalRevenue - totalExpense,
  };
};

const generateFinancialSummary = (financialData, month, year) => {
  const {
    totalRevenue,
    totalExpense,
    expenseCategories,
    revenueCategories,
    transactionSummaries,
    netIncome,
  } = financialData;

  return `
    Laporan Keuangan Bulan ${month}/${year}:
    Total Pendapatan: Rp${totalRevenue.toLocaleString("id-ID")}
    Total Beban: Rp${totalExpense.toLocaleString("id-ID")}
    Laba/Rugi Bersih: Rp${netIncome.toLocaleString("id-ID")}

    Rincian Beban:
    ${Object.entries(expenseCategories)
      .map(([cat, amount]) => `- ${cat}: Rp${amount.toLocaleString("id-ID")}`)
      .join("\n")}

    Rincian Pendapatan:
    ${Object.entries(revenueCategories)
      .map(([cat, amount]) => `- ${cat}: Rp${amount.toLocaleString("id-ID")}`)
      .join("\n")}

    Beberapa transaksi signifikan:
    ${transactionSummaries.slice(0, 5).join("\n")}
    (dan ${Math.max(0, transactionSummaries.length - 5)} transaksi lainnya...)

    Berdasarkan data keuangan di atas, berikan rekomendasi AI untuk keuangan bulanan. Fokus pada rekomendasi penghematan biaya, optimalisasi pendapatan, dan manajemen arus kas. Berikan saran yang spesifik dan dapat ditindaklanjuti.
  `;
};

const determineRecommendationType = (aiText) => {
  const lowerText = aiText.toLowerCase();

  if (lowerText.includes("hemat biaya") || lowerText.includes("pengeluaran")) {
    return "CostSaving";
  } else if (
    lowerText.includes("pendapatan") ||
    lowerText.includes("penjualan")
  ) {
    return "RevenueOptimization";
  } else if (
    lowerText.includes("arus kas") ||
    lowerText.includes("likuiditas")
  ) {
    return "CashFlow";
  }

  return "General";
};

module.exports = {
  processFinancialData,
  generateFinancialSummary,
  determineRecommendationType,
};
