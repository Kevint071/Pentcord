import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request);
    const canciones = await prisma.version.findMany({
      where: {
        autorId: userId,
        eliminadoEn: null,
      },
    });

    return NextResponse.json(canciones);
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
