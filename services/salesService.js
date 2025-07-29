// services/salesServices.js
const { prisma } = require("../models");
const { generateSaleNumber } = require("../utils/helpers");

class SalesService {
  async getAllSales(filters = {}) {
    const { status, customerId, startDate, endDate } = filters;

    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: true,
      },
      orderBy: { date: "desc" },
    });
  }

  async getSaleById(id) {
    return await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async createSale(data) {
    const { customerId, date, items, tax = 0 } = data;

    // Validasi data required
    if (
      !customerId ||
      !date ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new Error("Data penjualan tidak lengkap");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error("Customer tidak ditemukan");
    }

    const lastSale = await prisma.sale.findFirst({
      where: {
        saleNo: { startsWith: "SALE" },
      },
      orderBy: { saleNo: "desc" },
    });

    const saleNo = generateSaleNumber(lastSale?.saleNo);

    let subtotal = 0;
    const processedItems = items.map((item) => {
      // Validasi item
      if (!item.productName || !item.quantity || !item.price) {
        throw new Error("Data item penjualan tidak lengkap");
      }

      const amount = parseFloat(item.quantity) * parseFloat(item.price);
      subtotal += amount;

      return {
        productName: item.productName.trim(),
        quantity: parseFloat(item.quantity),
        price: parseFloat(item.price),
        amount: amount,
      };
    });

    const taxAmount = parseFloat(tax);
    const total = subtotal + taxAmount;

    return await prisma.$transaction(async (prisma) => {
      const sale = await prisma.sale.create({
        data: {
          saleNo,
          date: new Date(date),
          customerId,
          subtotal,
          tax: taxAmount,
          total,
          status: "PENDING",
        },
      });

      for (const item of processedItems) {
        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            ...item,
          },
        });
      }

      return await prisma.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: true,
          items: true,
        },
      });
    });
  }

  async updateSaleStatus(id, status) {
    // Validasi status
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new Error("Status tidak valid");
    }

    return await prisma.sale.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  async deleteSale(id) {
    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      throw new Error("Data penjualan tidak ditemukan");
    }

    if (sale.status !== "PENDING") {
      throw new Error(
        "Hanya penjualan dengan status PENDING yang bisa dihapus"
      );
    }

    if (sale.journalId) {
      throw new Error("Penjualan yang sudah dijurnal tidak bisa dihapus");
    }

    return await prisma.sale.delete({
      where: { id },
    });
  }

  async getSalesReport(filters = {}) {
    const { startDate, endDate, customerId } = filters;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (customerId) where.customerId = customerId;

    const statusSummary = await prisma.sale.groupBy({
      by: ["status"],
      where,
      _sum: { total: true },
      _count: { id: true },
    });

    const topProducts = await prisma.saleItem.groupBy({
      by: ["productName"],
      where: {
        sale: where,
      },
      _sum: { quantity: true, amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 10,
    });

    const monthlySales = await prisma.sale.findMany({
      where,
      select: { date: true, total: true },
    });

    const monthlyData = {};
    monthlySales.forEach((sale) => {
      const month = sale.date.toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, count: 0 };
      }
      monthlyData[month].total += parseFloat(sale.total);
      monthlyData[month].count += 1;
    });

    return {
      statusSummary,
      topProducts,
      monthlyData,
    };
  }
}

module.exports = new SalesService();
