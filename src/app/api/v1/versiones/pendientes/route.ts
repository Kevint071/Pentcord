import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/getUserIdFromToken";

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json({
        message: "Usuario no proporcionado",
        error: 401,
      });
    }
    const userdb = await prisma.user.findUnique({
      where: { id: userId },
      select: { rol: true },
    });

    if (!userdb) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
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
