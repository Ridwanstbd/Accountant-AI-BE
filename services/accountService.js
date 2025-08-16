const { prisma } = require("../models");
const { ACCOUNT_TYPES } = require("../utils/constants");

class AccountService {
  async getAllAccounts(businessId, filters = {}) {
    const { type, category, active } = filters;

    const where = { businessId };
    if (type) where.type = type;
    if (category) where.category = category;
    if (active !== undefined) where.isActive = active === "true";

    return await prisma.account.findMany({
      where,
      include: {
        business: true,
      },
      orderBy: { code: "asc" },
    });
  }

  async getAccountById(businessId, id) {
    return await prisma.account.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        business: true,
        debitEntries: {
          include: { journal: true },
        },
        creditEntries: {
          include: { journal: true },
        },
      },
    });
  }

  async createAccount(businessId, data) {
    const { code, name, type, category, balance = 0 } = data;

    const validAccountTypes = Object.values(ACCOUNT_TYPES);
    if (!validAccountTypes.includes(type)) {
      throw new Error("Tipe Akun Tidak Valid");
    }

    const existingAccount = await prisma.account.findFirst({
      where: {
        businessId,
        code,
      },
    });

    if (existingAccount) {
      throw new Error("Kode akun sudah digunakan dalam business ini");
    }

    return await prisma.account.create({
      data: {
        businessId,
        code,
        name,
        type,
        category,
        balance: parseFloat(balance),
      },
    });
  }

  async updateAccount(businessId, id, data) {
    const { name, type, category, isActive } = data;

    if (type) {
      const validAccountTypes = Object.values(ACCOUNT_TYPES);
      if (!validAccountTypes.includes(type)) {
        throw new Error("Tipe Akun Tidak Valid");
      }
    }

    // Pastikan account milik business yang benar
    const account = await this.getAccountById(businessId, id);
    if (!account) {
      throw new Error("Account tidak ditemukan atau tidak memiliki akses");
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

  async deactivateAccount(businessId, id) {
    // Pastikan account milik business yang benar
    const account = await this.getAccountById(businessId, id);
    if (!account) {
      throw new Error("Account tidak ditemukan atau tidak memiliki akses");
    }

    return await prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getTrialBalance(businessId) {
    const accounts = await prisma.account.findMany({
      where: {
        businessId,
        isActive: true,
      },
      orderBy: { code: "asc" },
    });

    return accounts.map((account) => ({
      code: account.code,
      name: account.name,
      type: account.type,
      balance: account.balance,
    }));
  }

  async getAccountsByType(businessId, type) {
    const validAccountTypes = Object.values(ACCOUNT_TYPES);
    if (!validAccountTypes.includes(type)) {
      throw new Error("Tipe akun tidak valid");
    }

    return await prisma.account.findMany({
      where: {
        businessId,
        type,
        isActive: true,
      },
      orderBy: { code: "asc" },
    });
  }
}

module.exports = new AccountService();
