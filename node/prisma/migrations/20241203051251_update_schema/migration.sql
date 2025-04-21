/*
  Warnings:

  - You are about to alter the column `price` on the `Court` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Decimal(65,30)`.
  - You are about to drop the column `reserId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `reservationId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_reserId_fkey`;

-- AlterTable
ALTER TABLE `Court` MODIFY `price` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `reserId`,
    ADD COLUMN `reservationId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
