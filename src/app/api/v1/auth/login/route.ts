import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUU123456";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validación básica
    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { message: "Faltan campos: email y password son requeridos" },
        { status: 400 },
      );
    }

    // Buscar al usuario por email
    const user = await prisma.user.findFirst({
      where: {
        email,
        eliminadoEn: null,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Credenciales invalidas" },
        { status: 401 },
      );
    }
    // Verificar contraseña
    const hashToCompare = user?.password ?? DUMMY_HASH;

    const passwordValida = await bcrypt.compare(password, hashToCompare);

    if (!passwordValida) {
      return NextResponse.json(
        { message: "Credenciales invalidas" },
        { status: 401 },
      );
    }

    // Generar access token y refresh token, ambos HS256
    const accesstoken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { algorithm: "HS256", expiresIn: "15m" },
    );

    // const refreshToken = jwt.sign(
    //   { id: user.id },
    //   process.env.JWT_REFRESH_SECRET as string,
    //   { algorithm: "HS256", expiresIn: "7d" },
    // );

    const response = NextResponse.json(
      {
        message: "Inicio de sesión exitoso",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      { status: 200 },
    );

    // Guardar tokens en cookies httpOnly
    response.cookies.set("accesstoken", accesstoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15, // 15 minutos
    });

    // response.cookies.set("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   path: "/",
    //   maxAge: 60 * 60 * 24 * 7, // 7 días
    // });

    return response;
  } catch (error) {
    console.error("Error en el login:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
