import { describe, expect, it } from "vitest";
import { parsearChordPro } from "@/domain/musica/chordpro";
import { renderizar } from "@/domain/musica/render";
import { transportarDocumento } from "@/domain/musica/transporte";
import { acordeAGrado, gradoAAcorde } from "@/domain/musica/grados";
import { claseDeTono } from "@/domain/musica/notas";
import { parsearAcorde } from "@/domain/musica/acordes";
import type { Calidad, CifradoRenderizado, Tono } from "@/domain/musica/tipos";

/**
 * A.7 · Suite de precisión — criterio **No-Go** de Fase 0 §8.
 *
 * 12 tonos × 7 calidades × 12 grados = 1008 acordes, cada uno comprobado
 * contra una tabla de teoría musical escrita a mano abajo. Si esto falla, la
 * conversión notas↔grados no es de fiar y no se avanza: es la prioridad #1
 * declarada del proyecto y el objetivo de calidad de Fase 0 §3.
 *
 * Se prueba la cadena completa —parsear ChordPro, transportar y renderizar—,
 * no las funciones sueltas: es lo que de verdad ve el músico.
 */

/**
 * Los 12 semitonos de cada tonalidad, **empezando por su tónica**. Escrita a
 * mano desde la armadura de cada tono, con la ortografía práctica de PentCord
 * (dirección según la armadura; nunca `E#`, `B#`, `Fb` ni `Cb`).
 */
const TABLA_DE_TEORIA: Record<Tono, string[]> = {
  C:    ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],
  Db:   ["Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B","C"],
  D:    ["D","D#","E","F","F#","G","G#","A","A#","B","C","C#"],
  Eb:   ["Eb","E","F","Gb","G","Ab","A","Bb","B","C","Db","D"],
  E:    ["E","F","F#","G","G#","A","A#","B","C","C#","D","D#"],
  F:    ["F","Gb","G","Ab","A","Bb","B","C","Db","D","Eb","E"],
  "F#": ["F#","G","G#","A","A#","B","C","C#","D","D#","E","F"],
  G:    ["G","G#","A","A#","B","C","C#","D","D#","E","F","F#"],
  Ab:   ["Ab","A","Bb","B","C","Db","D","Eb","E","F","Gb","G"],
  A:    ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"],
  Bb:   ["Bb","B","C","Db","D","Eb","E","F","Gb","G","Ab","A"],
  B:    ["B","C","C#","D","D#","E","F","F#","G","G#","A","A#"],
};

const TONOS_DEL_SELECTOR = Object.keys(TABLA_DE_TEORIA) as Tono[];

/** Cómo se escribe cada grado, del 1 al 7 con bemoles para los cromáticos. */
const GRADOS = ["1","b2","2","b3","3","4","b5","5","b6","6","b7","7"];

/** El sufijo de cada calidad, escrito a mano y no importado del código. */
const SUFIJO: Record<Calidad, string> = {
  mayor: "",
  menor: "m",
  septima: "7",
  maj7: "maj7",
  m7: "m7",
  sus2: "sus2",
  sus4: "sus4",
};

const CALIDADES_ESPERADAS = Object.keys(SUFIJO) as Calidad[];

/** El único acorde de una línea renderizada. */
function acordeUnico(cifrado: CifradoRenderizado): string | null {
  const linea = cifrado.lineas[0];
  if (linea.tipo !== "letra") throw new Error("esperaba una línea de letra");
  return linea.segmentos[0].acorde;
}

describe("A.7 · precisión de notas (12 tonos × 7 calidades × 12 grados)", () => {
  it.each(TONOS_DEL_SELECTOR)(
    "transporta los 84 acordes de C a %s con la ortografía correcta",
    (destino) => {
      for (let grado = 0; grado < 12; grado++) {
        for (const calidad of CALIDADES_ESPERADAS) {
          const enDo = TABLA_DE_TEORIA.C[grado] + SUFIJO[calidad];
          const documento = parsearChordPro(`[${enDo}]letra`);

          expect(documento.errores, `«${enDo}» debería ser un acorde válido`).toEqual([]);

          const cifrado = renderizar(documento, {
            tonoOriginal: "C",
            tono: destino,
            modo: "notas",
          });

          expect(
            acordeUnico(cifrado),
            `${enDo} de C a ${destino}`,
          ).toBe(TABLA_DE_TEORIA[destino][grado] + SUFIJO[calidad]);
        }
      }
    },
  );
});

