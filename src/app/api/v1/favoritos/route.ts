import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { userId, error } = await getUserFromToken(request);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const favoritos = await prisma.favorito.findMany({
    where: {
      userId,
    },
    include: {
      version: {
        include: {
          cancion: true,
        },
      },
    },
    orderBy: {
      creadoEn: "desc",
    },
  });

  return NextResponse.json(favoritos);
}

export async function POST(request: Request) {
  const { userId, error } = await getUserFromToken(request);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  const body = await request.json();
  const { versionId } = body;

  if (!versionId || isNaN(Number(versionId))) {
    return NextResponse.json(
      { error: "El id de la versión es requerido y debe ser numérico" },
      { status: 400 },
    );
  }

  // Verificar que la versión exista y no esté eliminada
  const version = await prisma.version.findFirst({
    where: {
      id: Number(versionId),
      eliminadoEn: null,
    },
  });

  if (!version) {
    return NextResponse.json(
      { error: "La versión no ha sido encontrada" },
      { status: 404 },
    );
  }

  // Verificar si ya está en favoritos (idempotente)
  const favoritoExistente = await prisma.favorito.findUnique({
    where: {
      userId_versionId: {
        userId,
        versionId: Number(versionId),
      },
    },
  });

  if (favoritoExistente) {
    return NextResponse.json(
      {
        message: "La versión ya estaba en favoritos",
        favorito: favoritoExistente,
      },
      { status: 200 },
    );
  }

  // Crear el favorito
  const favorito = await prisma.favorito.create({
    data: {
      userId,
      versionId: Number(versionId),
    },
  });

  return NextResponse.json(
    { message: "Versión agregada a favoritos", favorito },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const { userId, userdb, error } = await getUserFromToken(request);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const body = await request.json();
  const { versionId } = body;

  if (!versionId || isNaN(Number(versionId))) {
    return NextResponse.json(
      { error: "El id de la versión es requerido y debe ser numérico" },
      { status: 400 },
    );
  }

  // Verificar si el favorito existe
  const favoritoExistente = await prisma.favorito.findUnique({
    where: {
      userId_versionId: {
        userId,
        versionId: Number(versionId),
      },
    },
  });

  if (!favoritoExistente) {
    return NextResponse.json(
      { message: "La versión no estaba en favoritos" },
      { status: 200 },
    );
  }

  await prisma.favorito.delete({
    where: {
      userId_versionId: {
        userId,
        versionId: Number(versionId),
      },
    },
  });

  return NextResponse.json(
    { message: "Versión eliminada de favoritos" },
    { status: 200 },
  );
}
