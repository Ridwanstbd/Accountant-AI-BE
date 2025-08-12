const { prisma } = require("../models");

class RoleService {
  static async getRoles() {
    return await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
            businessUsers: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  static async createRole(data) {
    const { name, displayName } = data;

    // Check if role exists
    const existing = await prisma.role.findUnique({
      where: { name },
    });

    if (existing) {
      throw new Error("Role with this name already exists");
    }

    return await prisma.role.create({
      data: {
        name: name.toLowerCase(),
        displayName,
      },
    });
  }

  static async updateRole(id, data) {
    const { name, displayName, isActive } = data;

    return await prisma.role.update({
      where: { id },
      data: {
        name: name?.toLowerCase(),
        displayName,
        isActive,
      },
    });
  }

  static async deleteRole(id) {
    // Check if role has users (both global and business users)
    const [globalUsers, businessUsers] = await Promise.all([
      prisma.userRole.findFirst({
        where: { roleId: id },
      }),
      prisma.businessUser.findFirst({
        where: { roleId: id },
      }),
    ]);

    if (globalUsers || businessUsers) {
      throw new Error(
        "Cannot delete role that is assigned to users or businesses"
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    return { message: "Role deleted successfully" };
  }

  static async assignPermission(roleId, permissionId) {
    // Check if assignment already exists
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existing) {
      throw new Error("Role already has this permission");
    }

    return await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
      include: {
        role: true,
        permission: true,
      },
    });
  }

  static async removePermission(roleId, permissionId) {
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (!rolePermission) {
      throw new Error("Role does not have this permission");
    }

    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    return { message: "Permission removed successfully" };
  }

  static async getRoleById(id) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        businessUsers: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            business: true,
          },
        },
      },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    return role;
  }

  static async assignMultiplePermissions(roleId, permissionIds) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    // Get existing permissions
    const existingPermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });

    const existingPermissionIds = existingPermissions.map(
      (rp) => rp.permissionId
    );
    const newPermissionIds = permissionIds.filter(
      (id) => !existingPermissionIds.includes(id)
    );

    // Create new role permissions
    const rolePermissions = await prisma.rolePermission.createMany({
      data: newPermissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });

    return rolePermissions;
  }
}

module.exports = RoleService;
