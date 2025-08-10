/*
  Warnings:

  - A unique constraint covering the columns `[businessId,code]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,code]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,journalNo]` on the table `journals` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,year,month]` on the table `monthly_ai_recommendations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,saleNo]` on the table `sales` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `journals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `monthly_ai_recommendations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `sales` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `accounts_code_key` ON `accounts`;

-- DropIndex
DROP INDEX `customers_code_key` ON `customers`;

-- DropIndex
DROP INDEX `journals_journalNo_key` ON `journals`;

-- DropIndex
DROP INDEX `monthly_ai_recommendations_year_month_key` ON `monthly_ai_recommendations`;

-- DropIndex
DROP INDEX `sales_saleNo_key` ON `sales`;

-- AlterTable
ALTER TABLE `accounts` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `customers` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `journals` ADD COLUMN `businessId` VARCHAR(191) NOT NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `monthly_ai_recommendations` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `businessId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `businesses` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `businesses_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `business_users` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `business_users_businessId_userId_key`(`businessId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `accounts_businessId_code_key` ON `accounts`(`businessId`, `code`);

-- CreateIndex
CREATE UNIQUE INDEX `customers_businessId_code_key` ON `customers`(`businessId`, `code`);

-- CreateIndex
CREATE UNIQUE INDEX `journals_businessId_journalNo_key` ON `journals`(`businessId`, `journalNo`);

-- CreateIndex
CREATE UNIQUE INDEX `monthly_ai_recommendations_businessId_year_month_key` ON `monthly_ai_recommendations`(`businessId`, `year`, `month`);

-- CreateIndex
CREATE UNIQUE INDEX `sales_businessId_saleNo_key` ON `sales`(`businessId`, `saleNo`);

-- AddForeignKey
ALTER TABLE `business_users` ADD CONSTRAINT `business_users_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_users` ADD CONSTRAINT `business_users_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_users` ADD CONSTRAINT `business_users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `journals` ADD CONSTRAINT `journals_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_ai_recommendations` ADD CONSTRAINT `monthly_ai_recommendations_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
