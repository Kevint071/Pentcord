import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";
import { cookies } from "next/headers";
import { extractPublicId } from "@/lib/extractPublicId"; // el mismo helper que usas en el registro local

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    if (
      !email ||
      !password ||
      !username ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof username !== "string"
    ) {
      return NextResponse.json(
        { message: "Faltan campos: email, password y username son requeridos" },
        { status: 400 },
      );
    }

    // Buscar por email (activo o previamente eliminado)
    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    // El username no puede estar tomado por OTRO usuario activo
    const usernameTaken = await prisma.user.findFirst({
      where: {
        username,
        eliminadoEn: null,
        ...(existingByEmail ? { id: { not: existingByEmail.id } } : {}),
      },
    });

    if (usernameTaken) {
      return NextResponse.json(
        { message: "El nombre de usuario ya está en uso" },
        { status: 409 },
      );
    }

    if (existingByEmail && existingByEmail.eliminadoEn === null) {
      return NextResponse.json(
        { message: "El correo ya está en uso" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user: { id: number; email: string | null; username: string };

    if (existingByEmail && existingByEmail.eliminadoEn !== null) {
      // --- Cuenta previamente eliminada: reactivar en limpio ---

      // 1. Borrar sus favoritos
      await prisma.favorito.deleteMany({
        where: { userId: existingByEmail.id },
      });

      // 2. Borrar foto de perfil vieja en Cloudinary (si existe)
      if (existingByEmail.fotoPerfilUrl) {
        const publicId = extractPublicId(existingByEmail.fotoPerfilUrl);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Error eliminando foto anterior de Cloudinary:", err);
            // No bloqueamos el registro si falla el borrado en Cloudinary
          }
        }
      }

      // 3. Resetear el registro como si fuera un usuario nuevo
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          username,
          password: hashedPassword,
          metodoAutenticacion: "local",
          googleId: null,
          rol: "musico",
          fotoPerfilUrl: null,
          eliminadoEn: null,
          creadoEn: new Date(),
        },
        select: { id: true, email: true, username: true },
      });
    } else {
      // --- Usuario totalmente nuevo ---
      user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          metodoAutenticacion: "local",
          creadoEn: new Date(),
        },
        select: { id: true, email: true, username: true },
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

    return NextResponse.json(
      { message: "Usuario registrado con éxito", user },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
