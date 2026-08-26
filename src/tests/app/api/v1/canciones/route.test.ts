import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserFromTokenMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/getUserFromToken", () => ({
  getUserFromToken: (...args: unknown[]) => getUserFromTokenMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => transactionMock(...args),
    cancion: { findMany: vi.fn(), count: vi.fn() },
  },
}));

const { POST } = await import("@/app/api/v1/canciones/route");

function crearRequest(body: unknown) {
  return new Request("http://localhost/api/v1/canciones", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: "accesstoken=t" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/canciones", () => {
  beforeEach(() => {
    getUserFromTokenMock.mockReset();
    transactionMock.mockReset();
  });

  it("crea la canción y la primera versión en una sola transacción, sin llamar a otro endpoint por HTTP", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: {},
      error: null,
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        cancion: {
          create: vi
            .fn()
            .mockResolvedValue({ id: 1, titulo: "Prueba", artista: "Autor" }),
        },
        version: {
          create: vi
            .fn()
            .mockResolvedValue({ id: 5, estado: "pendiente", tonoOriginal: "C" }),
        },
      };
      return callback(tx);
    });

    const response = await POST(
      crearRequest({
        titulo: "Prueba",
        artista: "Autor",
        contenido_chordpro: "[C]Hola",
        tono_original: "C",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      id: 1,
      titulo: "Prueba",
      artista: "Autor",
      version: { id: 5, estado: "pendiente", tono_original: "C" },
    });
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("no crea nada si falta contenido_chordpro o tono_original", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: {},
      error: null,
    });

    const response = await POST(
      crearRequest({ titulo: "Prueba", artista: "Autor" }),
    );

    expect(response.status).toBe(400);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("responde el error de autenticación sin crear nada si no hay sesión", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: null,
      userdb: null,
      error: { message: "No autenticado", status: 401 },
    });

    const response = await POST(
      crearRequest({
        titulo: "Prueba",
        artista: "Autor",
        contenido_chordpro: "[C]Hola",
        tono_original: "C",
      }),
    );

    expect(response.status).toBe(401);
    expect(transactionMock).not.toHaveBeenCalled();
  });
});
