// src/app/api/canciones/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  // Validar que el id sea un número válido
  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: "El id proporcionado no es válido" },
      { status: 400 },
    );
  }

  try {
    const { userId, userdb, error } = await getUserFromToken(request);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const esAdmin = userdb?.rol === "administrador";
    const cancion = await prisma.cancion.findFirst({
      where: {
        id,
        eliminadoEn: null,
        ...(esAdmin
          ? {}
          : { OR: [{ estado: "verificada" }, { autorId: userId ?? -1 }] }),
      },
      include: {
        _count: { select: { versiones: true } },
        ...{
          versiones: {
            where: {
              eliminadoEn: null,
              ...(esAdmin
                ? {}
                : {
                    OR: [{ estado: "verificada" }, { autorId: userId ?? -1 }],
                  }),
            },
          },
        },
      },
    });

    if (!cancion) {
      return NextResponse.json(
        { error: "Canción no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: cancion });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la canción" },
      { status: 500 },
    );
  }
}
