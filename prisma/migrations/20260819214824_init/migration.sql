/*
  Warnings:

  - You are about to drop the column `revisor_id` on the `versiones` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "versiones" DROP CONSTRAINT "versiones_revisor_id_fkey";

-- AlterTable
ALTER TABLE "versiones" DROP COLUMN "revisor_id";
