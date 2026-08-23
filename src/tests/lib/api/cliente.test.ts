import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  ErrorDeApi,
  ErrorDeRed,
  mensajeDeCampo,
  mensajeDeError,
  pedirApi,
  rutaDeLogin,
} from "@/lib/api/cliente";

function respuestaFalsa(cuerpo: unknown, status = 200) {
  return new Response(cuerpo === null ? "" : JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Devuelve el error con el que se rechazó la promesa, ya tipado. */
async function capturar(promesa: Promise<unknown>): Promise<unknown> {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  throw new Error("Se esperaba un error y la petición terminó bien");
}

/** Igual, pero estrechando a `ErrorDeApi` para poder leer `code` y `details`. */
async function capturarDeApi(promesa: Promise<unknown>): Promise<ErrorDeApi> {
  const error = await capturar(promesa);
  if (!(error instanceof ErrorDeApi)) {
    throw new Error(`Se esperaba un ErrorDeApi y llegó ${String(error)}`);
  }
  return error;
}

let fetchSimulado: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSimulado = vi.fn();
  vi.stubGlobal("fetch", fetchSimulado);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pedirApi", () => {
  test("llama a /api/v1 enviando las cookies del mismo origen", async () => {
    fetchSimulado.mockResolvedValue(respuestaFalsa({ data: [] }));

    await pedirApi("/canciones");

    const [url, opciones] = fetchSimulado.mock.calls[0];
    expect(url).toBe("/api/v1/canciones");
    expect(opciones.credentials).toBe("same-origin");
  });

  test("omite de la query los parámetros sin valor", async () => {
    fetchSimulado.mockResolvedValue(respuestaFalsa({ data: [] }));

    await pedirApi("/canciones", {
      parametros: { titulo: "sol", autor: undefined, page: 2 },
    });

    expect(fetchSimulado.mock.calls[0][0]).toBe(
      "/api/v1/canciones?titulo=sol&page=2",
    );
  });

  test("serializa el cuerpo como JSON", async () => {
    fetchSimulado.mockResolvedValue(respuestaFalsa({ ok: true }));

    await pedirApi("/favoritos", { method: "POST", cuerpo: { versionId: 7 } });

    const opciones = fetchSimulado.mock.calls[0][1];
    expect(opciones.body).toBe(JSON.stringify({ versionId: 7 }));
    expect(opciones.headers.get("Content-Type")).toBe("application/json");
  });

  test("traduce el cuerpo del catálogo de errores conservando el código", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaFalsa(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Falta cerrar un corchete",
            details: { linea: 3, columna: 12 },
          },
        },
        400,
      ),
    );

    const error = await capturarDeApi(pedirApi("/canciones"));

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({ linea: 3, columna: 12 });
  });

  // Hasta que B.0 migre los 12 route handlers conviven dos formas heredadas de
  // error. El cliente tiene que deducir el código del status para que la
  // interfaz no vuelva a leer texto en español.
  test("deduce el código de la forma heredada de auth (`{ message }`)", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaFalsa({ message: "Credenciales invalidas" }, 401),
    );

    const error = await capturarDeApi(pedirApi("/auth/login"));

    expect(error.code).toBe("UNAUTHENTICATED");
    expect(error.message).toBe("Credenciales invalidas");
  });

  test("deduce el código de la forma heredada del resto (`{ error }`)", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaFalsa({ error: "Canción no encontrada" }, 404),
    );

    const error = await capturarDeApi(pedirApi("/canciones/9"));

    expect(error.code).toBe("NOT_FOUND");
    expect(error.esRutaInexistente).toBe(true);
  });

  test("degrada lo desconocido a INTERNAL_ERROR sin inventar un mensaje", async () => {
    fetchSimulado.mockResolvedValue(new Response("<html>502</html>", { status: 502 }));

    const error = await capturarDeApi(pedirApi("/canciones"));

    expect(error.code).toBe("INTERNAL_ERROR");
    expect(mensajeDeError(error)).toBe(
      "Algo falló del lado del servidor. Vuelve a intentarlo.",
    );
  });

  test("un fallo de red no se confunde con un error de la API", async () => {
    fetchSimulado.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await capturar(pedirApi("/canciones"));

    expect(error).toBeInstanceOf(ErrorDeRed);
    expect(error).not.toBeInstanceOf(ErrorDeApi);
  });

  test("un 204 no intenta parsear un cuerpo vacío", async () => {
    fetchSimulado.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(pedirApi("/favoritos")).resolves.toBeUndefined();
  });
});

describe("traducción a comportamiento", () => {
  test("rutaDeLogin guarda el contexto codificado", () => {
    expect(rutaDeLogin("/versiones/12?tono=D")).toBe(
      "/login?volverA=%2Fversiones%2F12%3Ftono%3DD",
    );
  });

  test("mensajeDeCampo solo responde al campo señalado por la validación", () => {
    const error = new ErrorDeApi(
      "VALIDATION_ERROR",
      "El correo ya está en uso",
      400,
      { campo: "email" },
    );

    expect(mensajeDeCampo(error, "email")).toBe("El correo ya está en uso");
    expect(mensajeDeCampo(error, "password")).toBeNull();
  });

  test("mensajeDeCampo ignora los errores que no son de validación", () => {
    const error = new ErrorDeApi("FORBIDDEN", "Sin permisos", 403);
    expect(mensajeDeCampo(error, "email")).toBeNull();
  });
});
