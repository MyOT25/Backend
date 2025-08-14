/*
  Warnings:

  - You are about to drop the column `fk` on the `Actor` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `Actor` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Actor` table. All the data in the column will be lost.
  - You are about to drop the column `mediaType` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Post` table. All the data in the column will be lost.
  - The values [post,review] on the enum `Post_repostType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `MusicalCommunity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
-- ALTER TABLE `MusicalCommunity` DROP FOREIGN KEY `MusicalCommunity_communityId_fkey`;

-- DropForeignKey
ALTER TABLE `MusicalCommunity` DROP FOREIGN KEY `MusicalCommunity_musicalId_fkey`;

-- AlterTable
ALTER TABLE `Actor` DROP COLUMN `fk`,
    DROP COLUMN `key`,
    DROP COLUMN `userId`,
    ADD COLUMN `birthDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Casting` ADD COLUMN `performanceCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Musical` ADD COLUMN `performanceCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Post` DROP COLUMN `mediaType`,
    DROP COLUMN `title`,
    ADD COLUMN `visibility` ENUM('public', 'friends') NULL,
    MODIFY `repostType` ENUM('quote', 'repost') NULL;

-- DropTable
DROP TABLE `MusicalCommunity`;

-- CreateTable
CREATE TABLE `QuestionCommentLike` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commentId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `QuestionCommentLike_commentId_userId_key`(`commentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QuestionCommentLike` ADD CONSTRAINT `QuestionCommentLike_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `QuestionComment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionCommentLike` ADD CONSTRAINT `QuestionCommentLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
