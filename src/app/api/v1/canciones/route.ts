// src/app/api/canciones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Extraer parámetros
  const searchVariable = searchParams.get("titulo")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "9", 10));
  const skip = (page - 1) * limit;

  try {
    // Buscar en título o artista
    const whereCondition: Prisma.CancionWhereInput = searchVariable
      ? {
          OR: [
            {
              titulo: {
                contains: searchVariable,
                mode: "insensitive",
              },
            },
            {
              artista: {
                contains: searchVariable,
                mode: "insensitive",
              },
            },
          ],
        }
      : {};

    // Consulta paralela: datos y totalizador
    const [canciones, total] = await Promise.all([
      prisma.cancion.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          titulo: "asc",
        },
      }),

      prisma.cancion.count({
        where: whereCondition,
      }),
    ]);

    return NextResponse.json({
      data: canciones,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el listado de canciones" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await getUserFromToken(request);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const body = await request.json();
    const { titulo, artista, contenido_chordpro, tono_original } = body;

    // Validación básica de campos obligatorios: canción y primera versión se
    // crean juntas, así que hace falta lo que pide cada una de las dos.
    if (!titulo || !artista || !contenido_chordpro || !tono_original) {
      return NextResponse.json(
        {
          error:
            "titulo, artista, contenido_chordpro y tono_original son obligatorios",
        },
        { status: 400 },
      );
    }

    const { cancion, version } = await prisma.$transaction(async (tx) => {
      const cancion = await tx.cancion.create({
        data: { titulo, artista },
        select: { id: true, titulo: true, artista: true },
      });

      const version = await tx.version.create({
        data: {
          cancionId: cancion.id,
          autorId: userId,
          tonoOriginal: tono_original,
          contenidoChordpro: contenido_chordpro,
        },
        select: { id: true, estado: true, tonoOriginal: true },
      });

      return { cancion, version };
    });

    return NextResponse.json(
      {
        id: cancion.id,
        titulo: cancion.titulo,
        artista: cancion.artista,
        version: {
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
        { error: "Error de base de datos al crear la canción" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Error al crear la canción" },
      { status: 500 },
    );
  }
}
