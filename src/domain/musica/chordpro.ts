/**
 * A.3 · Parser de ChordPro (RN-009).
 *
 * El acorde va entre corchetes justo antes de la sílaba en la que se toca:
 * `[C]Cuando salga el [G]sol`. Las secciones van entre llaves: `{coro}`.
 *
 * **Nunca lanza.** Los problemas se acumulan en `errores` con línea y columna
 * 1-based, y las líneas se devuelven igualmente legibles. Esa es la condición
 * de RN-013: mientras el usuario escribe, el texto pasa por estados inválidos
 * (un corchete a medio cerrar) y la vista previa tiene que señalar el punto
 * exacto sin romperse, vaciarse ni quedarse congelada en la última versión
 * buena.
 *
 * La lista blanca de directivas es **solo en español** y cerrada: cualquier
 * otra llave, incluidos los metadatos ingleses de otras apps (`{title: …}`),
 * es un error de sintaxis.
 */
import { parsearAcorde } from "./acordes";
import type {
  AcordeToken,
  DirectivaDeSeccion,
  DocumentoChordPro,
  ErrorDeSintaxis,
  LineaDocumento,
  SegmentoDocumento,
} from "./tipos";

/** Lista blanca de secciones, en el orden en que suelen aparecer. */
export const DIRECTIVAS: readonly DirectivaDeSeccion[] = [
  "intro",
  "verso",
  "precoro",
  "coro",
  "puente",
  "interludio",
  "solo",
  "final",
] as const;

/** Una línea que es **solo** una llave, con lo que sea dentro. */
const SOLO_DIRECTIVA = /^\s*\{(.*)\}\s*$/;

export function parsearChordPro(texto: string): DocumentoChordPro {
  const errores: ErrorDeSintaxis[] = [];
  const lineas = texto
    .split(/\r\n|\r|\n/)
    .map((cruda, indice) => parsearLinea(cruda, indice + 1, errores));

  return { lineas, errores };
}

function parsearLinea(
  cruda: string,
  numero: number,
  errores: ErrorDeSintaxis[],
): LineaDocumento {
  if (cruda.trim() === "") return { tipo: "vacia" };

  const directiva = SOLO_DIRECTIVA.exec(cruda);
  if (directiva) return parsearDirectiva(directiva[1], cruda, numero, errores);

  return parsearLetra(cruda, numero, errores);
}

function parsearDirectiva(
  contenido: string,
  cruda: string,
  numero: number,
  errores: ErrorDeSintaxis[],
): LineaDocumento {
  const literal = contenido.trim();
  const nombre = literal.toLowerCase();

  if (!(DIRECTIVAS as readonly string[]).includes(nombre)) {
    errores.push({
      clase: "directiva-no-reconocida",
      linea: numero,
      columna: cruda.indexOf("{") + 1,
      literal,
      mensaje: `«{${literal}}» no es una sección de las que PentCord reconoce: ${DIRECTIVAS.join(", ")}`,
    });
  }

  // Aun sin reconocerla se devuelve como directiva: la vista previa sigue
  // pintando algo en su sitio y el error ya viaja aparte (RN-013).
  return { tipo: "directiva", nombre };
}

function parsearLetra(
  cruda: string,
  numero: number,
  errores: ErrorDeSintaxis[],
): LineaDocumento {
  const segmentos: SegmentoDocumento[] = [];
  let acordeActual: AcordeToken | null = null;
  let texto = "";
  let posicion = 0;

  while (posicion < cruda.length) {
    if (cruda[posicion] !== "[") {
      texto += cruda[posicion];
      posicion += 1;
      continue;
    }

    const columna = posicion + 1;
    const cierre = cruda.indexOf("]", posicion + 1);

    if (cierre === -1) {
      const resto = cruda.slice(posicion);
      errores.push({
        clase: "corchete-sin-cerrar",
        linea: numero,
        columna,
        literal: resto,
        mensaje: "Falta el corchete de cierre «]»",
      });
      // Se lee como letra para que la línea siga siendo visible mientras se
      // termina de escribir el acorde.
      texto += resto;
      break;
    }

    const literal = cruda.slice(posicion + 1, cierre).trim();
    posicion = cierre + 1;

    if (literal === "") {
      errores.push({
        clase: "corchete-vacio",
        linea: numero,
        columna,
        literal: "",
        mensaje: "Los corchetes están vacíos: falta el acorde",
      });
      continue;
    }

    if (acordeActual !== null || texto !== "") {
      segmentos.push({ acorde: acordeActual, texto });
    }

    const acorde = parsearAcorde(literal);
    if (acorde === null) {
      errores.push({
        clase: "acorde-no-reconocido",
        linea: numero,
        columna,
        literal,
        mensaje: `«${literal}» no es un acorde de los tipos que PentCord reconoce`,
      });
    }

    acordeActual = { acorde, literal, linea: numero, columna };
    texto = "";
  }

  if (acordeActual !== null || texto !== "" || segmentos.length === 0) {
    segmentos.push({ acorde: acordeActual, texto });
  }

  return { tipo: "letra", segmentos };
}
