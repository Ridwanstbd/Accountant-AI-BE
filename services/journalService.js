// services/journalService.js
const { prisma } = require("../models");
const {
  generateJournalNumber,
  validateJournalBalance,
} = require("../utils/helpers");

class JournalService {
  async getAllJournals(filters = {}) {
    const { type, status, startDate, endDate } = filters;

    const where = {};
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

  async getJournalById(id) {
    return await prisma.journal.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            debitAccount: true,
            creditAccount: true,
          },
        },
      },
    });
  }

  async createJournal(data) {
    const { date, reference, type, entries } = data;

    // Validasi data required
    if (!date || !type || !entries || !Array.isArray(entries)) {
      throw new Error("Data journal tidak lengkap");
    }

    if (!validateJournalBalance(entries)) {
      throw new Error("Total debit dan kredit harus seimbang");
    }

    const lastJournal = await prisma.journal.findFirst({
      where: {
        journalNo: {
          startsWith: type === "GENERAL" ? "JU" : type === "SALES" ? "JP" : "J",
        },
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
          journalNo,
          date: new Date(date),
          reference: reference || `Journal ${journalNo}`,
          type,
          totalAmount,
          status: "DRAFT",
        },
      });

      for (const entry of entries) {
        // Validasi entry
        if (!entry.debitAccountId && !entry.creditAccountId) {
          throw new Error("Setiap entry harus memiliki akun debit atau kredit");
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

  async createSalesJournal(data) {
    const { saleId, cashAccountId, salesAccountId, taxAccountId } = data;

    // Validasi data required
    if (!saleId || !cashAccountId || !salesAccountId) {
      throw new Error("Data untuk membuat journal penjualan tidak lengkap");
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { customer: true },
    });

    if (!sale) {
      throw new Error("Data penjualan tidak ditemukan");
    }

    // Check jika sudah ada journal
    if (sale.journalId) {
      throw new Error("Penjualan ini sudah memiliki journal");
    }

    const lastJournal = await prisma.journal.findFirst({
      where: {
        journalNo: { startsWith: "JP" },
      },
      orderBy: { journalNo: "desc" },
    });

    const journalNo = generateJournalNumber("SALES", lastJournal?.journalNo);

    return await prisma.$transaction(async (prisma) => {
      const journal = await prisma.journal.create({
        data: {
          journalNo,
          date: sale.date,
          reference: `Penjualan ${sale.saleNo} - ${sale.customer.name}`,
          type: "SALES",
          totalAmount: sale.total,
          status: "DRAFT",
        },
      });

      // Entry untuk kas (debit)
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

      // Entry untuk penjualan (kredit)
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

      // Entry untuk pajak jika ada
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

      // Update sale dengan journal ID
      await prisma.sale.update({
        where: { id: saleId },
        data: { journalId: journal.id },
      });

      return await prisma.journal.findUnique({
        where: { id: journal.id },
        include: {
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

  async postJournal(id) {
    const journal = await prisma.journal.findUnique({
      where: { id },
      include: { entries: true },
    });

    if (!journal) {
      throw new Error("Journal tidak ditemukan");
    }

    if (journal.status === "POSTED") {
      throw new Error("Journal sudah diposting");
    }

    return await prisma.$transaction(async (prisma) => {
      // Update status journal
      const updatedJournal = await prisma.journal.update({
        where: { id },
        data: { status: "POSTED" },
      });

      // Update saldo akun
      for (const entry of journal.entries) {
        if (entry.debitAccountId && entry.debitAmount > 0) {
          await prisma.account.update({
            where: { id: entry.debitAccountId },
            data: {
              balance: { increment: entry.debitAmount },
            },
          });
        }

        if (entry.creditAccountId && entry.creditAmount > 0) {
          await prisma.account.update({
            where: { id: entry.creditAccountId },
            data: {
              balance: { decrement: entry.creditAmount },
            },
          });
        }
      }

      return updatedJournal;
    });
  }

  async deleteJournal(id) {
    const journal = await prisma.journal.findUnique({
      where: { id },
    });

    if (!journal) {
      throw new Error("Journal tidak ditemukan");
    }

    if (journal.status === "POSTED") {
      throw new Error("Journal yang sudah diposting tidak bisa dihapus");
    }

    return await prisma.journal.delete({
      where: { id },
    });
  }
}

module.exports = new JournalService();
