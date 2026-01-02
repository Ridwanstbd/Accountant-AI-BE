const { prisma } = require("../models");
const { DEFAULT_PERMISSIONS, PERMISSIONS } = require("./permissions");

async function syncPermissions() {
  console.log("🔄 Synchronizing Permissions & Roles...");

  // 1. Tambah/Update daftar Permission dari file utils/permissions.js ke Database
  for (const p of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { displayName: p.displayName, module: p.module },
      create: p,
    });
  }

  // 2. Ambil semua Role yang ada di database
  const roles = await prisma.role.findMany();
  const adminRole = roles.find((r) => r.name === "admin");
  const accountantRole = roles.find((r) => r.name === "accountant");
  const allPerms = await prisma.permission.findMany();

  // 3. LOGIKA OTOMATIS: Hubungkan Permission baru ke Role
  for (const p of allPerms) {
    // Contoh: Jika ada permission baru tentang "report", berikan ke Admin & Accountant
    const isReportPerm = p.name.includes("report_");

    if (isReportPerm) {
      // Berikan ke Admin
      if (adminRole) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: adminRole.id, permissionId: p.id },
          },
          update: {},
          create: { roleId: adminRole.id, permissionId: p.id },
        });
      }
      // Berikan ke Accountant
      if (accountantRole) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: accountantRole.id,
              permissionId: p.id,
            },
          },
          update: {},
          create: { roleId: accountantRole.id, permissionId: p.id },
        });
      }
    }

    // Super Admin selalu dapat semua permission baru
    const superAdminRole = roles.find((r) => r.name === "super_admin");
    if (superAdminRole) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: p.id,
          },
        },
        update: {},
        create: { roleId: superAdminRole.id, permissionId: p.id },
      });
    }
  }

  console.log("✅ Permissions updated and assigned to roles successfully!");
}
if (require.main === module) {
  syncPermissions()
    .then(() => {
      console.log("✅ Sinkronisasi selesai.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Terjadi kesalahan:", err);
      process.exit(1);
    });
}

module.exports = { syncPermissions };
