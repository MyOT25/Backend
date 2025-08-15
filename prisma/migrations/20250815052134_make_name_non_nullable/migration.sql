/*
  Warnings:

  - Made the column `name` on table `Musical` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Musical` MODIFY `name` VARCHAR(191) NOT NULL;
