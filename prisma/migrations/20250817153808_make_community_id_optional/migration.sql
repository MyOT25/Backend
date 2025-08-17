-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_communityId_fkey`;

-- AlterTable
ALTER TABLE `Post` MODIFY `communityId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_communityId_fkey` FOREIGN KEY (`communityId`) REFERENCES `Community`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
