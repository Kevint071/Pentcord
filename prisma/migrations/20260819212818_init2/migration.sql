/*
  Warnings:

  - The `estado` column on the `versiones` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('pendiente', 'verificada', 'rechazada');

-- AlterTable
ALTER TABLE "canciones" ADD COLUMN     "estado" "Estado" NOT NULL DEFAULT 'pendiente';

-- AlterTable
ALTER TABLE "versiones" DROP COLUMN "estado",
ADD COLUMN     "estado" "Estado" NOT NULL DEFAULT 'pendiente';

-- DropEnum
DROP TYPE "EstadoVersion";
