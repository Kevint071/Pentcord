import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "@/lib/cloudinary"; // ajusta al path que uses
import { extractPublicId } from "@/lib/extractPublicId"; // el mismo helper que usas en el registro local

// Helper: genera un username disponible (no tomado por otro usuario activo)
async function getAvailableUsername(base: string, excludeId?: number) {
  let candidate = base;
  let suffix = 0;

  while (true) {
    const taken = await prisma.user.findFirst({
      where: {
        username: candidate,
        eliminadoEn: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (!taken) return candidate;

    suffix += 1;
    candidate = `${base}${suffix}`;
  }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { message: "idToken es requerido" },
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
        { message: "Token de Google inválido" },
        { status: 401 },
      );
    }

    if (!payload || !payload.email) {
      return NextResponse.json(
        { message: "No se pudo obtener la información del usuario" },
        { status: 401 },
      );
    }

    const { email, name, picture, sub: googleId, email_verified } = payload;

    if (!email_verified) {
      return NextResponse.json(
        { message: "El email de Google no está verificado" },
        { status: 401 },
      );
    }

    // 2. Buscar por email (activo o previamente eliminado)
    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    let user: { id: number; email: string | null; username: string };

    if (existingByEmail && existingByEmail.eliminadoEn === null) {
      // --- Cuenta activa: solo iniciar sesión ---
      user = existingByEmail;
    } else {
      // Necesitamos un username disponible (activo) para crear/reactivar
      const baseUsername = name ?? email.split("@")[0];
      const username = await getAvailableUsername(
        baseUsername,
        existingByEmail?.id,
      );

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
              console.error(
                "Error eliminando foto anterior de Cloudinary:",
                err,
              );
            }
          }
        }

        // 3. Resetear el registro como si fuera un usuario nuevo
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            username,
            password: null,
            metodoAutenticacion: "google",
            googleId,
            rol: "musico",
            fotoPerfilUrl: picture ?? null,
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
            googleId,
            metodoAutenticacion: "google",
            fotoPerfilUrl: picture ?? null,
            creadoEn: new Date(),
          },
          select: { id: true, email: true, username: true },
        });
      }
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
      { message: "Sesión iniciada con éxito", user },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error en el login con Google:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
