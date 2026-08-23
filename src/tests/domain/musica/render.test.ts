import { describe, expect, it } from "vitest";
import { parsearChordPro } from "@/domain/musica/chordpro";
import { renderizar } from "@/domain/musica/render";
import type { CifradoRenderizado } from "@/domain/musica/tipos";

/** Los segmentos de la línea `indice` de un cifrado ya renderizado. */
function segmentos(cifrado: CifradoRenderizado, indice = 0) {
  const linea = cifrado.lineas[indice];
  if (linea.tipo !== "letra") throw new Error(`la línea ${indice} no es de letra`);
  return linea.segmentos;
}

describe("renderizar · modo notas", () => {
  it("pinta los acordes del tono original cuando no se transporta", () => {
    const cifrado = renderizar(parsearChordPro("[C]Cuando salga el [G]sol"), {
      tonoOriginal: "C",
      tono: "C",
      modo: "notas",
    });

    expect(segmentos(cifrado)).toEqual([
      { acorde: "C", reconocido: true, texto: "Cuando salga el " },
      { acorde: "G", reconocido: true, texto: "sol" },
    ]);
  });

  it("transporta con la ortografía del tono activo", () => {
    const documento = parsearChordPro("[C]x [B]y");

    const aEb = renderizar(documento, { tonoOriginal: "C", tono: "Eb", modo: "notas" });
    expect(segmentos(aEb).map((s) => s.acorde)).toEqual(["Eb", "D"]);

    const aD = renderizar(documento, { tonoOriginal: "C", tono: "D", modo: "notas" });
    expect(segmentos(aD).map((s) => s.acorde)).toEqual(["D", "C#"]);
  });

  it("devuelve el tono y el modo con los que está pintado", () => {
    const cifrado = renderizar(parsearChordPro("[C]x"), {
      tonoOriginal: "C",
      tono: "Bb",
      modo: "notas",
    });
    expect(cifrado).toMatchObject({ tono: "Bb", modo: "notas" });
  });

  it("no muta el documento de partida (RN-003)", () => {
    const documento = parsearChordPro("[C]x");
    const copia = structuredClone(documento);

    renderizar(documento, { tonoOriginal: "C", tono: "F#", modo: "notas" });

    expect(documento).toEqual(copia);
  });
});

describe("renderizar · modo grados (RN-004)", () => {
  it("numera respecto al tono activo en pantalla, no a uno fijo", () => {
    const documento = parsearChordPro("[G]x");

    const enDo = renderizar(documento, { tonoOriginal: "C", tono: "C", modo: "grados" });
    expect(segmentos(enDo)[0].acorde).toBe("5");

    const enSol = renderizar(documento, { tonoOriginal: "G", tono: "G", modo: "grados" });
    expect(segmentos(enSol)[0].acorde).toBe("1");
  });

  it("los grados no cambian al transportar, porque la referencia se mueve con ellos", () => {
    const documento = parsearChordPro("[C]a [Am7]b [F]c [G7]d");
    const gradosEn = (tono: "C" | "Eb" | "B") =>
      segmentos(
        renderizar(documento, { tonoOriginal: "C", tono, modo: "grados" }),
      ).map((s) => s.acorde);

    expect(gradosEn("C")).toEqual(["1", "6m7", "4", "57"]);
    expect(gradosEn("Eb")).toEqual(["1", "6m7", "4", "57"]);
    expect(gradosEn("B")).toEqual(["1", "6m7", "4", "57"]);
  });
});

describe("renderizar · acordes no reconocidos (RN-005)", () => {
  it("los pinta tal cual, marcados, sin romper el resto de la línea", () => {
    const cifrado = renderizar(parsearChordPro("[Cadd9]uno [G]dos"), {
      tonoOriginal: "C",
      tono: "Eb",
      modo: "notas",
    });

    expect(segmentos(cifrado)).toEqual([
      { acorde: "Cadd9", reconocido: false, texto: "uno   " },
      { acorde: "Bb", reconocido: true, texto: "dos" },
    ]);
  });

  it("tampoco los convierte a grados", () => {
    const cifrado = renderizar(parsearChordPro("[Cadd9]uno"), {
      tonoOriginal: "C",
      tono: "C",
      modo: "grados",
    });
    expect(segmentos(cifrado)[0]).toMatchObject({
      acorde: "Cadd9",
      reconocido: false,
    });
  });

  it("un segmento sin acorde no está «no reconocido»", () => {
    const cifrado = renderizar(parsearChordPro("solo letra"), {
      tonoOriginal: "C",
      tono: "C",
      modo: "notas",
    });
    expect(segmentos(cifrado)[0]).toEqual({
      acorde: null,
      reconocido: true,
      texto: "solo letra",
    });
  });
});

describe("renderizar · estructura de la canción", () => {
  it("pasa las directivas y las líneas vacías", () => {
    const cifrado = renderizar(parsearChordPro("{coro}\n\n[C]x"), {
      tonoOriginal: "C",
      tono: "C",
      modo: "notas",
    });

    expect(cifrado.lineas[0]).toEqual({ tipo: "directiva", nombre: "coro" });
    expect(cifrado.lineas[1]).toEqual({ tipo: "vacia" });
    expect(cifrado.lineas[2].tipo).toBe("letra");
  });
});

describe("renderizar · solapamiento de acordes largos", () => {
  it("rellena la letra con espacios para que el acorde siguiente no se pise", () => {
    const cifrado = renderizar(parsearChordPro("[Cmaj7]Sol [G]va"), {
      tonoOriginal: "C",
      tono: "C",
      modo: "notas",
    });

    // «Cmaj7» mide 5, así que su trozo de letra necesita al menos 6.
    expect(segmentos(cifrado).map((s) => s.texto)).toEqual(["Sol   ", "va"]);
  });

  it("no rellena el último segmento de la línea: no hay nada que pisar", () => {
    const cifrado = renderizar(parsearChordPro("[C]hola [Cmaj7]a"), {
      tonoOriginal: "C",
      tono: "C",
      modo: "notas",
    });
    expect(segmentos(cifrado).map((s) => s.texto)).toEqual(["hola ", "a"]);
  });

  it("no toca la letra cuando ya es más larga que el acorde", () => {
    const cifrado = renderizar(parsearChordPro("[C]Cuando salga el [G]sol"), {
      tonoOriginal: "C",
      tono: "C",
      modo: "notas",
    });
    expect(segmentos(cifrado)[0].texto).toBe("Cuando salga el ");
  });
});
