// src/app/api/v1/canciones/[id]/versiones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const cancionId = Number(idParam);

  if (!idParam || isNaN(cancionId)) {
    return NextResponse.json(
      { error: "ID de canción no proporcionado o inválido" },
      { status: 400 },
    );
  }

  if (Number.isNaN(cancionId)) {
    return NextResponse.json(
      { error: "El id de la canción no es válido" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const { userId, error } = await getUserFromToken(request);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const { contenido_chordpro, tono_original } = body;

    if (!contenido_chordpro || !userId || !tono_original) {
      return NextResponse.json(
        {
          error: "contenido_chordpro, userid y tono_original son obligatorios",
        },
        { status: 400 },
      );
    }
    const version = await prisma.version.create({
      data: {
        cancionId,
        autorId: Number(userId),
        tonoOriginal: tono_original,
        contenidoChordpro: contenido_chordpro,
      },
      select: {
        id: true,
        estado: true,
        tonoOriginal: true,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: version.id,
          estado: version.estado,
          tono_original: version.tonoOriginal,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error real:", error); // 👈 agrega esto

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: "Error de base de datos al crear la versión",
          code: error.code, // 👈 y esto temporalmente
          meta: error.meta, // 👈 esto te dice EXACTAMENTE qué campo falló
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Error al crear la versión", detail: String(error) }, // 👈 y esto
      { status: 500 },
    );
  }
}
