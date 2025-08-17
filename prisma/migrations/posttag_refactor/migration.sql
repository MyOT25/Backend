-- DropForeignKey
ALTER TABLE `PostTag` DROP FOREIGN KEY `PostTag_tagId_fkey`;

-- AddForeignKey
ALTER TABLE `PostTag` ADD CONSTRAINT `PostTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag_Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `PostTag` RENAME INDEX `PostTag_tagId_fkey` TO `PostTag_tagId_idx`;

-- RenameIndex
ALTER TABLE `Tag_Post` RENAME INDEX `Tag_name_key` TO `Tag_Post_name_key`;

