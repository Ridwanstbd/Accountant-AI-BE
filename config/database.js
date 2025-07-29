const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  errorFormat: "pretty",
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

prisma
  .$connect()
  .then(() => {
    console.log("Database connected succesfully");
  })
  .catch((error) => {
    console.log("Database connection failed:", error);
    process.exit(1);
  });

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
