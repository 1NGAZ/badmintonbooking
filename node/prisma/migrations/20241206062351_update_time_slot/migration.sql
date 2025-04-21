/*
  Warnings:

  - You are about to drop the column `time_end` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `time_start` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `timeSlotId` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Reservation` DROP COLUMN `time_end`,
    DROP COLUMN `time_start`,
    ADD COLUMN `timeSlotId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `TimeSlot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `courtId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TimeSlot` ADD CONSTRAINT `TimeSlot_courtId_fkey` FOREIGN KEY (`courtId`) REFERENCES `Court`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_timeSlotId_fkey` FOREIGN KEY (`timeSlotId`) REFERENCES `TimeSlot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
