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

/**
 * Clase de pitch: semitonos por encima de C, 0–11. Es la representación
 * interna de toda nota en el dominio; el nombre (`Db` o `C#`) se decide al
 * escribirla, en función de la tonalidad (A.1).
 */
export type ClaseDePitch =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11;

/** Las siete calidades de acorde que soporta el MVP (RN-005). */
export type Calidad =
  | "mayor"
  | "menor"
  | "septima"
  | "maj7"
  | "m7"
  | "sus2"
  | "sus4";

/**
 * Un acorde ya interpretado: sin ortografía y sin tonalidad. El nombre con el
 * que se escriba depende del tono en el que se esté pintando (A.1/A.2).
 */
export type Acorde = {
  raiz: ClaseDePitch;
  calidad: Calidad;
  /** Nota del bajo en un acorde invertido (`C/E`); `null` si no lo lleva. */
  bajo: ClaseDePitch | null;
};

/** Las ocho secciones que se admiten entre llaves. Solo en español (A.3). */
export type DirectivaDeSeccion =
  | "intro"
  | "verso"
  | "precoro"
  | "coro"
  | "puente"
  | "interludio"
  | "solo"
  | "final";

/** Un acorde tal y como apareció en el ChordPro, con su sitio exacto. */
export type AcordeToken = {
  /** `null` cuando el literal no es de los tipos de RN-005. */
  acorde: Acorde | null;
  /** Lo que se escribió entre corchetes, para poder pintarlo tal cual. */
  literal: string;
  /** 1-based, como las cuenta el usuario en el textarea. */
  linea: number;
  /** 1-based, la del corchete de apertura. */
  columna: number;
};

/** Un acorde y la letra que va debajo de él, hasta el acorde siguiente. */
export type SegmentoDocumento = {
  acorde: AcordeToken | null;
  texto: string;
};

export type LineaDocumento =
  | { tipo: "letra"; segmentos: SegmentoDocumento[] }
  | { tipo: "directiva"; nombre: string }
  | { tipo: "vacia" };

export type ClaseDeErrorDeSintaxis =
  | "corchete-sin-cerrar"
  | "corchete-vacio"
  | "acorde-no-reconocido"
  | "directiva-no-reconocida";

/**
 * Un error de sintaxis situado. `linea` y `columna` son lo que RN-013 necesita
 * para señalar el punto exacto en la vista previa, y lo que viaja en
 * `details.linea` / `details.columna` del catálogo de errores de la API.
 */
export type ErrorDeSintaxis = {
  clase: ClaseDeErrorDeSintaxis;
  linea: number;
  columna: number;
  /** El texto ofensor, para poder citarlo en el mensaje. */
  literal: string;
  mensaje: string;
};

/**
 * El ChordPro ya interpretado. Nunca lanza: los problemas se **acumulan** en
 * `errores` y las líneas siguen siendo legibles, para que la vista previa de
 * RN-011 no se rompa ni se congele mientras el usuario escribe (RN-013).
 */
export type DocumentoChordPro = {
  lineas: LineaDocumento[];
  errores: ErrorDeSintaxis[];
};
