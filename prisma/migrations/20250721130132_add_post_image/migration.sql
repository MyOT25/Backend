-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_postId_fkey`;

-- DropIndex
DROP INDEX `Image_postId_fkey` ON `Image`;

-- CreateTable
CREATE TABLE `PostImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `url` VARCHAR(191) NULL,
    `caption` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PostImage` ADD CONSTRAINT `PostImage_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
