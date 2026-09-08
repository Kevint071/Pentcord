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

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/v1/auth/google",
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "No se recibió el código de Google" },
        { status: 400 },
      );
    }

    // 1. Intercambiar el code por tokens
    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
      return NextResponse.json(
        { error: "Google no devolvió un ID token" },
        { status: 401 },
      );
    }

    // 2. Verificar el ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: "Token de Google inválido" },
        { status: 401 },
      );
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

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
            // fotoPerfilUrl: picture ?? null,
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
            // fotoPerfilUrl: picture ?? null,
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

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
