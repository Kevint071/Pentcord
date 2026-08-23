import { describe, expect, it } from "vitest";
import {
  ApiError,
  DEFAULT_ERROR_MESSAGE,
  ERROR_CODES,
  HTTP_STATUS_BY_ERROR_CODE,
  buildApiError,
  errorResponse,
  toErrorResponse,
} from "@/lib/errors";

describe("catálogo de errores", () => {
  it("cubre exactamente los 7 códigos de Fase 5 §7 con su status", () => {
    expect(HTTP_STATUS_BY_ERROR_CODE).toEqual({
      VALIDATION_ERROR: 400,
      UNAUTHENTICATED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      PAYLOAD_TOO_LARGE: 413,
      INTERNAL_ERROR: 500,
    });
  });

  it("define status y mensaje por defecto para cada código", () => {
    for (const code of Object.values(ERROR_CODES)) {
      expect(HTTP_STATUS_BY_ERROR_CODE[code]).toBeTypeOf("number");
      expect(DEFAULT_ERROR_MESSAGE[code]).not.toBe("");
    }
  });
});

describe("buildApiError", () => {
  it("usa el mensaje por defecto cuando no se pasa uno", () => {
    expect(buildApiError("UNAUTHENTICATED")).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: DEFAULT_ERROR_MESSAGE.UNAUTHENTICATED,
      },
    });
  });

  it("omite `details` si no se pasa", () => {
    expect("details" in buildApiError("NOT_FOUND").error).toBe(false);
  });

  it("conserva linea y columna para los errores de ChordPro (RN-013)", () => {
    const body = buildApiError("VALIDATION_ERROR", "Corchete sin cerrar", {
      linea: 4,
      columna: 12,
    });

    expect(body.error.details).toEqual({ linea: 4, columna: 12 });
  });
});

describe("errorResponse", () => {
  it("responde con el status del código y el body del catálogo", async () => {
    const response = errorResponse("CONFLICT", "La versión ya fue revisada");

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: { code: "CONFLICT", message: "La versión ya fue revisada" },
    });
  });
});

describe("toErrorResponse", () => {
  it("traduce un ApiError manteniendo código, mensaje y detalles", async () => {
    const response = toErrorResponse(
      new ApiError("VALIDATION_ERROR", "tono_original no es una nota válida", {
        campo: "tono_original",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "tono_original no es una nota válida",
        details: { campo: "tono_original" },
      },
    });
  });

  it("degrada un error desconocido a INTERNAL_ERROR sin filtrar el detalle", async () => {
    const response = toErrorResponse(
      new Error("connect ECONNREFUSED 127.0.0.1:5432"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: DEFAULT_ERROR_MESSAGE.INTERNAL_ERROR,
      },
    });
  });
});
