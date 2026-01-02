const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../models");

const emailService = require("./emailService");

class AuthService {
  static async register(userData) {
    const { email, username, password, firstName, lastName } = userData;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      throw new Error("User already exists with this email or username");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          profile: {
            create: { firstName, lastName },
          },
        },
        include: { profile: true },
      });

      const adminRole = await tx.role.findUnique({
        where: { name: "admin" },
      });

      if (!adminRole) {
        throw new Error(
          "Global role 'admin' not found. Please run seeder first."
        );
      }

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        profile: user.profile,
        role: "admin",
      };
    });
  }

  static async login(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
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
          where: { isActive: true },
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

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const permissions = this.getUserPermissions(user);
    const businessPermissions = this.getBusinessPermissions(user);

    return {
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        isSuperAdmin: user.isSuperAdmin,
        isActive: user.isActive,
        profile: user.profile,
        globalRoles: user.userRoles.map((ur) => ur.role.name),
        businesses: user.businessUsers.map((bu) => ({
          id: bu.business.id,
          name: bu.business.name,
          code: bu.business.code,
          role: bu.role.name,
          isActive: bu.isActive,
          joinedAt: bu.joinedAt,
        })),
        permissions,
        businessPermissions,
      },
      accessToken,
      refreshToken,
    };
  }

  static async inviteStaff(businessId, staffData) {
    const { email, username, password, firstName, lastName, roleName } =
      staffData;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      throw new Error("Email atau Username sudah terdaftar");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          profile: {
            create: { firstName, lastName },
          },
        },
      });

      const globalRole = await tx.role.findUnique({
        where: { name: roleName },
      });
      if (!globalRole)
        throw new Error(`Role ${roleName} tidak ditemukan di sistem`);

      await tx.userRole.create({
        data: { userId: user.id, roleId: globalRole.id },
      });
      await tx.businessUser.create({
        data: {
          businessId: businessId,
          userId: user.id,
          roleId: globalRole.id,
          isActive: true,
        },
      });

      return user;
    });
  }

  static async joinBusiness(userId, businessCode, inviteCode = null) {
    const business = await prisma.business.findUnique({
      where: { code: businessCode },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    if (!business.isActive) {
      throw new Error("Business id not active");
    }

    const existingBusinessUser = await prisma.businessUser.findUnique({
      where: {
        businessId_userId: {
          businessId: business.id,
          userId,
        },
      },
    });

    if (existingBusinessUser) {
      throw new Error("User already joined this business");
    }

    const defaultRole = await prisma.role.findFirst({
      where: { name: "USER" },
    });

    if (!defaultRole) {
      throw new Error("Default role not found");
    }

    const businessUser = await prisma.businessUser.create({
      data: {
        businessId: business.id,
        userId,
        roleId: defaultRole.id,
      },
      include: {
        business: true,
        user: {
          include: {
            profile: true,
          },
        },
        role: true,
      },
    });

    return businessUser;
  }

  static async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: "If email exists, reset link has been sent" };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    await emailService.sendPasswordResetEmail(email, resetToken);

    return { message: "If email exists, reset link has been sent" };
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Password changed successfully" };
  }

  static generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });
  }

  static getUserPermissions(user) {
    const permissions = new Set();

    user.userRoles.forEach((userRole) => {
      userRole.role.permissions.forEach((rolePermission) => {
        permissions.add(rolePermission.permission.name);
      });
    });

    return Array.from(permissions);
  }

  static getBusinessPermissions(user) {
    const businessPermissions = {};

    user.businessUsers.forEach((businessUser) => {
      const permissions = new Set();
      businessUser.role.permissions.forEach((rolePermission) => {
        permissions.add(rolePermission.permission.name);
      });
      businessPermissions[businessUser.business.id] = Array.from(permissions);
    });

    return businessPermissions;
  }
}

module.exports = AuthService;
