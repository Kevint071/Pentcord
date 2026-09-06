import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserFromTokenMock = vi.fn();
const updateMock = vi.fn();
const compareMock = vi.fn();
const hashMock = vi.fn();

vi.mock("@/lib/getUserFromToken", () => ({
  getUserFromToken: (...args: unknown[]) => getUserFromTokenMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: (...args: unknown[]) => updateMock(...args) } },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: (...args: unknown[]) => compareMock(...args),
    hash: (...args: unknown[]) => hashMock(...args),
  },
}));

const { PATCH } = await import("@/app/api/v1/usuarios/me/password/route");

function crearRequest(body: unknown) {
  return new Request("http://localhost/api/v1/usuarios/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: "accesstoken=t" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/v1/usuarios/me/password", () => {
  beforeEach(() => {
    getUserFromTokenMock.mockReset();
    updateMock.mockReset();
    compareMock.mockReset();
    hashMock.mockReset();
  });

  it("rechaza cuentas de Google", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: { metodoAutenticacion: "google", password: null },
      error: null,
    });

    const response = await PATCH(
      crearRequest({ passwordActual: "x", passwordNueva: "unaClave123" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe(
      "Tu cuenta usa Google, no tiene contraseña que cambiar.",
    );
    expect(compareMock).not.toHaveBeenCalled();
  });

  it("rechaza una contraseña nueva de menos de 8 caracteres", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: { metodoAutenticacion: "local", password: "hash" },
      error: null,
    });

    const response = await PATCH(
      crearRequest({ passwordActual: "x", passwordNueva: "corta" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details).toEqual({ campo: "passwordNueva" });
    expect(compareMock).not.toHaveBeenCalled();
  });

  it("rechaza la contraseña actual incorrecta", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: { metodoAutenticacion: "local", password: "hash" },
      error: null,
    });
    compareMock.mockResolvedValue(false);

    const response = await PATCH(
      crearRequest({ passwordActual: "mala", passwordNueva: "unaClave123" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details).toEqual({ campo: "passwordActual" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("actualiza el hash cuando la contraseña actual es correcta", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: { metodoAutenticacion: "local", password: "hash-viejo" },
      error: null,
    });
    compareMock.mockResolvedValue(true);
    hashMock.mockResolvedValue("hash-nuevo");
    updateMock.mockResolvedValue({});

    const response = await PATCH(
      crearRequest({ passwordActual: "buena", passwordNueva: "unaClave123" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ message: "Contraseña actualizada" });
    expect(hashMock).toHaveBeenCalledWith("unaClave123", 10);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { password: "hash-nuevo" },
    });
  });
});
