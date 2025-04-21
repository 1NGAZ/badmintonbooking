/*
  Warnings:

  - Added the required column `statusId` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `TimeSlot` ADD COLUMN `statusId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `TimeSlot` ADD CONSTRAINT `TimeSlot_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `Reservation_status`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
