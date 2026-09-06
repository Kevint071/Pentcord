import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { prisma } from "@/lib/prisma";
import { ApiError, errorResponse, toErrorResponse } from "@/lib/errors";

export async function PATCH(request: Request) {
  const { userId, userdb, error } = await getUserFromToken(request);
  if (error || !userId || !userdb) {
    return errorResponse(error?.status === 404 ? "NOT_FOUND" : "UNAUTHENTICATED", error?.message);
  }

  try {
    const { passwordActual, passwordNueva } = (await request.json()) as {
      passwordActual?: unknown;
      passwordNueva?: unknown;
    };

    if (userdb.metodoAutenticacion !== "local") {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Tu cuenta usa Google, no tiene contraseña que cambiar.",
      );
    }

    if (typeof passwordNueva !== "string" || passwordNueva.length < 8) {
      throw new ApiError("VALIDATION_ERROR", undefined, { campo: "passwordNueva" });
    }

    const actual = typeof passwordActual === "string" ? passwordActual : "";
    const coincide = userdb.password ? await bcrypt.compare(actual, userdb.password) : false;
    if (!coincide) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "La contraseña actual no es correcta.",
        { campo: "passwordActual" },
      );
    }

    const hash = await bcrypt.hash(passwordNueva, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hash } });

    return NextResponse.json({ message: "Contraseña actualizada" }, { status: 200 });
  } catch (causa) {
    return toErrorResponse(causa);
  }
}
