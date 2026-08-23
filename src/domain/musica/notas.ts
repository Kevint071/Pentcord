/**
 * A.1 · Notas y tonalidades.
 *
 * Todo el módulo de dominio trabaja con **clases de pitch** (0–11, C = 0), no
 * con nombres de nota: así transportar es aritmética y el nombre (`Db` o `C#`)
 * se decide al final, en función de la tonalidad en la que se está pintando.
 * Ese orden es justo lo que la maqueta hacía al revés.
 *
 * **Ortografía práctica.** La dirección la marca la armadura: las tonalidades
 * con sostenidos se escriben con sostenidos y las de bemoles con bemoles. Pero
 * nunca se escriben `E#`, `B#`, `Fb` ni `Cb`, aunque la teoría estricta los
 * pida (F# mayor lleva `E#` en el séptimo grado): en un cifrado se lee `F`. Es
 * una decisión de legibilidad tomada a propósito, no un descuido.
 *
 * Como entrada sí se aceptan esas enarmónicas — quien aporta puede escribir
 * `[E#]` — pero se normalizan a su clase de pitch y salen con el nombre que
 * corresponda a la tonalidad.
 */
import type { ClaseDePitch, Tono } from "./tipos";

/** Los 12 tonos del selector, en orden cromático desde C. */
export const TONOS: readonly Tono[] = [
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
] as const;

/** Semitonos de cada letra por encima de C. */
const CLASE_DE_LETRA: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const NOMBRES_CON_SOSTENIDOS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

const NOMBRES_CON_BEMOLES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

/** Tonalidades cuya armadura lleva bemoles. El resto se escribe con sostenidos. */
const TONALIDADES_CON_BEMOLES: ReadonlySet<Tono> = new Set<Tono>([
  "F",
  "Bb",
  "Eb",
  "Ab",
  "Db",
]);

/** Solo una nota, sin calidad: `C`, `F#`, `Bb`. Acepta `E#`, `Cb`… como entrada. */
const NOTA = /^([A-G])([#b]?)$/;

/**
 * Clase de pitch de un tono del selector. Total: `TONOS` está en orden
 * cromático desde C, así que la posición en la lista **es** la clase de pitch.
 */
export function claseDeTono(tono: Tono): ClaseDePitch {
  return TONOS.indexOf(tono) as ClaseDePitch;
}

export function esTono(valor: string): valor is Tono {
  return (TONOS as readonly string[]).includes(valor);
}

/**
 * Clase de pitch de un nombre de nota, o `null` si no es una nota.
 * Tolerante en la entrada: `E#` → 5, `Cb` → 11.
 */
export function claseDePitch(nombre: string): ClaseDePitch | null {
  const partes = NOTA.exec(nombre);
  if (!partes) return null;

  const [, letra, alteracion] = partes;
  const desplazamiento = alteracion === "#" ? 1 : alteracion === "b" ? -1 : 0;
  return (((CLASE_DE_LETRA[letra] + desplazamiento) % 12) + 12) % 12 as
    ClaseDePitch;
}

/** Nombre de una clase de pitch con la ortografía que pide la tonalidad. */
export function nombrarNota(clase: ClaseDePitch, tonalidad: Tono): string {
  const nombres = TONALIDADES_CON_BEMOLES.has(tonalidad)
    ? NOMBRES_CON_BEMOLES
    : NOMBRES_CON_SOSTENIDOS;
  return nombres[clase];
}

/**
 * Distancia entre dos tonos por el camino más corto, de −5 a +6 semitonos.
 *
 * El signo es informativo (la etiqueta «+2 semitonos» del visor); para
 * transportar da igual, porque la aritmética es módulo 12.
 */
export function distanciaEnSemitonos(desde: Tono, hasta: Tono): number {
  const bruta = (TONOS.indexOf(hasta) - TONOS.indexOf(desde) + 12) % 12;
  return bruta > 6 ? bruta - 12 : bruta;
}
