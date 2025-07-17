/*
  Warnings:

  - A unique constraint covering the columns `[theaterId,row,column]` on the table `Seat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Seat_theaterId_row_column_key` ON `Seat`(`theaterId`, `row`, `column`);
