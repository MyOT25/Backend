/*
  Warnings:

  - You are about to drop the column `image_url` on the `ViewingRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ViewingRecord` DROP COLUMN `image_url`,
    ADD COLUMN `rating` INTEGER NULL;

-- CreateTable
CREATE TABLE `ViewingImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `viewingId` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ViewingImage` ADD CONSTRAINT `ViewingImage_viewingId_fkey` FOREIGN KEY (`viewingId`) REFERENCES `ViewingRecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
