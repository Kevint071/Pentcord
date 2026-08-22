import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  try {
    const version = await prisma.version.findFirst({
      where: {
        id: Number(idParam),
        eliminadoEn: null,
      },
      select: {
        contenidoChordpro: true,
        tonoOriginal: true,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "La version del Id no a sido encontrada" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      contenidoChordpro: version.contenidoChordpro,
      tonoOriginal: version.tonoOriginal,
    });
  } catch (error) {
    return NextResponse.json(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const versionId = Number(idParam);

    if (!idParam || isNaN(versionId)) {
      return NextResponse.json(
        { error: "ID de la version no proporcionado o inválido" },
        { status: 400 },
      );
    }

    const { userId, userdb, error } = await getUserFromToken(request);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    // 2. Buscar la version
    const version = await prisma.version.findFirst({
      where: {
        id: versionId,
        eliminadoEn: null,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "La canción no ha sido encontrada" },
        { status: 404 },
      );
    }

    // 3. Verificar que el usuario sea dueño de la canción
    if (version.autorId !== userId) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar esta canción" },
        { status: 403 },
      );
    }

    // 4. Cambiar el estado a pendienteEliminacion
    const versionActualizada = await prisma.version.update({
      where: { id: versionId },
      data: {
        estado: "pendienteEliminacion",
      },
    });

    return NextResponse.json({
      message: "Solicitud de eliminación registrada",
      version: versionActualizada,
    });
  } catch (error) {
    console.error("Error al solicitar eliminación de version:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const versionId = Number(idParam);

    if (!idParam || isNaN(versionId)) {
      return NextResponse.json(
        { error: "ID de canción no proporcionado o inválido" },
        { status: 400 },
      );
    }

    const { userId, userdb, error } = await getUserFromToken(request);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (userdb.rol !== "administrador") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 },
      );
    }

    // 3. Buscar la canción
    const version = await prisma.version.findFirst({
      where: {
        id: versionId,
        eliminadoEn: null,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "La canción no ha sido encontrada" },
        { status: 404 },
      );
    }

    // 4. Cambiar el estado a eliminada
    const versionEliminada = await prisma.version.update({
      where: { id: versionId },
      data: {
        estado: "eliminada",
        eliminadoEn: new Date(),
      },
    });

    return NextResponse.json({
      message: "Version eliminada correctamente",
      version: versionEliminada,
    });
  } catch (error) {
    console.error("Error al eliminar version:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