describe("A.7 · precisión de grados (12 tonos × 7 calidades × 12 grados)", () => {
  it.each(TONOS_DEL_SELECTOR)(
    "numera los 84 acordes de %s respecto a su propia tónica",
    (tono) => {
      for (let grado = 0; grado < 12; grado++) {
        for (const calidad of CALIDADES_ESPERADAS) {
          const enEseTono = TABLA_DE_TEORIA[tono][grado] + SUFIJO[calidad];
          const cifrado = renderizar(parsearChordPro(`[${enEseTono}]letra`), {
            tonoOriginal: tono,
            tono,
            modo: "grados",
          });

          expect(acordeUnico(cifrado), `${enEseTono} en tono de ${tono}`).toBe(
            GRADOS[grado] + SUFIJO[calidad],
          );
        }
      }
    },
  );

  it.each(TONOS_DEL_SELECTOR)(
    "vuelve de grado a nota sin pérdida en %s",
    (tono) => {
      const tonica = claseDeTono(tono);
      for (let grado = 0; grado < 12; grado++) {
        for (const calidad of CALIDADES_ESPERADAS) {
          const original = parsearAcorde(
            TABLA_DE_TEORIA[tono][grado] + SUFIJO[calidad],
          );
          expect(original).not.toBeNull();

          const escrito = acordeAGrado(original!, tonica);
          expect(gradoAAcorde(escrito, tonica), `${escrito} en ${tono}`).toEqual(
            original,
          );
        }
      }
    },
  );
});

describe("A.7 · comprobaciones de teoría musical, a mano", () => {
  it("acierta el I-IV-V-vi de las tonalidades más usadas", () => {
    const casos: [Tono, string[]][] = [
      ["C", ["C", "F", "G", "Am"]],
      ["G", ["G", "C", "D", "Em"]],
      ["D", ["D", "G", "A", "Bm"]],
      ["A", ["A", "D", "E", "F#m"]],
      ["E", ["E", "A", "B", "C#m"]],
      ["F", ["F", "Bb", "C", "Dm"]],
      ["Bb", ["Bb", "Eb", "F", "Gm"]],
      ["Eb", ["Eb", "Ab", "Bb", "Cm"]],
      ["Ab", ["Ab", "Db", "Eb", "Fm"]],
      ["Db", ["Db", "Gb", "Ab", "Bbm"]],
      ["B", ["B", "E", "F#", "G#m"]],
      ["F#", ["F#", "B", "C#", "D#m"]],
    ];

    for (const [tono, esperados] of casos) {
      const cifrado = renderizar(parsearChordPro("[C]a [F]b [G]c [Am]d"), {
        tonoOriginal: "C",
        tono,
        modo: "notas",
      });
      const linea = cifrado.lineas[0];
      if (linea.tipo !== "letra") throw new Error("esperaba una línea de letra");
      expect(linea.segmentos.map((s) => s.acorde), `I-IV-V-vi en ${tono}`).toEqual(
        esperados,
      );
    }
  });

  it("da la vuelta completa: de C a cualquier tono y de vuelta a C", () => {
    const original = parsearChordPro(
      "{verso}\n[C]uno [Am7]dos [F]tres [G7]cuatro [C/E]cinco",
    );

    for (const intermedio of TONOS_DEL_SELECTOR) {
      const ida = transportarDocumento(original, "C", intermedio);
      const vuelta = transportarDocumento(ida, intermedio, "C");

      expect(vuelta, `ida y vuelta por ${intermedio}`).toEqual(original);
    }
  });
});
