import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { cookies } from "next/headers";

export async function DELETE(request: Request) {
  const { userId, error } = await getUserFromToken(request);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      eliminadoEn: new Date(),
    },
  });

  const cookieStore = await cookies();

  // Borra las cookies garantizando coincidencia de opciones
  cookieStore.delete({ name: "accesstoken" });
  cookieStore.delete({ name: "refreshtoken" });

  return NextResponse.json(
    { message: "Cuenta desactivada correctamente" },
    { status: 200 },
  );
}
