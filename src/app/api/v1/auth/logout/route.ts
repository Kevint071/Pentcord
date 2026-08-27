import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function DELETE(request: Request) {
  const cookieStore = await cookies();

  // Borra las cookies garantizando coincidencia de opciones
  cookieStore.delete({ name: "accesstoken", path: "/" });
  cookieStore.delete({ name: "refreshtoken", path: "/" });

  return NextResponse.json(
    { message: "Cuenta desactivada correctamente" },
    { status: 200 },
  );
}
