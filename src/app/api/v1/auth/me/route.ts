import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/getUserFromToken"; // ajusta la ruta según donde la tengas

export async function GET(request: Request) {
  try {
    const { userdb, error } = await getUserFromToken(request);

    if (error) {
      return NextResponse.json(
        { message: error || "No autorizado" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        id: userdb.id,
        username: userdb.username,
        email: userdb.email,
        rol: userdb.rol,
        fotoPerfilUrl: userdb.fotoPerfilUrl,
        creadoEn: userdb.creadoEn,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
