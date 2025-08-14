-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_postId_fkey`;

-- CreateTable
CREATE TABLE `ViewingLike` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `viewingId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ViewingLike_viewingId_idx`(`viewingId`),
    INDEX `ViewingLike_userId_idx`(`userId`),
    UNIQUE INDEX `ViewingLike_userId_viewingId_key`(`userId`, `viewingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ViewingLike` ADD CONSTRAINT `ViewingLike_viewingId_fkey` FOREIGN KEY (`viewingId`) REFERENCES `ViewingRecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ViewingLike` ADD CONSTRAINT `ViewingLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
