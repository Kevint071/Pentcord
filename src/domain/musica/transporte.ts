/**
 * A.4 · Transportador (HU-05, RN-003).
 *
 * Transportar es sumar semitonos: como el parser ya convirtió cada acorde en
 * clases de pitch, aquí no se toca ni una letra de texto. El nombre se vuelve
 * a escribir al final con la ortografía del **tono destino**, que es lo que
 * hace que en Eb salga `Db` y en D salga `C#`.
 *
 * Nunca muta el documento de entrada: RN-003 exige que el ChordPro almacenado
 * y su tono original queden intactos, porque transportar es solo una vista.
 * Transportar al mismo tono es la identidad, no un error.
 *
 * Un acorde que el parser no reconoció (RN-005) **no se transporta**: se
 * arrastra tal y como lo escribió quien aportó la versión. No hay forma
 * honesta de subirle tres semitonos a algo que no se sabe leer.
 */
import { nombrarAcorde } from "./acordes";
import { distanciaEnSemitonos } from "./notas";
import type {
  Acorde,
  AcordeToken,
  ClaseDePitch,
  DocumentoChordPro,
  LineaDocumento,
  Tono,
} from "./tipos";

function rotar(clase: ClaseDePitch, semitonos: number): ClaseDePitch {
  return (((clase + semitonos) % 12) + 12) % 12 as ClaseDePitch;
}

/** Sube (o baja) un acorde una cantidad de semitonos. Devuelve uno nuevo. */
export function transportarAcorde(acorde: Acorde, semitonos: number): Acorde {
  return {
    raiz: rotar(acorde.raiz, semitonos),
    calidad: acorde.calidad,
    bajo: acorde.bajo === null ? null : rotar(acorde.bajo, semitonos),
  };
}

/** Copia del documento con todos sus acordes llevados de `desde` a `hasta`. */
export function transportarDocumento(
  documento: DocumentoChordPro,
  desde: Tono,
  hasta: Tono,
): DocumentoChordPro {
  const semitonos = distanciaEnSemitonos(desde, hasta);

  return {
    lineas: documento.lineas.map((linea) =>
      transportarLinea(linea, semitonos, hasta),
    ),
    errores: documento.errores.map((error) => ({ ...error })),
  };
}

function transportarLinea(
  linea: LineaDocumento,
  semitonos: number,
  hasta: Tono,
): LineaDocumento {
  if (linea.tipo !== "letra") return { ...linea };

  return {
    tipo: "letra",
    segmentos: linea.segmentos.map((segmento) => ({
      acorde: transportarToken(segmento.acorde, semitonos, hasta),
      texto: segmento.texto,
    })),
  };
}

function transportarToken(
  token: AcordeToken | null,
  semitonos: number,
  hasta: Tono,
): AcordeToken | null {
  if (token === null) return null;
  // No reconocido: se copia tal cual, con su sitio en el ChordPro original.
  if (token.acorde === null) return { ...token };

  const acorde = transportarAcorde(token.acorde, semitonos);
  return {
    acorde,
    literal: nombrarAcorde(acorde, hasta),
    linea: token.linea,
    columna: token.columna,
  };
}
