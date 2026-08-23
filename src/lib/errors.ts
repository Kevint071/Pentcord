import { NextResponse } from "next/server";

/**
 * Catálogo único de errores de la API (Fase 5 §7 de la documentación).
 *
 * Todos los endpoints bajo `/api/v1` deben responder los errores con
 * `errorResponse()` para que el frontend pueda reaccionar al `code` en vez de
 * parsear texto libre en español.
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Status HTTP que corresponde a cada código. Es la única fuente de verdad. */
export const HTTP_STATUS_BY_ERROR_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
};

/** Mensaje por defecto, para no repetir el mismo texto en cada endpoint. */
export const DEFAULT_ERROR_MESSAGE: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Los datos enviados no son válidos",
  UNAUTHENTICATED: "No autenticado",
  FORBIDDEN: "No tienes permisos para realizar esta acción",
  NOT_FOUND: "El recurso no ha sido encontrado",
  CONFLICT: "La operación entra en conflicto con el estado actual del recurso",
  PAYLOAD_TOO_LARGE: "El archivo enviado excede el tamaño máximo permitido",
  INTERNAL_ERROR: "Error interno del servidor",
};

/**
 * Datos extra opcionales. Para los errores de sintaxis ChordPro (RN-009 /
 * RN-013) se usan `linea` y `columna`, que el frontend necesita para resaltar
 * el punto exacto del error.
 */
export type ErrorDetails = {
  linea?: number;
  columna?: number;
  campo?: string;
  [key: string]: unknown;
};

/** Forma única del body de error de toda la API. */
export type ApiErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetails;
  };
};

export function buildApiError(
  code: ErrorCode,
  message?: string,
  details?: ErrorDetails,
): ApiErrorBody {
  return {
    error: {
      code,
      message: message ?? DEFAULT_ERROR_MESSAGE[code],
      ...(details === undefined ? {} : { details }),
    },
  };
}

/**
 * Construye la respuesta de error de un Route Handler.
 *
 * @example
 * return errorResponse("NOT_FOUND", "La canción no ha sido encontrada");
 */
export function errorResponse(
  code: ErrorCode,
  message?: string,
  details?: ErrorDetails,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(buildApiError(code, message, details), {
    status: HTTP_STATUS_BY_ERROR_CODE[code],
  });
}

/**
 * Error lanzable desde helpers y lógica de dominio para que el Route Handler lo
 * traduzca con `toErrorResponse()` en un solo `catch`.
 */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly details?: ErrorDetails;

  constructor(code: ErrorCode, message?: string, details?: ErrorDetails) {
    super(message ?? DEFAULT_ERROR_MESSAGE[code]);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Traduce lo que sea que llegue a un `catch` en una respuesta del catálogo.
 * Lo desconocido se degrada a `INTERNAL_ERROR` sin filtrar detalles internos
 * (mensajes de Prisma, stack traces) al cliente.
 */
export function toErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ApiError) {
    return errorResponse(error.code, error.message, error.details);
  }
  return errorResponse("INTERNAL_ERROR");
}
