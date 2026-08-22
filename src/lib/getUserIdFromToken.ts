import jwt from "jsonwebtoken";

export function getUserIdFromToken(request: Request): number | undefined {
  const cookieHeader = request.headers.get("cookie");
  const token = cookieHeader
    ?.split("; ")
    .find((c) => c.startsWith("accesstoken="))
    ?.split("=")[1];

  if (!token) return undefined;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload & { id: number | undefined };
    return payload.id;
  } catch {
    return undefined;
  }
}
