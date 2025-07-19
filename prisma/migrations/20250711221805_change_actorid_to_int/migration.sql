/*
  Warnings:

  - You are about to alter the column `actorId` on the `Community` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `Community` MODIFY `actorId` INTEGER NULL;
