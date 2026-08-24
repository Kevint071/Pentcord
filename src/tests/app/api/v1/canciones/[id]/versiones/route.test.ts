import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const getUserFromTokenMock = vi.fn();
const versionCreateMock = vi.fn();

vi.mock("@/lib/getUserFromToken", () => ({
  getUserFromToken: (...args: unknown[]) => getUserFromTokenMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    version: { create: (...args: unknown[]) => versionCreateMock(...args) },
  },
}));

const { POST } = await import("@/app/api/v1/canciones/[id]/versiones/route");

function crearRequest(body: unknown) {
  return new Request("http://localhost/api/v1/canciones/1/versiones", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: "accesstoken=t" },
    body: JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "1" });

describe("POST /api/v1/canciones/[id]/versiones — manejo de errores", () => {
  beforeEach(() => {
    getUserFromTokenMock.mockReset();
    versionCreateMock.mockReset();
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: {},
      error: null,
    });
  });

  it("no expone code ni meta de Prisma cuando la creación falla con un error conocido", async () => {
    versionCreateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
        code: "P2003",
        clientVersion: "0.0.0",
        meta: { field_name: "cancionId" },
      }),
    );

    const response = await POST(
      crearRequest({ contenido_chordpro: "[C]Hola", tono_original: "C" }),
      { params },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Error de base de datos al crear la versión" });
    expect(body.code).toBeUndefined();
    expect(body.meta).toBeUndefined();
  });

  it("no expone el error crudo cuando la creación falla por una causa desconocida", async () => {
    versionCreateMock.mockRejectedValue(new Error("secreto de conexión a la base"));

    const response = await POST(
      crearRequest({ contenido_chordpro: "[C]Hola", tono_original: "C" }),
      { params },
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Error al crear la versión" });
    expect(body.detail).toBeUndefined();
  });
});
