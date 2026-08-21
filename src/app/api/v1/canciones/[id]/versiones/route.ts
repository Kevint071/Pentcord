// src/app/api/v1/canciones/[id]/versiones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  // 1. Intentar obtener el ID desde params
  let rawId = idParam;

  // 2. Si no viene en params, extraerlo de la URL del request
  if (!rawId) {
    const url = new URL(request.url);
    // Extrae la ruta (ej: "/api/v1/canciones/12/versiones")
    const segments = url.pathname.split("/").filter(Boolean);

    // Busca el segmento justo después de "canciones"
    const cancionesIndex = segments.indexOf("canciones");
    if (cancionesIndex !== -1 && segments[cancionesIndex + 1]) {
      rawId = segments[cancionesIndex + 1];
    }
  }

  // 3. Convertir a número
  const cancionId = Number(rawId);

  // 4. Validar que tengamos un ID numérico válido
  if (!rawId || isNaN(cancionId)) {
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
    const { contenido_chordpro, userid, tono_original } = body;

    if (!contenido_chordpro || !userid || !tono_original) {
      return NextResponse.json(
        {
          error: "contenido_chordpro, userid y tono_original son obligatorios",
        },
        { status: 400 },
      );
    }

    const userdb = await prisma.user.findUnique({
      where: { id: Number(userid) },
    });

    if (!userdb) {
      return NextResponse.json(
        { error: "El usuario no existe" },
        { status: 404 },
      );
    }

    const version = await prisma.version.create({
      data: {
        cancionId,
        autorId: Number(userid),
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
