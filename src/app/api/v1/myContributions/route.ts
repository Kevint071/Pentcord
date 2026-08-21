import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request: Request) {
  try {
    const body = await request.json();
    const token = body.authorization;

    if (!token) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 },
      );
    }

    let payload: jwt.JwtPayload & { id: number };
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string, {
        algorithms: ["HS256"],
      }) as jwt.JwtPayload & { id: number };
    } catch {
      return NextResponse.json(
        { error: "Token invalido o expirado" },
        { status: 401 },
      );
    }

    const userId = payload.id;

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
