import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/getUserFromToken";

const ESTADOS_VALIDOS = ["verificada", "rechazada"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Leer el estado desde el JSON del body
    const body = await request.json();
    const { estado } = body;
    const { userId, error } = await getUserFromToken(request);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    // 2. Leer el versionId desde los params de la ruta
    const { id: versionId } = await params;

    // 3. Validación de campos requeridos
    if (!versionId || !estado) {
      return NextResponse.json(
        {
          error:
            "Faltan campos: versionId (en la URL) y estado (en el JSON) son requeridos",
        },
        { status: 400 },
      );
    }

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido. Debe ser 'verificada' o 'rechazada'" },
        { status: 400 },
      );
    }

    // 4. Verificar que el usuario exista y tenga rol de administrador
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    if (user.rol !== "administrador") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 },
      );
    }

    // 5. Verificar que la versión exista y no esté eliminada
    const version = await prisma.version.findFirst({
      where: {
        id: Number(versionId),
        eliminadoEn: null,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "La versión del Id no ha sido encontrada" },
        { status: 404 },
      );
    }

    // 6. Actualizar estado y fecha de revisión
    const versionActualizada = await prisma.version.update({
      where: { id: Number(versionId) },
      data: {
        estado,
        revisadoEn: new Date(),
      },
    });

    return NextResponse.json({
      message: `Versión ${estado}`,
      version: versionActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar estado de la versión:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
