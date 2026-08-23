/**
 * A.2 · Parser y formateador de acordes (RN-005).
 *
 * Las calidades soportadas son siete y solo siete: mayor, menor, séptima
 * dominante, séptima mayor, séptima menor, sus2 y sus4; más la inversión con
 * bajo (`C/E`). Cualquier otra cosa —`Cadd9`, `Cdim`, `C9`— **no es un error
 * del parser**: devuelve `null`, y quien llama decide qué hacer con eso. En el
 * visor se pinta tal cual y marcado (RN-005); al guardar, se rechaza (RN-009).
 *
 * De entrada se aceptan las grafías alternativas más frecuentes (`Cmin`,
 * `CM7`, `Csus`), pero de salida siempre se escribe la forma canónica: si el
 * aportante escribió `CMaj7`, el visor muestra `Cmaj7`.
 */
import { claseDePitch, nombrarNota } from "./notas";
import type { Acorde, Calidad, ClaseDePitch, Tono } from "./tipos";

/** Orden estable, usado también por la suite de precisión de A.7. */
export const CALIDADES: readonly Calidad[] = [
  "mayor",
  "menor",
  "septima",
  "maj7",
  "m7",
  "sus2",
  "sus4",
] as const;

/**
 * Lo que se acepta escrito detrás de la raíz. Es un `Map` a propósito: con un
 * objeto plano, un sufijo como `toString` heredaría un valor de
 * `Object.prototype` y `CtoString` pasaría por acorde válido.
 */
const CALIDAD_POR_SUFIJO = new Map<string, Calidad>([
  ["", "mayor"],
  ["m", "menor"],
  ["min", "menor"],
  ["7", "septima"],
  ["maj7", "maj7"],
  ["Maj7", "maj7"],
  ["M7", "maj7"],
  ["m7", "m7"],
  ["min7", "m7"],
  ["sus2", "sus2"],
  ["sus4", "sus4"],
  // `sus` a secas es sus4 por convención.
  ["sus", "sus4"],
]);

/** La calidad que corresponde a un sufijo escrito, o `undefined` si no es de RN-005. */
export function calidadDeSufijo(sufijo: string): Calidad | undefined {
  return CALIDAD_POR_SUFIJO.get(sufijo);
}

/** Cómo se escribe cada calidad. Es la única forma que sale del dominio. */
export const SUFIJO_DE_CALIDAD: Record<Calidad, string> = {
  mayor: "",
  menor: "m",
  septima: "7",
  maj7: "maj7",
  m7: "m7",
  sus2: "sus2",
  sus4: "sus4",
};

/** Raíz (obligatoria) y todo lo que venga detrás (la calidad, sin validar). */
const RAIZ_Y_SUFIJO = /^([A-G][#b]?)(.*)$/;

/** Interpreta un acorde, o `null` si no es de los tipos de RN-005. */
export function parsearAcorde(texto: string): Acorde | null {
  const barra = texto.indexOf("/");
  const cuerpo = barra === -1 ? texto : texto.slice(0, barra);
  const nombreDelBajo = barra === -1 ? null : texto.slice(barra + 1);

  const partes = RAIZ_Y_SUFIJO.exec(cuerpo);
  if (!partes) return null;

  const raiz = claseDePitch(partes[1]);
  if (raiz === null) return null;

  const calidad = CALIDAD_POR_SUFIJO.get(partes[2]);
  if (calidad === undefined) return null;

  let bajo: ClaseDePitch | null = null;
  if (nombreDelBajo !== null) {
    bajo = claseDePitch(nombreDelBajo);
    if (bajo === null) return null;
  }

  return { raiz, calidad, bajo };
}

/** Escribe un acorde con la ortografía que pide la tonalidad activa. */
export function nombrarAcorde(acorde: Acorde, tonalidad: Tono): string {
  const cuerpo = nombrarNota(acorde.raiz, tonalidad) + SUFIJO_DE_CALIDAD[acorde.calidad];
  if (acorde.bajo === null) return cuerpo;
  return `${cuerpo}/${nombrarNota(acorde.bajo, tonalidad)}`;
}
