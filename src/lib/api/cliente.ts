/**
 * C.4 · Cliente de API.
 *
 * Un único punto de entrada a `/api/v1`. Se encarga de tres cosas:
 *
 * 1. Enviar la cookie de sesión (`accesstoken`, httpOnly) en cada llamada.
 * 2. Normalizar la respuesta de error al catálogo de `src/lib/errors.ts`, para
 *    que la interfaz reaccione al `code` y no al texto en español.
 * 3. Exponer un error tipado (`ErrorDeApi`) que la capa de interfaz traduce a
 *    comportamiento: `UNAUTHENTICATED` → login guardando el contexto,
 *    `VALIDATION_ERROR` → mensaje al lado del campo.
 *
 * Import de tipos solamente: `src/lib/errors.ts` importa `next/server`, que no
 * puede entrar en el bundle del navegador. `import type` se borra al compilar.
 */
import type { ApiErrorBody, ErrorCode, ErrorDetails } from "@/lib/errors";

export const BASE_API = "/api/v1";

/** Status HTTP → código del catálogo, para los endpoints que todavía no lo usan. */
const CODIGO_POR_STATUS: Record<number, ErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
};

export class ErrorDeApi extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: ErrorDetails;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    details?: ErrorDetails,
  ) {
    super(message);
    this.name = "ErrorDeApi";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /** El endpoint no existe todavía (B.2 y compañía siguen pendientes). */
  get esRutaInexistente() {
    return this.status === 404;
  }
}

/** Error de red o de parseo: no llegamos a hablar con la API. */
export class ErrorDeRed extends Error {
  constructor(causa: unknown) {
    super("No se pudo conectar con el servidor");
    this.name = "ErrorDeRed";
    this.cause = causa;
  }
}

function esCuerpoDelCatalogo(cuerpo: unknown): cuerpo is ApiErrorBody {
  if (typeof cuerpo !== "object" || cuerpo === null) return false;
  const posible = (cuerpo as { error?: unknown }).error;
  return (
    typeof posible === "object" &&
    posible !== null &&
    typeof (posible as { code?: unknown }).code === "string"
  );
}

/**
 * Convierte cualquier cuerpo de error en un `ErrorDeApi`.
 *
 * Hoy conviven tres formas: la del catálogo (`{ error: { code, message } }`),
 * la de `auth/*` (`{ message }`) y la del resto (`{ error: "texto" }`). B.0
 * unifica las dos últimas; mientras tanto se deducen a partir del status.
 */
function interpretarError(status: number, cuerpo: unknown): ErrorDeApi {
  if (esCuerpoDelCatalogo(cuerpo)) {
    const { code, message, details } = cuerpo.error;
    return new ErrorDeApi(code, message, status, details);
  }

  const code = CODIGO_POR_STATUS[status] ?? "INTERNAL_ERROR";
  const suelto = cuerpo as { message?: unknown; error?: unknown } | null;
  const texto =
    typeof suelto?.message === "string"
      ? suelto.message
      : typeof suelto?.error === "string"
        ? suelto.error
        : "No se pudo completar la operación";

  return new ErrorDeApi(code, texto, status);
}

export type OpcionesDePeticion = Omit<RequestInit, "body"> & {
  /** Se serializa como JSON. Para subir archivos, usa `cuerpoCrudo`. */
  cuerpo?: unknown;
  /** `FormData` u otro cuerpo que no debe serializarse (HU-12, foto de perfil). */
  cuerpoCrudo?: BodyInit;
  /** Añadidos a la query string; los `undefined` se omiten. */
  parametros?: Record<string, string | number | undefined>;
};

function construirUrl(
  ruta: string,
  parametros?: OpcionesDePeticion["parametros"],
) {
  const url = `${BASE_API}${ruta.startsWith("/") ? ruta : `/${ruta}`}`;
  if (!parametros) return url;

  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== "") query.set(clave, String(valor));
  }
  const cadena = query.toString();
  return cadena ? `${url}?${cadena}` : url;
}

/**
 * Llama a la API y devuelve el cuerpo ya parseado.
 *
 * Lanza `ErrorDeApi` si la API responde un error y `ErrorDeRed` si no se pudo
 * llegar a ella. Quien llama decide qué hacer con cada código.
 */
export async function pedirApi<T>(
  ruta: string,
  { cuerpo, cuerpoCrudo, parametros, headers, ...resto }: OpcionesDePeticion = {},
): Promise<T> {
  const cabeceras = new Headers(headers);
  let body: BodyInit | undefined = cuerpoCrudo;

  if (cuerpo !== undefined) {
    cabeceras.set("Content-Type", "application/json");
    body = JSON.stringify(cuerpo);
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(construirUrl(ruta, parametros), {
      // La sesión viaja en una cookie httpOnly del mismo origen.
      credentials: "same-origin",
      headers: cabeceras,
      body,
      ...resto,
    });
  } catch (causa) {
    throw new ErrorDeRed(causa);
  }

  if (respuesta.status === 204) return undefined as T;

  const texto = await respuesta.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) throw interpretarError(respuesta.status, datos);

  return datos as T;
}

/** Ruta de login que recuerda a dónde volver tras autenticarse (Fase 7 §1). */
export function rutaDeLogin(destino: string) {
  return `/login?volverA=${encodeURIComponent(destino)}`;
}

/**
 * Mensaje para mostrar junto a un campo del formulario. Devuelve `null` si el
 * error no es de validación o si apunta a otro campo.
 */
export function mensajeDeCampo(error: unknown, campo: string): string | null {
  if (!(error instanceof ErrorDeApi)) return null;
  if (error.code !== "VALIDATION_ERROR") return null;
  const apuntado = error.details?.campo;
  if (apuntado !== undefined && apuntado !== campo) return null;
  return error.message;
}

/** Mensaje legible para un aviso general, sin filtrar detalles internos. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorDeApi) {
    return error.code === "INTERNAL_ERROR"
      ? "Algo falló del lado del servidor. Vuelve a intentarlo."
      : error.message;
  }
  if (error instanceof ErrorDeRed) {
    return "No hay conexión con el servidor. Revisa tu red y vuelve a intentarlo.";
  }
  return "No se pudo completar la operación.";
}
