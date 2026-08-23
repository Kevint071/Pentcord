/**
 * ⚠️ DATOS DE MAQUETA — BORRAR AL TERMINAR EL BLOQUE A ⚠️
 *
 * Esto NO es el módulo de dominio musical. El Bloque A (A.1 notas y
 * tonalidades, A.2 parser de acordes, A.3 parser de ChordPro, A.4
 * transportador, A.5 grados, A.6 renderizador) sigue sin construirse, así que
 * el visor de D.3 se entrega como maqueta visual sobre una canción de ejemplo.
 *
 * Lo que hay aquí es deliberadamente tosco y no sirve para producción:
 *
 * - Los acordes vienen ya troceados a mano, no salen de parsear ChordPro.
 * - El transporte usa una única tabla cromática con sostenidos, así que la
 *   ortografía es incorrecta en varios tonos (en Eb escribe `C#` donde
 *   corresponde `Db`). Corregir eso es justamente el trabajo de A.1.
 * - Los grados salen de una tabla fija, no del conversor de A.5.
 *
 * Cuando el Bloque A exista, el visor debe consumir su renderizador y este
 * archivo desaparece. El contrato al que se conecta ya está declarado en
 * `src/domain/musica/tipos.ts`.
 */
import type {
  CifradoRenderizado,
  LineaRenderizada,
  ModoDeAcordes,
  Tono,
} from "@/domain/musica/tipos";

const CROMATICA_DE_MAQUETA: Tono[] = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

/** Grado de cada semitono respecto a la tónica. Tabla fija, no teoría real. */
const GRADO_POR_SEMITONO = [
  "1",
  "b2",
  "2",
  "b3",
  "3",
  "4",
  "b5",
  "5",
  "b6",
  "6",
  "b7",
  "7",
];

type AcordeFuente = {
  /** Semitonos por encima de la tónica de la versión. */
  semitonos: number;
  /** `m`, `7`, `m7`, `sus4`… Lo que va detrás de la nota. */
  sufijo: string;
  /** RN-005: un acorde fuera de los tipos soportados se pinta tal cual. */
  literalNoReconocido?: string;
};

type SegmentoFuente = { acorde: AcordeFuente | null; texto: string };

type LineaFuente =
  | { tipo: "directiva"; nombre: string }
  | { tipo: "vacia" }
  | { tipo: "letra"; segmentos: SegmentoFuente[] };

/** Canción inventada para la maqueta. No es contenido real del catálogo. */
const LINEAS: LineaFuente[] = [
  { tipo: "directiva", nombre: "verso" },
  {
    tipo: "letra",
    segmentos: [
      { acorde: { semitonos: 0, sufijo: "" }, texto: "Cuando salga el " },
      { acorde: { semitonos: 7, sufijo: "" }, texto: "sol sobre el " },
      { acorde: { semitonos: 9, sufijo: "m" }, texto: "valle," },
    ],
  },
  {
    tipo: "letra",
    segmentos: [
      { acorde: { semitonos: 5, sufijo: "" }, texto: "yo estaré can" },
      { acorde: { semitonos: 0, sufijo: "" }, texto: "tando otra " },
      { acorde: { semitonos: 7, sufijo: "" }, texto: "vez." },
    ],
  },
  { tipo: "vacia" },
  { tipo: "directiva", nombre: "coro" },
  {
    tipo: "letra",
    segmentos: [
      { acorde: { semitonos: 5, sufijo: "" }, texto: "Nada de lo " },
      { acorde: { semitonos: 0, sufijo: "maj7" }, texto: "que soy se com" },
      { acorde: { semitonos: 7, sufijo: "" }, texto: "para" },
    ],
  },
  {
    tipo: "letra",
    segmentos: [
      { acorde: { semitonos: 9, sufijo: "m7" }, texto: "con lo que reci" },
      { acorde: { semitonos: 5, sufijo: "" }, texto: "bí sin mere" },
      { acorde: { semitonos: 0, sufijo: "" }, texto: "cer." },
    ],
  },
  { tipo: "vacia" },
  { tipo: "directiva", nombre: "puente" },
  {
    tipo: "letra",
    segmentos: [
      // Fuera de los tipos de RN-005: se marca sin romper el resto de la línea.
      {
        acorde: {
          semitonos: 0,
          sufijo: "",
          literalNoReconocido: "Cadd9",
        },
        texto: "Aunque el camino ",
      },
      { acorde: { semitonos: 7, sufijo: "sus4" }, texto: "cambie de lu" },
      { acorde: { semitonos: 9, sufijo: "m" }, texto: "gar," },
    ],
  },
  {
    tipo: "letra",
    segmentos: [
      { acorde: null, texto: "tu voz sigue " },
      { acorde: { semitonos: 5, sufijo: "" }, texto: "siendo la mis" },
      { acorde: { semitonos: 0, sufijo: "" }, texto: "ma." },
    ],
  },
];

function nombrarAcorde(
  acorde: AcordeFuente,
  tono: Tono,
  modo: ModoDeAcordes,
): string {
  if (modo === "grados") {
    return `${GRADO_POR_SEMITONO[acorde.semitonos % 12]}${acorde.sufijo}`;
  }
  const base = CROMATICA_DE_MAQUETA.indexOf(tono);
  const nota = CROMATICA_DE_MAQUETA[(base + acorde.semitonos) % 12];
  return `${nota}${acorde.sufijo}`;
}

/** Versión de ejemplo del visor. No corresponde a ningún registro real. */
export const VERSION_DE_MAQUETA = {
  titulo: "Cuando salga el sol",
  artista: "Ejemplo de maqueta",
  tonoOriginal: "C" as Tono,
  autor: "catálogo de demostración",
};

export function renderizarMaqueta(
  tono: Tono,
  modo: ModoDeAcordes,
): CifradoRenderizado {
  const lineas: LineaRenderizada[] = LINEAS.map((linea) => {
    if (linea.tipo !== "letra") return linea;

    return {
      tipo: "letra",
      segmentos: linea.segmentos.map(({ acorde, texto }) => {
        if (!acorde) return { acorde: null, reconocido: true, texto };

        if (acorde.literalNoReconocido) {
          return {
            acorde: acorde.literalNoReconocido,
            reconocido: false,
            texto,
          };
        }

        return {
          acorde: nombrarAcorde(acorde, tono, modo),
          reconocido: true,
          texto,
        };
      }),
    };
  });

  return { tono, modo, lineas };
}
