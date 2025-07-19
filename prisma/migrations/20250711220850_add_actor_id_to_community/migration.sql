/*
  Warnings:

  - You are about to drop the column `field` on the `Seat` table. All the data in the column will be lost.
  - You are about to drop the column `field2` on the `Seat` table. All the data in the column will be lost.
  - You are about to drop the column `field3` on the `Seat` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `Seat` table. All the data in the column will be lost.
  - You are about to drop the column `seat` on the `ViewingRecord` table. All the data in the column will be lost.
  - Added the required column `column` to the `Seat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `row` to the `Seat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seat_type` to the `Seat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Community` ADD COLUMN `actorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Seat` DROP COLUMN `field`,
    DROP COLUMN `field2`,
    DROP COLUMN `field3`,
    DROP COLUMN `locationId`,
    ADD COLUMN `column` INTEGER NOT NULL,
    ADD COLUMN `row` VARCHAR(191) NOT NULL,
    ADD COLUMN `seat_type` ENUM('VIP', '일반석') NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT;

-- AlterTable
ALTER TABLE `ViewingRecord` DROP COLUMN `seat`,
    ADD COLUMN `content` VARCHAR(191) NULL,
    ADD COLUMN `image_url` VARCHAR(191) NULL,
    ADD COLUMN `seatId` INTEGER NULL,
    ADD COLUMN `time` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `ViewingRecord` ADD CONSTRAINT `ViewingRecord_seatId_fkey` FOREIGN KEY (`seatId`) REFERENCES `Seat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
