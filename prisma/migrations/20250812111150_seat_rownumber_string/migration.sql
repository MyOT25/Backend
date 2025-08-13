-- AlterTable
ALTER TABLE `Seat` MODIFY `rowNumber` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Seat_theaterId_fkey` ON `Seat`(`theaterId`);

-- RenameIndex
ALTER TABLE `Seat` RENAME INDEX `seat_unique_by_position` TO `Seat_theaterId_floor_zone_rowNumber_columnNumber_key`;
