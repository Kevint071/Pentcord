import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
