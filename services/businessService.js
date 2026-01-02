const { prisma } = require("../models");
const crypto = require("crypto");

class BusinessService {
  static async generateUniqueCode(name) {
    let isUnique = false;
    let generatedCode = "";

    while (!isUnique) {
      const prefix = name.substring(0, 3).toUpperCase().replace(/\s/g, "X");
      const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
      generatedCode = `${prefix}-${randomPart}`;

      const existing = await prisma.business.findUnique({
        where: { code: generatedCode },
      });

      if (!existing) isUnique = true;
    }
    return generatedCode;
  }

  static async createBusiness(userId, businessData) {
    let { code, name, description, address, phone, email } = businessData;

    if (!code) {
      code = await this.generateUniqueCode(name);
    } else {
      const existingBusiness = await prisma.business.findUnique({
        where: { code },
      });
      if (existingBusiness) {
        throw new Error("Business code already exists");
      }
    }

    return await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          code,
          name,
          description,
          address,
          phone,
          email,
        },
      });

      const adminRole = await tx.role.findUnique({
        where: { name: "admin" },
      });

      if (!adminRole) {
        throw new Error(
          "Role 'admin' tidak ditemukan. Pastikan seeder sudah dijalankan."
        );
      }

      await tx.businessUser.create({
        data: {
          businessId: business.id,
          userId: userId,
          roleId: adminRole.id,
          isActive: true,
        },
      });

      return business;
    });
  }

  static async getBusinessById(id) {
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        businessUsers: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            role: true,
          },
        },
        accounts: {
          where: { isActive: true },
        },
        customers: true,
      },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    return business;
  }

  static async updateBusiness(id, data) {
    const business = await prisma.business.update({
      where: { id },
      data,
    });

    return business;
  }

  static async getBusinessUsers(businessId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [businessUsers, total] = await Promise.all([
      prisma.businessUser.findMany({
        where: { businessId },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          role: true,
        },
        orderBy: {
          joinedAt: "desc",
        },
      }),
      prisma.businessUser.count({
        where: { businessId },
      }),
    ]);

    return {
      businessUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async assignUserRole(businessId, userId, roleId) {
    const businessUser = await prisma.businessUser.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId,
        },
      },
    });

    if (!businessUser) {
      throw new Error("User is not a member of this business");
    }

    const updatedBusinessUser = await prisma.businessUser.update({
      where: {
        businessId_userId: {
          businessId,
          userId,
        },
      },
      data: { roleId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        role: true,
      },
    });

    return updatedBusinessUser;
  }

  static async removeUserFromBusiness(businessId, userId) {
    const businessUser = await prisma.businessUser.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId,
        },
      },
    });

    if (!businessUser) {
      throw new Error("User is not a member of this business");
    }

    await prisma.businessUser.delete({
      where: {
        businessId_userId: {
          businessId,
          userId,
        },
      },
    });

    return { message: "User removed from business successfully" };
  }
}
module.exports = BusinessService;
