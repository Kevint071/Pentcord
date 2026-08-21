import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const versiones = await prisma.version.findMany({
      where: {
        estado: "pendiente",
        eliminadoEn: null,
      },
      select: {
        id: true,
        autorId: true,
      },
    });

    return NextResponse.json(versiones);
  } catch (error) {
    return NextResponse.json(error);
  }
}
