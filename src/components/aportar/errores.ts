import type { ClaseDeErrorDeSintaxis, ErrorDeSintaxis } from "@/domain/musica";

/**
 * E.3 · Qué impide guardar y qué solo se avisa (RN-013 / RN-005).
 *
 * El parser (A.3) acumula en la misma lista dos cosas distintas:
 *
 * - **El texto está mal escrito**: un corchete sin cerrar, unos corchetes
 *   vacíos, una llave que no es ninguna de las ocho secciones. Aquí el
 *   documento no se puede interpretar como quien lo escribió pretendía, así
 *   que el botón Guardar se desactiva hasta corregirlo (RN-013).
 * - **El acorde no es de los siete tipos de RN-005** (`Cadd9`, `Cdim`, `C9`…).
 *   El ChordPro está bien formado; lo que pasa es que PentCord no sabe
 *   transportar ese acorde. Bloquear el guardado aquí dejaría fuera media
 *   canción real, y además contradiría a RN-005, que dice explícitamente que un
 *   acorde no reconocido **se guarda y se muestra tal y como lo escribió quien
 *   aportó la versión**. Se avisa, no se bloquea.
 */
const BLOQUEANTES: readonly ClaseDeErrorDeSintaxis[] = [
  "corchete-sin-cerrar",
  "corchete-vacio",
  "directiva-no-reconocida",
];

export type ErroresSeparados = {
  /** Impiden guardar. */
  bloqueantes: ErrorDeSintaxis[];
  /** Se guardan tal cual, pero no se van a poder transportar. */
  avisos: ErrorDeSintaxis[];
};

export function separarErrores(
  errores: readonly ErrorDeSintaxis[],
): ErroresSeparados {
  const bloqueantes: ErrorDeSintaxis[] = [];
  const avisos: ErrorDeSintaxis[] = [];

  for (const error of errores) {
    if (BLOQUEANTES.includes(error.clase)) bloqueantes.push(error);
    else avisos.push(error);
  }

  return { bloqueantes, avisos };
}
