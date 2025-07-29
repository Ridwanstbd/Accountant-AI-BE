-- CreateTable
CREATE TABLE `monthly_ai_recommendations` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `recommendationType` VARCHAR(191) NOT NULL,
    `recommendationText` VARCHAR(191) NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `monthly_ai_recommendations_year_month_recommendationType_key`(`year`, `month`, `recommendationType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
