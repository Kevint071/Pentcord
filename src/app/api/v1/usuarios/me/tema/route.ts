import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { prisma } from "@/lib/prisma";
import { ApiError, errorResponse, toErrorResponse } from "@/lib/errors";

export async function PATCH(request: Request) {
  const { userId, error } = await getUserFromToken(request);
  if (error || !userId) {
    return errorResponse(error?.status === 404 ? "NOT_FOUND" : "UNAUTHENTICATED", error?.message);
  }

  try {
    const { tema } = (await request.json()) as { tema?: unknown };

    if (tema !== "light" && tema !== "dark") {
      throw new ApiError("VALIDATION_ERROR", undefined, { campo: "tema" });
    }

    await prisma.user.update({ where: { id: userId }, data: { tema } });

    return NextResponse.json({ tema }, { status: 200 });
  } catch (causa) {
    return toErrorResponse(causa);
  }
}
