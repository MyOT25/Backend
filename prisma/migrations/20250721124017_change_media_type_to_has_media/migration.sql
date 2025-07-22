/*
  Warnings:

  - You are about to drop the column `mediaType` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Post` DROP COLUMN `mediaType`,
    ADD COLUMN `hasMedia` BOOLEAN NOT NULL DEFAULT false;
