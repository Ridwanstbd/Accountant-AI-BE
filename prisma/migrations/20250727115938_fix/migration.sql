/*
  Warnings:

  - A unique constraint covering the columns `[year,month]` on the table `monthly_ai_recommendations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `monthly_ai_recommendations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `monthly_ai_recommendations_year_month_recommendationType_key` ON `monthly_ai_recommendations`;

-- AlterTable
ALTER TABLE `monthly_ai_recommendations` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `customPrompt` TEXT NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isCustom` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `recommendationText` TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `monthly_ai_recommendations_year_month_key` ON `monthly_ai_recommendations`(`year`, `month`);
