/*
  Warnings:

  - You are about to drop the column `musicalName` on the `Community` table. All the data in the column will be lost.
  - You are about to drop the column `recentPerformanceDate` on the `Community` table. All the data in the column will be lost.
  - You are about to drop the column `theaterName` on the `Community` table. All the data in the column will be lost.
  - You are about to drop the column `ticketLink` on the `Community` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Community` DROP COLUMN `musicalName`,
    DROP COLUMN `recentPerformanceDate`,
    DROP COLUMN `theaterName`,
    DROP COLUMN `ticketLink`;
