const { prisma } = require("../models");

class UserService {
  static async getUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: parseInt(limit),
        include: {
          profile: true,
          userRoles: {
            include: {
              role: true,
            },
          },
          businessUsers: {
            include: {
              business: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.user.count(),
    ]);

    return {
      users: users.map((user) => ({
        ...user,
        password: undefined, // Don't return password
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        businessUsers: {
          include: {
            business: true,
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      ...user,
      password: undefined,
    };
  }

  static async updateUser(id, data) {
    const { firstName, lastName, avatar } = data;

    const user = await prisma.user.update({
      where: { id },
      data: {
        profile: {
          upsert: {
            create: { firstName, lastName, avatar },
            update: { firstName, lastName, avatar },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return {
      ...user,
      password: undefined,
    };
  }

  static async assignRole(userId, roleId) {
    // Check if assignment already exists
    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existing) {
      throw new Error("User already has this role");
    }

    return await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        role: true,
      },
    });
  }

  static async removeRole(userId, roleId) {
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!userRole) {
      throw new Error("User does not have this role");
    }

    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return { message: "Role removed successfully" };
  }

  static async deactivateUser(id) {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: "User deactivated successfully" };
  }

  static async activateUser(id) {
    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: "User activated successfully" };
  }
}

module.exports = UserService;
