/**
 * Contrato de render del módulo de dominio musical (tarea A.6, RN-009b).
 *
 * Aquí solo viven los **tipos**: la lógica de A.1–A.6 (notas, parser de
 * acordes, parser de ChordPro, transportador, conversor a grados y
 * renderizador) todavía no está construida. Se declaran ahora porque el visor
 * (D.3) se escribe contra esta forma, de modo que cuando el Bloque A aterrice
 * solo haya que enchufarlo: la interfaz no cambia.
 *
 * El renderizador devuelve **segmentos posicionados**, no una cadena ya
 * formateada, para que la interfaz pueda marcar cada acorde no reconocido por
 * separado (RN-005) sin romper el resto de la canción.
 */

/** Los 12 tonos del selector (A.1 será su fuente de verdad definitiva). */
export type Tono =
  | "C"
  | "Db"
  | "D"
  | "Eb"
  | "E"
  | "F"
  | "F#"
  | "G"
  | "Ab"
  | "A"
  | "Bb"
  | "B";

/** Notas reales o grados tipo Nashville, siempre relativos al tono en pantalla. */
export type ModoDeAcordes = "notas" | "grados";

export type SegmentoRenderizado = {
  /** Acorde ya transportado y escrito en el modo activo. `null` = sin acorde. */
  acorde: string | null;
  /** RN-005: `false` marca visualmente sin interrumpir la canción. */
  reconocido: boolean;
  /** Trozo de letra que va debajo del acorde, con sus espacios tal cual. */
  texto: string;
};

export type LineaRenderizada =
  | { tipo: "letra"; segmentos: SegmentoRenderizado[] }
  /** Directivas de ChordPro: `{coro}`, `{verso}`, `{puente}`. */
  | { tipo: "directiva"; nombre: string }
  | { tipo: "vacia" };

export type CifradoRenderizado = {
  /** Tono en el que está pintado ahora mismo, que puede no ser el original. */
  tono: Tono;
  modo: ModoDeAcordes;
  lineas: LineaRenderizada[];
};
