import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    // Validación básica
    if (!email || !password || !username) {
      return NextResponse.json(
        { message: "Faltan campos: email, password y username son requeridos" },
        { status: 400 },
      );
    }

    // Verificar si el usuario ya existe (por email o username)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "El correo o el nombre de usuario ya están en uso" },
        { status: 409 },
      );
    }

    // Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario en la base de datos
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        metodoAutenticacion: "local",
      },
      select: {
        id: true,
        email: true,
        username: true,
        // OJO: nunca incluyas "password" en el select de respuesta
      },
    });

    return NextResponse.json(
      { message: "Usuario registrado con éxito", user: newUser },
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
