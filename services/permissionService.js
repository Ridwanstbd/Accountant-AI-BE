const { prisma } = require("../models");

class PermissionService {
  static async getPermissions() {
    return await prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermission: true,
          },
        },
      },
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });
  }

  static async createPermission(data) {
    const { name, displayName, module } = data;

    // Check if permission exists
    const existing = await prisma.permission.findUnique({
      where: { name },
    });

    if (existing) {
      throw new Error("Permission with this name already exists");
    }

    return await prisma.permission.create({
      data: {
        name: name.toLowerCase(),
        displayName,
        module: module.toLowerCase(),
      },
    });
  }

  static async updatePermission(id, data) {
    const { name, displayName, module } = data;

    return await prisma.permission.update({
      where: { id },
      data: {
        name: name?.toLowerCase(),
        displayName,
        module: module?.toLowerCase(),
      },
    });
  }

  static async deletePermission(id) {
    // Check if permission is assigned to roles
    const rolesWithPermission = await prisma.rolePermission.findFirst({
      where: { permissionId: id },
    });

    if (rolesWithPermission) {
      throw new Error("Cannot delete permission that is assigned to roles");
    }

    await prisma.permission.delete({
      where: { id },
    });

    return { message: "Permission deleted successfully" };
  }

  static async getPermissionsByModule() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });

    // Group by module
    const grouped = {};
    permissions.forEach((permission) => {
      if (!grouped[permission.module]) {
        grouped[permission.module] = [];
      }
      grouped[permission.module].push(permission);
    });

    return grouped;
  }

  static async getPermissionById(id) {
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        rolePermission: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new Error("Permission not found");
    }

    return permission;
  }

  static async createMultiplePermissions(permissions) {
    const createdPermissions = [];

    for (const permissionData of permissions) {
      try {
        const permission = await this.createPermission(permissionData);
        createdPermissions.push(permission);
      } catch (error) {
        // Skip if permission already exists
        if (!error.message.includes("already exists")) {
          throw error;
        }
      }
    }

    return createdPermissions;
  }
}

module.exports = PermissionService;
