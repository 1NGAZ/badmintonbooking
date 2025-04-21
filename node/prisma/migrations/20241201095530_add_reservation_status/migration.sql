/*
  Warnings:

  - Added the required column `statusId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Reservation` ADD COLUMN `statusId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Reservation_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `Reservation_status`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
