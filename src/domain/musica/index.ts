/**
 * Dominio musical de PentCord (Bloque A).
 *
 * Módulo TypeScript **puro**: sin Next.js, sin Prisma, sin React. Se importa
 * igual en el cliente (vista previa de RN-011 y transporte sin red de HU-05) y
 * en el servidor (revalidación del ChordPro al guardar, RN-009 / RN-013).
 *
 * El camino habitual es siempre el mismo:
 *
 * ```ts
 * const documento = parsearChordPro(version.contenidoChordpro);
 * if (documento.errores.length > 0) { … RN-013 … }
 * const cifrado = renderizar(documento, {
 *   tonoOriginal: version.tonoOriginal,
 *   tono,   // el que hay en el selector
 *   modo,   // "notas" | "grados"
 * });
 * ```
 *
 * `renderizar` transporta y convierte a grados por dentro, así que el visor no
 * necesita llamar a `transportarDocumento` ni a `acordeAGrado` por su cuenta.
 */
export {
  TONOS,
  claseDePitch,
  claseDeTono,
  distanciaEnSemitonos,
  esTono,
  nombrarNota,
} from "./notas";

export {
  CALIDADES,
  SUFIJO_DE_CALIDAD,
  calidadDeSufijo,
  nombrarAcorde,
  parsearAcorde,
} from "./acordes";

export { DIRECTIVAS, parsearChordPro } from "./chordpro";

export { transportarAcorde, transportarDocumento } from "./transporte";

export { GRADO_POR_SEMITONO, acordeAGrado, gradoAAcorde } from "./grados";

export { renderizar } from "./render";
export type { OpcionesDeRender } from "./render";

export type {
  Acorde,
  AcordeToken,
  Calidad,
  CifradoRenderizado,
  ClaseDePitch,
  ClaseDeErrorDeSintaxis,
  DirectivaDeSeccion,
  DocumentoChordPro,
  ErrorDeSintaxis,
  LineaDocumento,
  LineaRenderizada,
  ModoDeAcordes,
  SegmentoDocumento,
  SegmentoRenderizado,
  Tono,
} from "./tipos";
