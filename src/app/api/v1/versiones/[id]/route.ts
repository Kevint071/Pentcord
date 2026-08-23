import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const versionId = Number(idParam);

  if (!idParam || isNaN(versionId)) {
    return NextResponse.json(
      { error: "ID de la versión no proporcionado o inválido" },
      { status: 400 },
    );
  }

  try {
    // RN-015: una versión verificada es visible para cualquiera; una que no lo
    // es solo para su autor o para un administrador (que la necesita para
    // revisarla). El resto recibe el mismo 404 que "no existe".
    const { userId, userdb } = await getUserFromToken(request);
    const esAdmin = userdb?.rol === "administrador";

    const version = await prisma.version.findFirst({
      where: {
        id: versionId,
        eliminadoEn: null,
        ...(esAdmin
          ? {}
          : { OR: [{ estado: "verificada" }, { autorId: userId ?? -1 }] }),
      },
      select: {
        id: true,
        autorId: true,
        estado: true,
        tonoOriginal: true,
        contenidoChordpro: true,
        cancion: {
          select: { id: true, titulo: true, artista: true },
        },
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "La versión no ha sido encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: version });
  } catch (error) {
    console.error("Error al obtener la versión:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
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
