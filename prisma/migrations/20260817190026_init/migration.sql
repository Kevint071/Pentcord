-- CreateEnum
CREATE TYPE "MetodoAutenticacion" AS ENUM ('local', 'google');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('musico', 'administrador');

-- CreateEnum
CREATE TYPE "EstadoVersion" AS ENUM ('pendiente', 'verificada', 'rechazada');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "correo" TEXT,
    "metodo_autenticacion" "MetodoAutenticacion" NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'musico',
    "foto_perfil_url" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canciones" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "artista" VARCHAR(200) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "canciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiones" (
    "id" SERIAL NOT NULL,
    "cancion_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "revisor_id" INTEGER,
    "tono_original" VARCHAR(10) NOT NULL,
    "contenido_chordpro" TEXT NOT NULL,
    "estado" "EstadoVersion" NOT NULL DEFAULT 'pendiente',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisado_en" TIMESTAMP(3),
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "versiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "usuario_id" INTEGER NOT NULL,
    "version_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("usuario_id","version_id")
);

-- AddForeignKey
ALTER TABLE "versiones" ADD CONSTRAINT "versiones_cancion_id_fkey" FOREIGN KEY ("cancion_id") REFERENCES "canciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones" ADD CONSTRAINT "versiones_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones" ADD CONSTRAINT "versiones_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "versiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
