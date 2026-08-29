import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "idToken es requerido" },
        { status: 400 },
      );
    }

    // 1. Validar el token con Google
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return NextResponse.json(
        { error: "Token de Google inválido" },
        { status: 401 },
      );
    }

    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: "No se pudo obtener la información del usuario" },
        { status: 401 },
      );
    }

    const { email, name, email_verified } = payload;

    if (!email_verified) {
      return NextResponse.json(
        { error: "El email de Google no está verificado" },
        { status: 401 },
      );
    }

    // 2. Buscar si el usuario ya existe
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Si no existe, crearlo
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: name ?? "",
          metodoAutenticacion: "google",
          creadoEn: new Date(),
        },
      });
    }

    // Generar access token y refresh token, ambos HS256
    const accesstoken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { algorithm: "HS256", expiresIn: "15m" },
    );

    const refreshtoken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET as string,
      { algorithm: "HS256", expiresIn: "7d" },
    );

    const cookieStore = await cookies();
    // Guardar tokens en cookies httpOnly
    cookieStore.set("accesstoken", accesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15, // 15 minutos
    });

    cookieStore.set("refreshToken", refreshtoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.username,
      },
      status: 201,
    });
  } catch (error) {
    console.error("Error en login con Google:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
