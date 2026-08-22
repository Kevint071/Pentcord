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

    if (userdb.rol !== "administrador") {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 },
      );
    }

    const versiones = await prisma.version.findMany({
      where: {
        estado: "pendiente",
        eliminadoEn: null,
      },
      select: {
        id: true,
        autorId: true,
      },
    });

    return NextResponse.json(versiones);
  } catch (error) {
    return NextResponse.json(error);
  }
}
