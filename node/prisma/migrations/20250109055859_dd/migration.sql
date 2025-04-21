/*
  Warnings:

  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `attachment` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_reservationId_fkey`;

-- AlterTable
ALTER TABLE `Reservation` ADD COLUMN `attachment` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `Payment`;
