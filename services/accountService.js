const { prisma } = require("../models");
const { ACCOUNT_TYPES } = require("../utils/constants");

class AccountService {
  async getAllAccounts(filters = {}) {
    const { type, category, active } = filters;

    const where = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (active !== undefined) where.isActive = active === "true";

    return await prisma.account.findMany({
      where,
      orderBy: { code: "asc" },
    });
  }

  async getAccountById(id) {
    return await prisma.account.findUnique({
      where: { id },
      include: {
        debitEntries: {
          include: { journal: true },
        },
        creditEntries: {
          include: { journal: true },
        },
      },
    });
  }

  async createAccount(data) {
    const { code, name, type, category, balance = 0 } = data;

    const validAccountTypes = Object.values(ACCOUNT_TYPES);
    if (!validAccountTypes.includes(type)) {
      throw new Error("Tipe Akun Tidak Valid");
    }

    const existingAccount = await prisma.account.findUnique({
      where: { code },
    });

    if (existingAccount) {
      throw new Error("Kode akun sudah digunakan");
    }

    return await prisma.account.create({
      data: {
        code,
        name,
        type,
        category,
        balance: parseFloat(balance),
      },
    });
  }

  async updateAccount(id, data) {
    const { name, type, category, isActive } = data;

    if (type) {
      const validAccountTypes = Object.values(ACCOUNT_TYPES);
      if (!validAccountTypes.includes(type)) {
        throw new Error("Tipe Akun Tidak Valid");
      }
    }

    return await prisma.account.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  async deactivateAccount(id) {
    return await prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getTrialBalance() {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    return accounts.map((account) => ({
      code: account.code,
      name: account.name,
      type: account.type,
      balance: account.balance,
    }));
  }

  async getAccountsByType(type) {
    const validAccountTypes = Object.values(ACCOUNT_TYPES);
    if (!validAccountTypes.includes(type)) {
      throw new Error("Tipe akun tidak valid");
    }

    return await prisma.account.findMany({
      where: {
        type,
        isActive: true,
      },
      orderBy: { code: "asc" },
    });
  }
}

module.exports = new AccountService();
