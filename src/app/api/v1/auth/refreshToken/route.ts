import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshtoken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: "No hay sesión activa" },
        { status: 401 },
      );
    }

    // 1. Verificar que el refresh token sea válido y no haya expirado
    let decoded: { id: number; email: string };
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string,
      ) as { id: number; email: string };
    } catch (err) {
      // Token inválido o expirado: limpiamos las cookies
      cookieStore.delete("accesstoken");
      cookieStore.delete("refreshtoken");
      return NextResponse.json(
        { message: "Sesión expirada, inicia sesión de nuevo" },
        { status: 401 },
      );
    }

    // 2. Confirmar que el usuario sigue existiendo y activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, eliminadoEn: true },
    });

    if (!user || user.eliminadoEn !== null) {
      cookieStore.delete("accesstoken");
      cookieStore.delete("refreshtoken");
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 401 },
      );
    }

    // 3. Generar un nuevo accesstoken (30 min)
    const accesstoken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { algorithm: "HS256", expiresIn: "30m" },
    );

    cookieStore.set("accesstoken", accesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 30, // 30 minutos
    });

    return NextResponse.json(
      { message: "Token renovado con éxito" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en el refresh:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
