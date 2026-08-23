/**
 * A.6 · Renderizador (RN-009b).
 *
 * Convierte el ChordPro almacenado en la vista que ve el músico: la línea de
 * acordes encima de la letra. Devuelve **segmentos posicionados**, no una
 * cadena ya formateada, para que la interfaz pueda marcar cada acorde no
 * reconocido por separado (RN-005) sin romper el resto de la canción.
 *
 * Es la única puerta que necesita el visor: recibe el documento tal y como se
 * guardó, el tono original de la versión, el tono que hay en pantalla y el
 * modo, y hace por dentro el transporte y la conversión a grados. Ni el
 * documento ni el tono original se tocan (RN-003): el render es una vista
 * derivada, se recalcula en cada consulta y no se almacena.
 *
 * **Solapamiento.** Si el nombre del acorde es más largo que la sílaba que
 * lleva debajo, el renderizador rellena esa sílaba con espacios hasta dejar al
 * menos uno de separación. Lo hace aquí y no en el CSS para que el mismo
 * resultado valga en la pantalla, en un volcado a texto plano y en el
 * servidor.
 */
import { acordeAGrado } from "./grados";
import { nombrarAcorde } from "./acordes";
import { claseDeTono } from "./notas";
import { transportarDocumento } from "./transporte";
import type {
  AcordeToken,
  CifradoRenderizado,
  ClaseDePitch,
  DocumentoChordPro,
  LineaDocumento,
  LineaRenderizada,
  ModoDeAcordes,
  SegmentoRenderizado,
  Tono,
} from "./tipos";

export type OpcionesDeRender = {
  /** El tono en el que se guardó la versión (RN-002), inmutable. */
  tonoOriginal: Tono;
  /** El tono que hay en pantalla ahora mismo. */
  tono: Tono;
  modo: ModoDeAcordes;
};

export function renderizar(
  documento: DocumentoChordPro,
  { tonoOriginal, tono, modo }: OpcionesDeRender,
): CifradoRenderizado {
  const transportado = transportarDocumento(documento, tonoOriginal, tono);
  const tonica = claseDeTono(tono);

  return {
    tono,
    modo,
    lineas: transportado.lineas.map((linea) =>
      renderizarLinea(linea, tono, tonica, modo),
    ),
  };
}

function renderizarLinea(
  linea: LineaDocumento,
  tono: Tono,
  tonica: ClaseDePitch,
  modo: ModoDeAcordes,
): LineaRenderizada {
  if (linea.tipo === "vacia") return { tipo: "vacia" };
  if (linea.tipo === "directiva") {
    return { tipo: "directiva", nombre: linea.nombre };
  }

  const segmentos: SegmentoRenderizado[] = linea.segmentos.map((segmento) => ({
    acorde: nombrarToken(segmento.acorde, tono, tonica, modo),
    reconocido: segmento.acorde === null || segmento.acorde.acorde !== null,
    texto: segmento.texto,
  }));

  return { tipo: "letra", segmentos: segmentos.map(separarDelSiguiente) };

  function separarDelSiguiente(
    segmento: SegmentoRenderizado,
    indice: number,
  ): SegmentoRenderizado {
    const esElUltimo = indice === segmentos.length - 1;
    if (esElUltimo || segmento.acorde === null) return segmento;

    const minimo = segmento.acorde.length + 1;
    if (segmento.texto.length >= minimo) return segmento;
    return { ...segmento, texto: segmento.texto.padEnd(minimo) };
  }
}

function nombrarToken(
  token: AcordeToken | null,
  tono: Tono,
  tonica: ClaseDePitch,
  modo: ModoDeAcordes,
): string | null {
  if (token === null) return null;
  // No reconocido: se muestra tal y como lo escribió quien aportó la versión.
  if (token.acorde === null) return token.literal;

  return modo === "grados"
    ? acordeAGrado(token.acorde, tonica)
    : nombrarAcorde(token.acorde, tono);
}
