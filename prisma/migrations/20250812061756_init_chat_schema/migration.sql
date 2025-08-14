/*
  Warnings:

  - Made the column `createdAt` on table `Follow` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `User` required. This step will fail if there are existing NULL values in that column.

*/

-- =========================
-- SAFE DROP FOREIGN KEYS
-- =========================

-- Casting_musicalId_fkey
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Casting'
    AND CONSTRAINT_NAME = 'Casting_musicalId_fkey'
);
SET @sql := IF(@fk IS NOT NULL,
  'ALTER TABLE `Casting` DROP FOREIGN KEY `Casting_musicalId_fkey`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Image_postId_fkey
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Image'
    AND CONSTRAINT_NAME = 'Image_postId_fkey'
);
SET @sql := IF(@fk IS NOT NULL,
  'ALTER TABLE `Image` DROP FOREIGN KEY `Image_postId_fkey`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- MusicalCommunity_musicalId_fkey
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'MusicalCommunity'
    AND CONSTRAINT_NAME = 'MusicalCommunity_musicalId_fkey'
);
SET @sql := IF(@fk IS NOT NULL,
  'ALTER TABLE `MusicalCommunity` DROP FOREIGN KEY `MusicalCommunity_musicalId_fkey`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ViewingRecord_musicalId_fkey
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ViewingRecord'
    AND CONSTRAINT_NAME = 'ViewingRecord_musicalId_fkey'
);
SET @sql := IF(@fk IS NOT NULL,
  'ALTER TABLE `ViewingRecord` DROP FOREIGN KEY `ViewingRecord_musicalId_fkey`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- backfill null timestamps before altering NOT NULL
UPDATE `User`   SET `createdAt` = IFNULL(`createdAt`, NOW()), `updatedAt` = IFNULL(`updatedAt`, NOW());
UPDATE `Follow` SET `createdAt` = IFNULL(`createdAt`, NOW());



-- AlterTable
ALTER TABLE `Answer` ADD COLUMN `isAnonymous` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Community` ADD COLUMN `coverImage` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Follow` MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `Musical` MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT;

-- AlterTable
ALTER TABLE `Question` ADD COLUMN `isAnonymous` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `QuestionComment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `QuestionComment_questionId_idx`(`questionId`),
    INDEX `QuestionComment_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerComment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `answerId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AnswerComment_answerId_idx`(`answerId`),
    INDEX `AnswerComment_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatRoom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `type` ENUM('ONE_TO_ONE', 'GROUP') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChatRoomUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chatRoomId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ChatRoomUser_chatRoomId_userId_key`(`chatRoomId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chatRoomId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageRead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MessageRead_messageId_userId_key`(`messageId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_repostTargetId_fkey` FOREIGN KEY (`repostTargetId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ViewingRecord` ADD CONSTRAINT `ViewingRecord_musicalId_fkey` FOREIGN KEY (`musicalId`) REFERENCES `Musical`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `QuestionComment` ADD CONSTRAINT `QuestionComment_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionComment` ADD CONSTRAINT `QuestionComment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerComment` ADD CONSTRAINT `AnswerComment_answerId_fkey` FOREIGN KEY (`answerId`) REFERENCES `Answer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerComment` ADD CONSTRAINT `AnswerComment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Casting` ADD CONSTRAINT `Casting_musicalId_fkey` FOREIGN KEY (`musicalId`) REFERENCES `Musical`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `MusicalCommunity` ADD CONSTRAINT `MusicalCommunity_musicalId_fkey` FOREIGN KEY (`musicalId`) REFERENCES `Musical`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ChatRoomUser` ADD CONSTRAINT `ChatRoomUser_chatRoomId_fkey` FOREIGN KEY (`chatRoomId`) REFERENCES `ChatRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatRoomUser` ADD CONSTRAINT `ChatRoomUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_chatRoomId_fkey` FOREIGN KEY (`chatRoomId`) REFERENCES `ChatRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRead` ADD CONSTRAINT `MessageRead_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageRead` ADD CONSTRAINT `MessageRead_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Image`
  ADD CONSTRAINT `Image_postId_fkey`
  FOREIGN KEY (`postId`) REFERENCES `Post`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
