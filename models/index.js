const prisma = require("../config/database");

module.exports = {
  prisma,
  Business: prisma.business,
  BusinessUser: prisma.businessUser,
  User: prisma.user,
  UserProfile: prisma.userProfile,
  Role: prisma.role,
  UserRole: prisma.userRole,
  Permission: prisma.permission,
  RolePermission: prisma.rolePermission,
  Account: prisma.account,
  Journal: prisma.journal,
  JournalEntry: prisma.journalEntry,
  Customer: prisma.customer,
  Sale: prisma.sale,
  SaleItem: prisma.saleItem,
  Recommendation: prisma.monthlyAIRecommendation,
};
