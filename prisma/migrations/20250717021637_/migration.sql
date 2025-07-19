/*
  Warnings:

  - You are about to drop the column `communityId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `settingId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `actorId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `bookmark` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `communityGroup` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `extraField` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `isPinned` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `isShared` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `like` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `musicalId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `repost` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `settingId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `tabCategory` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `tag` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the `_PostTags` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,postId]` on the table `PostLike` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Made the column `createdAt` on table `Comment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `likeCount` on table `Post` required. This step will fail if there are existing NULL values in that column.
  - Made the column `commentCount` on table `Post` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Post` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Post` required. This step will fail if there are existing NULL values in that column.
  - Made the column `viewCount` on table `Post` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_actorId_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_settingId_fkey`;

-- DropForeignKey
ALTER TABLE `_PostTags` DROP FOREIGN KEY `_PostTags_A_fkey`;

-- DropForeignKey
ALTER TABLE `_PostTags` DROP FOREIGN KEY `_PostTags_B_fkey`;

-- DropIndex
DROP INDEX `Post_actorId_fkey` ON `Post`;

-- DropIndex
DROP INDEX `Post_settingId_fkey` ON `Post`;

-- AlterTable
ALTER TABLE `Comment` DROP COLUMN `communityId`,
    DROP COLUMN `settingId`,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `Post` DROP COLUMN `actorId`,
    DROP COLUMN `bookmark`,
    DROP COLUMN `category`,
    DROP COLUMN `communityGroup`,
    DROP COLUMN `extraField`,
    DROP COLUMN `isPinned`,
    DROP COLUMN `isShared`,
    DROP COLUMN `like`,
    DROP COLUMN `musicalId`,
    DROP COLUMN `repost`,
    DROP COLUMN `settingId`,
    DROP COLUMN `tabCategory`,
    DROP COLUMN `tag`,
    ADD COLUMN `bookmarkCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isRepost` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `repostCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `repostTargetId` INTEGER NULL,
    ADD COLUMN `repostType` ENUM('post', 'review') NULL,
    MODIFY `likeCount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `commentCount` INTEGER NOT NULL DEFAULT 0,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `viewCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Tag` DROP COLUMN `type`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- DropTable
DROP TABLE `_PostTags`;

-- CreateTable
CREATE TABLE `Bookmark` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `postId` INTEGER NOT NULL,

    UNIQUE INDEX `Bookmark_userId_postId_key`(`userId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostTag` (
    `postId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`postId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `PostLike_userId_postId_key` ON `PostLike`(`userId`, `postId`);

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `Community`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bookmark` ADD CONSTRAINT `Bookmark_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bookmark` ADD CONSTRAINT `Bookmark_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostTag` ADD CONSTRAINT `PostTag_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostTag` ADD CONSTRAINT `PostTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
