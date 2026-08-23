// src/app/api/canciones/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const cancion = await prisma.cancion.findFirst({
      where: {
        id,
        eliminadoEn: null,
      },
      include: {
        _count: { select: { versiones: true } },
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
