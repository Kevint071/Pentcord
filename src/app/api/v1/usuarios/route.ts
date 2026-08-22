import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/getUserFromToken";

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

  const response = NextResponse.json(
    { message: "Cuenta desactivada correctamente" },
    { status: 200 },
  );

  // Borrar las cookies de sesión, ya que la cuenta quedó inaccesible
  response.cookies.delete("accesstoken");
  response.cookies.delete("refreshtoken");

  return response;
}
