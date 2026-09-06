import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserFromTokenMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/getUserFromToken", () => ({
  getUserFromToken: (...args: unknown[]) => getUserFromTokenMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: (...args: unknown[]) => updateMock(...args) } },
}));

const { PATCH } = await import("@/app/api/v1/usuarios/me/tema/route");

function crearRequest(body: unknown) {
  return new Request("http://localhost/api/v1/usuarios/me/tema", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: "accesstoken=t" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/v1/usuarios/me/tema", () => {
  beforeEach(() => {
    getUserFromTokenMock.mockReset();
    updateMock.mockReset();
  });

  it("rechaza un valor que no sea light/dark", async () => {
    getUserFromTokenMock.mockResolvedValue({ userId: 7, userdb: {}, error: null });

    const response = await PATCH(crearRequest({ tema: "azul" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual({ campo: "tema" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("persiste el tema y responde 200", async () => {
    getUserFromTokenMock.mockResolvedValue({ userId: 7, userdb: {}, error: null });
    updateMock.mockResolvedValue({});

    const response = await PATCH(crearRequest({ tema: "dark" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ tema: "dark" });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { tema: "dark" },
    });
  });

  it("responde 401 sin sesión, sin tocar la base", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: null,
      userdb: null,
      error: { message: "No autenticado", status: 401 },
    });

    const response = await PATCH(crearRequest({ tema: "dark" }));

    expect(response.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
