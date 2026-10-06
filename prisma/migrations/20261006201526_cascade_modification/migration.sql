-- DropForeignKey
ALTER TABLE `collection` DROP FOREIGN KEY `Collection_userId_fkey`;

-- AddForeignKey
ALTER TABLE `Collection` ADD CONSTRAINT `Collection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
