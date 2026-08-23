/**
 * A.5 · Conversor acorde ↔ grado, sistema numérico tipo Nashville
 * (HU-06, RN-004).
 *
 * ## La notación de PentCord
 *
 * Un grado se escribe **número + sufijo**, y opcionalmente **`/` + número**
 * para el bajo:
 *
 * | Escrito | Significa | En tono de C |
 * | --- | --- | --- |
 * | `1`      | primer grado, mayor          | `C`     |
 * | `6m`     | sexto grado, menor           | `Am`    |
 * | `57`     | quinto grado, séptima        | `G7`    |
 * | `1maj7`  | primer grado, séptima mayor  | `Cmaj7` |
 * | `6m7`    | sexto grado, séptima menor   | `Am7`   |
 * | `4sus4`  | cuarto grado, sus4           | `Fsus4` |
 * | `b7`     | séptimo grado bemol, mayor   | `Bb`    |
 * | `1/3`    | primer grado con bajo en el tercero | `C/E` |
 *
 * El número siempre es **un solo dígito del 1 al 7**, tomado de la escala
 * mayor de la tónica; los grados que caen fuera de ella llevan `b` delante.
 * Por eso `57` no es ambiguo: el `5` es el grado y el `7` es la calidad.
 *
 * De salida los cromáticos siempre se escriben con bemol (`b5`, nunca `#4`),
 * igual que las notas tienen una sola forma canónica. De entrada se aceptan
 * las dos.
 *
 * **Siempre relativo al tono activo en pantalla** (RN-004): el mismo `G` es
 * `5` mientras se lee en C y `1` en cuanto se transporta a G. La tónica es un
 * parámetro, nunca un valor global.
 */
import { SUFIJO_DE_CALIDAD, calidadDeSufijo } from "./acordes";
import type { Acorde, ClaseDePitch } from "./tipos";

/** Cómo se escribe cada distancia en semitonos sobre la tónica. */
export const GRADO_POR_SEMITONO: readonly string[] = [
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
] as const;

/** Semitonos de cada grado de la escala mayor sobre la tónica. */
const SEMITONOS_DE_GRADO: Record<string, number> = {
  "1": 0,
  "2": 2,
  "3": 4,
  "4": 5,
  "5": 7,
  "6": 9,
  "7": 11,
};

/** Alteración opcional, un dígito 1–7, y lo que venga detrás (la calidad). */
const GRADO_Y_SUFIJO = /^([#b]?)([1-7])(.*)$/;

/** Solo el número del grado, sin calidad: lo que va detrás de la barra. */
const SOLO_GRADO = /^([#b]?)([1-7])$/;

function gradoDe(clase: ClaseDePitch, tonica: ClaseDePitch): string {
  return GRADO_POR_SEMITONO[(((clase - tonica) % 12) + 12) % 12];
}

function claseDeGrado(
  alteracion: string,
  numero: string,
  tonica: ClaseDePitch,
): ClaseDePitch {
  const desplazamiento = alteracion === "#" ? 1 : alteracion === "b" ? -1 : 0;
  const bruta = tonica + SEMITONOS_DE_GRADO[numero] + desplazamiento;
  return ((bruta % 12) + 12) % 12 as ClaseDePitch;
}

/** Escribe un acorde como grado respecto a la tónica activa. */
export function acordeAGrado(acorde: Acorde, tonica: ClaseDePitch): string {
  const cuerpo = gradoDe(acorde.raiz, tonica) + SUFIJO_DE_CALIDAD[acorde.calidad];
  if (acorde.bajo === null) return cuerpo;
  return `${cuerpo}/${gradoDe(acorde.bajo, tonica)}`;
}

/** Lee un grado y lo devuelve a notas, o `null` si no es un grado válido. */
export function gradoAAcorde(
  texto: string,
  tonica: ClaseDePitch,
): Acorde | null {
  const barra = texto.indexOf("/");
  const cuerpo = barra === -1 ? texto : texto.slice(0, barra);
  const gradoDelBajo = barra === -1 ? null : texto.slice(barra + 1);

  const partes = GRADO_Y_SUFIJO.exec(cuerpo);
  if (!partes) return null;

  const calidad = calidadDeSufijo(partes[3]);
  if (calidad === undefined) return null;

  let bajo: ClaseDePitch | null = null;
  if (gradoDelBajo !== null) {
    const partesDelBajo = SOLO_GRADO.exec(gradoDelBajo);
    if (!partesDelBajo) return null;
    bajo = claseDeGrado(partesDelBajo[1], partesDelBajo[2], tonica);
  }

  return { raiz: claseDeGrado(partes[1], partes[2], tonica), calidad, bajo };
}
