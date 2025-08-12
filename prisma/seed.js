const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { DEFAULT_PERMISSIONS } = require("../utils/permissions");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create permissions using the predefined list
  console.log("Creating permissions...");
  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Create roles
  console.log("Creating roles...");
  const superAdminRole = await prisma.role.upsert({
    where: { name: "super_admin" },
    update: {},
    create: {
      name: "super_admin",
      displayName: "Super Administrator",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      displayName: "Administrator",
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "manager" },
    update: {},
    create: {
      name: "manager",
      displayName: "Manager",
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: {
      name: "user",
      displayName: "User",
    },
  });

  // Assign all permissions to super admin role
  console.log("Assigning permissions to roles...");
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign business and user permissions to admin role
  const adminPermissions = allPermissions.filter(
    (p) =>
      p.name.includes("business_") ||
      p.name.includes("user_") ||
      p.name.includes("role_") ||
      p.name.includes("account_") ||
      p.name.includes("journal_") ||
      p.name.includes("sale_") ||
      p.name.includes("customer_")
  );

  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign view permissions to user role
  const viewPermissions = allPermissions.filter((p) =>
    p.name.includes("_view")
  );
  for (const permission of viewPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Create superadmin user
  console.log("Creating superadmin user...");
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "superadmin",
      password: hashedPassword,
      isSuperAdmin: true,
      profile: {
        create: {
          firstName: "Super",
          lastName: "Admin",
        },
      },
    },
  });

  // Create sample business
  console.log("Creating sample business...");
  const sampleBusiness = await prisma.business.upsert({
    where: { code: "DEMO001" },
    update: {},
    create: {
      code: "DEMO001",
      name: "Demo Business",
      description: "Sample business for demonstration",
      address: "123 Demo Street",
      phone: "+1234567890",
      email: "demo@business.com",
    },
  });

  // Create demo user
  console.log("Creating demo user...");
  const demoUserPassword = await bcrypt.hash("demo123", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      username: "demouser",
      password: demoUserPassword,
      profile: {
        create: {
          firstName: "Demo",
          lastName: "User",
        },
      },
    },
  });

  // Assign demo user to sample business with manager role
  await prisma.businessUser.upsert({
    where: {
      businessId_userId: {
        businessId: sampleBusiness.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      businessId: sampleBusiness.id,
      userId: demoUser.id,
      roleId: managerRole.id,
    },
  });

  // Create sample accounts for the business
  console.log("Creating sample accounts...");
  const accounts = [
    { code: "1000", name: "Cash", type: "ASSET", category: "Current Assets" },
    {
      code: "1100",
      name: "Accounts Receivable",
      type: "ASSET",
      category: "Current Assets",
    },
    {
      code: "2000",
      name: "Accounts Payable",
      type: "LIABILITY",
      category: "Current Liabilities",
    },
    {
      code: "3000",
      name: "Owner's Equity",
      type: "EQUITY",
      category: "Equity",
    },
    {
      code: "4000",
      name: "Sales Revenue",
      type: "REVENUE",
      category: "Revenue",
    },
    {
      code: "5000",
      name: "Cost of Goods Sold",
      type: "EXPENSE",
      category: "Cost of Sales",
    },
    {
      code: "6000",
      name: "Operating Expenses",
      type: "EXPENSE",
      category: "Operating Expenses",
    },
  ];

  for (const account of accounts) {
    await prisma.account.upsert({
      where: {
        businessId_code: {
          businessId: sampleBusiness.id,
          code: account.code,
        },
      },
      update: {},
      create: {
        businessId: sampleBusiness.id,
        ...account,
      },
    });
  }

  // Create sample customer
  console.log("Creating sample customer...");
  await prisma.customer.upsert({
    where: {
      businessId_code: {
        businessId: sampleBusiness.id,
        code: "CUST001",
      },
    },
    update: {},
    create: {
      businessId: sampleBusiness.id,
      code: "CUST001",
      name: "Sample Customer",
      address: "456 Customer Street",
      phone: "+0987654321",
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("👤 SuperAdmin: admin@example.com / admin123");
  console.log("👤 Demo User: demo@example.com / demo123");
  console.log("🏢 Demo Business: DEMO001 (Demo Business)");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
