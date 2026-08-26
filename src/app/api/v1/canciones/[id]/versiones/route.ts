// src/app/api/v1/canciones/[id]/versiones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(
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

  try {
    // RN-015: una versión verificada es visible para cualquiera; una que no
    // lo es solo para su autor o para un administrador.
    const { userId, userdb } = await getUserFromToken(request);
    const esAdmin = userdb?.rol === "administrador";

    const versiones = await prisma.version.findMany({
      where: {
        cancionId,
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
        creadoEn: true,
      },
    });

    return NextResponse.json({ data: versiones });
  } catch (error) {
    console.error("Error al obtener las versiones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Error de base de datos al crear la versión" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Error al crear la versión" },
      { status: 500 },
    );
  }
}
