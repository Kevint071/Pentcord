import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

type GetUserFromTokenResult =
  | { userId: number; userdb: User; error: null }
  | { userId: null; userdb: null; error: { message: string; status: number } };

export async function getUserFromToken(
  request: Request,
): Promise<GetUserFromTokenResult> {
  const cookieHeader = request.headers.get("cookie");
  const token = cookieHeader
    ?.split("; ")
    .find((c) => c.startsWith("accesstoken="))
    ?.split("=")[1];

  if (!token) {
    return {
      userId: null,
      userdb: null,
      error: { message: "No autenticado", status: 401 },
    };
  }

  let payload: jwt.JwtPayload & { id: number };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload & { id: number };
  } catch {
    return {
      userId: null,
      userdb: null,
      error: { message: "Token inválido o expirado", status: 401 },
    };
  }

  const userdb = await prisma.user.findUnique({ where: { id: payload.id } });

  if (!userdb) {
    return {
      userId: null,
      userdb: null,
      error: { message: "Usuario no encontrado", status: 404 },
    };
  }

  return { userId: payload.id, userdb, error: null };
}
