/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Promotion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Promotion` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;
