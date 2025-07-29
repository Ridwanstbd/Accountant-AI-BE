// services/customerServices.js
const { prisma } = require("../models");
const { generateCode } = require("../utils/helpers");

class CustomerService {
  async getAllCustomers(search = null) {
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    return await prisma.customer.findMany({
      where,
      include: {
        sales: {
          select: {
            id: true,
            saleNo: true,
            total: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCustomerById(id) {
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          include: { items: true },
          orderBy: { date: "desc" },
        },
      },
    });
  }

  async createCustomer(data) {
    const { name, address, phone, email } = data;

    // Validasi data required
    if (!name || !name.trim()) {
      throw new Error("Nama customer wajib diisi");
    }

    const lastCustomer = await prisma.customer.findFirst({
      orderBy: { code: "desc" },
    });

    const code = generateCode("CUST", lastCustomer?.code);

    return await prisma.customer.create({
      data: {
        code,
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
      },
    });
  }

  async updateCustomer(id, data) {
    const { name, address, phone, email } = data;

    // Validasi data
    if (name && !name.trim()) {
      throw new Error("Nama customer tidak boleh kosong");
    }

    return await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
      },
    });
  }

  async deleteCustomer(id) {
    const customerWithSales = await prisma.customer.findUnique({
      where: { id },
      include: { sales: true },
    });

    if (!customerWithSales) {
      throw new Error("Customer tidak ditemukan");
    }

    if (customerWithSales.sales.length > 0) {
      throw new Error("Customer tidak bisa dihapus karena memiliki transaksi");
    }

    return await prisma.customer.delete({
      where: { id },
    });
  }
}

module.exports = new CustomerService();
