/*
  Warnings:

  - A unique constraint covering the columns `[musicalId,actorId,role]` on the table `Casting` will be added. If there are existing duplicate values, this will fail.
  - Made the column `role` on table `Casting` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Casting` MODIFY `role` VARCHAR(191) NOT NULL DEFAULT '미지정';

-- AlterTable
ALTER TABLE `Musical` ADD COLUMN `ticketpic` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ViewingCast` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `viewingId` INTEGER NOT NULL,
    `castingId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ViewingCast_viewingId_idx`(`viewingId`),
    INDEX `ViewingCast_castingId_idx`(`castingId`),
    UNIQUE INDEX `ViewingCast_viewingId_castingId_key`(`viewingId`, `castingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Casting_musicalId_role_idx` ON `Casting`(`musicalId`, `role`);

-- CreateIndex
CREATE UNIQUE INDEX `Casting_musicalId_actorId_role_key` ON `Casting`(`musicalId`, `actorId`, `role`);

-- AddForeignKey
ALTER TABLE `ViewingCast` ADD CONSTRAINT `ViewingCast_viewingId_fkey` FOREIGN KEY (`viewingId`) REFERENCES `ViewingRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ViewingCast` ADD CONSTRAINT `ViewingCast_castingId_fkey` FOREIGN KEY (`castingId`) REFERENCES `Casting`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
