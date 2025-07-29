// models/index.js
const prisma = require("../config/database");

module.exports = {
  prisma,
  Account: prisma.account,
  Journal: prisma.journal,
  JournalEntry: prisma.journalEntry,
  Customer: prisma.customer,
  Sale: prisma.sale,
  SaleItem: prisma.saleItem,
  Recommendation: prisma.monthlyAIRecommendation,
};
