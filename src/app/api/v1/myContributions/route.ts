import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(request: Request) {
  try {
    const { userId, userdb, error } = await getUserFromToken(request);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
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
