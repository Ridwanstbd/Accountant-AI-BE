const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { DEFAULT_PERMISSIONS } = require("../utils/permissions");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai Idempotent Seeding (Syncing Data)...");

  // 1. SEED PERMISSIONS (Idempotent: Menggunakan upsert)
  console.log("- Sinkronisasi Permissions...");
  for (const p of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { displayName: p.displayName, module: p.module },
      create: p,
    });
  }
  const allPerms = await prisma.permission.findMany();

  // 2. SEED ROLES
  console.log("- Sinkronisasi Roles...");
  const rolesData = [
    { name: "super_admin", displayName: "Application Owner (Root)" },
    { name: "admin", displayName: "Business Owner (SaaS Client)" },
    { name: "accountant", displayName: "Professional Accountant" },
    { name: "user", displayName: "Regular Staff" },
  ];

  const roles = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName },
      create: r,
    });
  }

  // 3. HUBUNGKAN PERMISSION KE ROLE (Idempotent: Menggunakan upsert dengan unique compound key)
  console.log("🔗 Sinkronisasi Role-Permissions...");
  for (const p of allPerms) {
    // --- Super Admin (Semua Akses) ---
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles["super_admin"].id,
          permissionId: p.id,
        },
      },
      update: {},
      create: { roleId: roles["super_admin"].id, permissionId: p.id },
    });

    // --- Admin (Semua kecuali modul permission) ---
    if (p.module !== "permission") {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roles["admin"].id,
            permissionId: p.id,
          },
        },
        update: {},
        create: { roleId: roles["admin"].id, permissionId: p.id },
      });
    }

    // --- Accountant (Hanya Keuangan & Report) ---
    const isAccountantPerm =
      p.name.includes("report_") ||
      p.name.includes("journal_") ||
      p.name.includes("account_view") ||
      p.name === "sale_view";

    if (isAccountantPerm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roles["accountant"].id,
            permissionId: p.id,
          },
        },
        update: {},
        create: { roleId: roles["accountant"].id, permissionId: p.id },
      });
    }
  }

  // 4. SEED USERS (Idempotent: Cek email)
  const salt = 12;
  console.log("👤 Sinkronisasi Master Users...");

  const users = [
    {
      email: "superadmin@example.com",
      username: "superadmin",
      password: "super123",
      isSuperAdmin: true,
      firstName: "Super",
      lastName: "Admin",
      role: "super_admin",
    },
    {
      email: "admin@example.com",
      username: "owner_bisnis",
      password: "owner123",
      isSuperAdmin: false,
      firstName: "Owner",
      lastName: "Bisnis",
      role: "admin",
    },
    {
      email: "user@example.com",
      username: "akuntan_staff",
      password: "user123",
      isSuperAdmin: false,
      firstName: "Staff",
      lastName: "Akuntan",
      role: "accountant",
    },
  ];

  const createdUsers = {};

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { isSuperAdmin: u.isSuperAdmin },
      create: {
        email: u.email,
        username: u.username,
        password: await bcrypt.hash(u.password, salt),
        isSuperAdmin: u.isSuperAdmin,
        profile: { create: { firstName: u.firstName, lastName: u.lastName } },
      },
    });
    createdUsers[u.email] = user;

    // 5. SEED USER_ROLES (Global)
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: user.id, roleId: roles[u.role].id },
      },
      update: {},
      create: { userId: user.id, roleId: roles[u.role].id },
    });
  }

  // 6. SEED BUSINESS & LINKING (Idempotent)
  console.log("🏢 Sinkronisasi Bisnis Demo...");
  const biz = await prisma.business.upsert({
    where: { code: "BIZ-01" },
    update: { name: "PT Multi Bisnis Jaya" },
    create: { code: "BIZ-01", name: "PT Multi Bisnis Jaya" },
  });

  // Hubungkan Owner ke Bisnis
  await prisma.businessUser.upsert({
    where: {
      businessId_userId: {
        businessId: biz.id,
        userId: createdUsers["admin@example.com"].id,
      },
    },
    update: {},
    create: {
      businessId: biz.id,
      userId: createdUsers["admin@example.com"].id,
      roleId: roles["admin"].id,
    },
  });

  // Hubungkan Accountant ke Bisnis
  await prisma.businessUser.upsert({
    where: {
      businessId_userId: {
        businessId: biz.id,
        userId: createdUsers["user@example.com"].id,
      },
    },
    update: {},
    create: {
      businessId: biz.id,
      userId: createdUsers["user@example.com"].id,
      roleId: roles["accountant"].id,
    },
  });

  console.log("✅ Seeding Berhasil & Sinkron!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
