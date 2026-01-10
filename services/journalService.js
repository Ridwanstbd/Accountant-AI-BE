const { prisma } = require("../models");
const {
  generateJournalNumber,
  validateJournalBalance,
} = require("../utils/helpers");

class JournalService {
  async getAllJournals(businessId, filters = {}) {
    const { type, status, startDate, endDate } = filters;

    const where = { businessId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return await prisma.journal.findMany({
      where,
      include: {
        business: true,
        entries: {
          include: {
            debitAccount: true,
            creditAccount: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  async getJournalById(businessId, id) {
    return await prisma.journal.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        business: true,
        entries: {
          include: {
            debitAccount: true,
            creditAccount: true,
          },
        },
      },
    });
  }

  async createJournal(businessId, data) {
    const { date, reference, type, entries } = data;

    if (!date || !type || !entries || !Array.isArray(entries)) {
      throw new Error("Data journal tidak lengkap");
    }

    if (!validateJournalBalance(entries)) {
      throw new Error("Total debit dan kredit harus seimbang");
    }
    const getPrefix = (t) => {
      const mapping = {
        GENERAL: "JU",
        SALES: "JP",
        EXPENSE: "JK",
        PURCHASE: "JB",
        ADJUSTMENT: "JA",
        PAYMENT: "PY",
      };
      return mapping[t] || "J";
    };

    const prefix = getPrefix(type);

    const lastJournal = await prisma.journal.findFirst({
      where: {
        businessId,
        journalNo: { startsWith: prefix },
      },
      orderBy: { journalNo: "desc" },
    });

    const journalNo = generateJournalNumber(type, lastJournal?.journalNo);

    const totalAmount = entries.reduce((sum, entry) => {
      return sum + parseFloat(entry.debitAmount || 0);
    }, 0);

    return await prisma.$transaction(async (prisma) => {
      const journal = await prisma.journal.create({
        data: {
          businessId,
          journalNo,
          date: new Date(date),
          reference: reference || `Journal ${journalNo}`,
          type,
          totalAmount,
          status: "DRAFT",
        },
      });

      for (const entry of entries) {
        if (!entry.debitAccountId && !entry.creditAccountId) {
          throw new Error("Setiap entry harus memiliki akun debit atau kredit");
        }

        if (entry.debitAccountId) {
          const debitAccount = await prisma.account.findFirst({
            where: { id: entry.debitAccountId, businessId },
          });
          if (!debitAccount) {
            throw new Error("Account debit tidak ditemukan dalam business ini");
          }
        }

        if (entry.creditAccountId) {
          const creditAccount = await prisma.account.findFirst({
            where: { id: entry.creditAccountId, businessId },
          });
          if (!creditAccount) {
            throw new Error(
              "Account kredit tidak ditemukan dalam business ini"
            );
          }
        }

        await prisma.journalEntry.create({
          data: {
            journalId: journal.id,
            debitAccountId: entry.debitAccountId || null,
            creditAccountId: entry.creditAccountId || null,
            description: entry.description || `Journal Entry ${journalNo}`,
            debitAmount: parseFloat(entry.debitAmount || 0),
            creditAmount: parseFloat(entry.creditAmount || 0),
          },
        });
      }

      return await prisma.journal.findUnique({
        where: { id: journal.id },
        include: {
          business: true,
          entries: {
            include: {
              debitAccount: true,
              creditAccount: true,
            },
          },
        },
      });
    });
  }

  async createSalesJournal(businessId, data) {
    const { saleId, cashAccountId, salesAccountId, taxAccountId } = data;

    if (!saleId || !cashAccountId || !salesAccountId) {
      throw new Error("Data untuk membuat journal penjualan tidak lengkap");
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        businessId,
      },
      include: { customer: true },
    });

    if (!sale) {
      throw new Error(
        "Data penjualan tidak ditemukan atau tidak memiliki akses"
      );
    }

    if (sale.journalId) {
      throw new Error("Penjualan ini sudah memiliki journal");
    }

    const [cashAccount, salesAccount, taxAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: cashAccountId, businessId } }),
      prisma.account.findFirst({ where: { id: salesAccountId, businessId } }),
      taxAccountId
        ? prisma.account.findFirst({ where: { id: taxAccountId, businessId } })
        : null,
    ]);

    if (!cashAccount) {
      throw new Error("Cash account tidak ditemukan dalam business ini");
    }
    if (!salesAccount) {
      throw new Error("Sales account tidak ditemukan dalam business ini");
    }
    if (taxAccountId && !taxAccount) {
      throw new Error("Tax account tidak ditemukan dalam business ini");
    }

    const lastJournal = await prisma.journal.findFirst({
      where: {
        businessId,
        journalNo: { startsWith: "JP" },
      },
      orderBy: { journalNo: "desc" },
    });

    const journalNo = generateJournalNumber("SALES", lastJournal?.journalNo);

    return await prisma.$transaction(async (prisma) => {
      const journal = await prisma.journal.create({
        data: {
          businessId,
          journalNo,
          date: sale.date,
          reference: `Penjualan ${sale.saleNo} - ${sale.customer.name}`,
          type: "SALES",
          totalAmount: sale.total,
          status: "DRAFT",
        },
      });

      await prisma.journalEntry.create({
        data: {
          journalId: journal.id,
          debitAccountId: cashAccountId,
          creditAccountId: null,
          description: `Penerimaan dari penjualan ${sale.saleNo}`,
          debitAmount: sale.total,
          creditAmount: 0,
        },
      });

      await prisma.journalEntry.create({
        data: {
          journalId: journal.id,
          debitAccountId: null,
          creditAccountId: salesAccountId,
          description: `Penjualan kepada ${sale.customer.name}`,
          debitAmount: 0,
          creditAmount: sale.subtotal,
        },
      });

      if (sale.tax > 0 && taxAccountId) {
        await prisma.journalEntry.create({
          data: {
            journalId: journal.id,
            debitAccountId: null,
            creditAccountId: taxAccountId,
            description: `Pajak Penjualan ${sale.saleNo}`,
            debitAmount: 0,
            creditAmount: sale.tax,
          },
        });
      }

      await prisma.sale.update({
        where: { id: saleId },
        data: { journalId: journal.id },
      });

      return await prisma.journal.findUnique({
        where: { id: journal.id },
        include: {
          business: true,
          entries: {
            include: {
              debitAccount: true,
              creditAccount: true,
            },
          },
        },
      });
    });
  }

  async postJournal(businessId, id) {
    const journal = await prisma.journal.findFirst({
      where: {
        id,
        businessId,
      },
      include: { entries: true },
    });

    if (!journal) {
      throw new Error("Journal tidak ditemukan atau tidak memiliki akses");
    }

    if (journal.status === "POSTED") {
      throw new Error("Journal sudah diposting");
    }

    return await prisma.$transaction(async (prisma) => {
      const updatedJournal = await prisma.journal.update({
        where: { id },
        data: { status: "POSTED" },
      });

      // Update saldo akun
      for (const entry of journal.entries) {
        if (entry.debitAccountId && entry.debitAmount > 0) {
          const account = await prisma.account.findUnique({
            where: { id: entry.debitAccountId },
          });

          // Cek tipe akun: Aset & Beban bertambah di Debit. Selain itu (Modal, Liabilitas, Pendapatan) berkurang di Debit.
          const isNormalDebit = ["ASSET", "EXPENSE"].includes(account.type);

          await prisma.account.update({
            where: { id: entry.debitAccountId },
            data: {
              balance: isNormalDebit
                ? { increment: entry.debitAmount }
                : { decrement: entry.debitAmount },
            },
          });
        }

        if (entry.creditAccountId && entry.creditAmount > 0) {
          const account = await prisma.account.findUnique({
            where: { id: entry.creditAccountId },
          });

          // Cek tipe akun: Modal, Liabilitas, Pendapatan bertambah di Kredit.
          const isNormalCredit = ["LIABILITY", "EQUITY", "REVENUE"].includes(
            account.type
          );

          await prisma.account.update({
            where: { id: entry.creditAccountId },
            data: {
              balance: isNormalCredit
                ? { increment: entry.creditAmount }
                : { decrement: entry.creditAmount },
            },
          });
        }
      }

      return updatedJournal;
    });
  }

  async deleteJournal(businessId, id) {
    const journal = await prisma.journal.findFirst({
      where: { id, businessId },
      include: { entries: true },
    });

    if (!journal) {
      throw new Error("Journal tidak ditemukan atau tidak memiliki akses");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Jika status POSTED, lakukan REVERSAL saldo akun
      if (journal.status === "POSTED") {
        for (const entry of journal.entries) {
          // --- Reversal Debit ---
          if (entry.debitAccountId && entry.debitAmount > 0) {
            const acc = await tx.account.findUnique({
              where: { id: entry.debitAccountId },
            });
            const isNormalDebit = ["ASSET", "EXPENSE"].includes(acc.type);

            await tx.account.update({
              where: { id: entry.debitAccountId },
              data: {
                balance: isNormalDebit
                  ? { decrement: entry.debitAmount } // Kebalikan dari postJournal
                  : { increment: entry.debitAmount },
              },
            });
          }

          // --- Reversal Credit ---
          if (entry.creditAccountId && entry.creditAmount > 0) {
            const acc = await tx.account.findUnique({
              where: { id: entry.creditAccountId },
            });
            const isNormalCredit = ["LIABILITY", "EQUITY", "REVENUE"].includes(
              acc.type
            );

            await tx.account.update({
              where: { id: entry.creditAccountId },
              data: {
                balance: isNormalCredit
                  ? { decrement: entry.creditAmount } // Kebalikan dari postJournal
                  : { increment: entry.creditAmount },
              },
            });
          }
        }
      }

      // 2. Hapus Journal Entries terlebih dahulu (karena relasi FK)
      await tx.journalEntry.deleteMany({
        where: { journalId: id },
      });

      // 3. Hapus Journal Utama
      return await tx.journal.delete({
        where: { id },
      });
    });
  }
}

module.exports = new JournalService();
