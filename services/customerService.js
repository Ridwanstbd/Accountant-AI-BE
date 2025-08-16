const { prisma } = require("../models");
const { generateCode } = require("../utils/helpers");

class CustomerService {
  async getAllCustomers(businessId, search = null) {
    const where = { businessId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    return await prisma.customer.findMany({
      where,
      include: {
        business: true,
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

  async getCustomerById(businessId, id) {
    return await prisma.customer.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        business: true,
        sales: {
          include: { items: true },
          orderBy: { date: "desc" },
        },
      },
    });
  }

  async createCustomer(businessId, data) {
    const { name, address, phone } = data;

    if (!name || !name.trim()) {
      throw new Error("Nama customer wajib diisi");
    }

    const lastCustomer = await prisma.customer.findFirst({
      where: { businessId },
      orderBy: { code: "desc" },
    });

    const code = generateCode("CUST", lastCustomer?.code);

    return await prisma.customer.create({
      data: {
        businessId,
        code,
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
      },
    });
  }

  async updateCustomer(businessId, id, data) {
    const { name, address, phone } = data;

    if (name && !name.trim()) {
      throw new Error("Nama customer tidak boleh kosong");
    }

    const customer = await this.getCustomerById(businessId, id);
    if (!customer) {
      throw new Error("Customer tidak ditemukan atau tidak memiliki akses");
    }

    return await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
      },
    });
  }

  async deleteCustomer(businessId, id) {
    const customerWithSales = await prisma.customer.findFirst({
      where: {
        id,
        businessId,
      },
      include: { sales: true },
    });

    if (!customerWithSales) {
      throw new Error("Customer tidak ditemukan atau tidak memiliki akses");
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
