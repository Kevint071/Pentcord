import { describe, expect, it } from "vitest";
import { parsearChordPro } from "@/domain/musica/chordpro";
import {
  transportarAcorde,
  transportarDocumento,
} from "@/domain/musica/transporte";
import type { Acorde, LineaDocumento } from "@/domain/musica/tipos";

/** Los tokens de acorde de la primera línea de letra de un documento. */
function acordesDe(linea: LineaDocumento) {
  if (linea.tipo !== "letra") throw new Error("esperaba una línea de letra");
  return linea.segmentos.map((s) => s.acorde);
}

describe("transportarAcorde", () => {
  const doMayor: Acorde = { raiz: 0, calidad: "mayor", bajo: null };

  it("suma semitonos a la raíz y conserva la calidad", () => {
    expect(transportarAcorde(doMayor, 3)).toEqual({
      raiz: 3,
      calidad: "mayor",
      bajo: null,
    });
  });

  it("da la vuelta a la octava", () => {
    expect(transportarAcorde({ raiz: 10, calidad: "m7", bajo: null }, 5)).toEqual({
      raiz: 3,
      calidad: "m7",
      bajo: null,
    });
  });

  it("acepta semitonos negativos", () => {
    expect(transportarAcorde(doMayor, -3)).toEqual({
      raiz: 9,
      calidad: "mayor",
      bajo: null,
    });
  });

  it("mueve también el bajo", () => {
    expect(transportarAcorde({ raiz: 0, calidad: "mayor", bajo: 4 }, 2)).toEqual({
      raiz: 2,
      calidad: "mayor",
      bajo: 6,
    });
  });

  it("no muta el acorde de entrada", () => {
    transportarAcorde(doMayor, 7);
    expect(doMayor).toEqual({ raiz: 0, calidad: "mayor", bajo: null });
  });
});

describe("transportarDocumento", () => {
  it("transportar al mismo tono es identidad, no error", () => {
    const original = parsearChordPro("{verso}\n[C]Cuando salga el [G]sol");
    const transportado = transportarDocumento(original, "C", "C");

    expect(transportado).toEqual(original);
    expect(transportado.errores).toEqual([]);
  });

  it("no muta el documento original (RN-003)", () => {
    const original = parsearChordPro("[C]Cuando");
    const copia = structuredClone(original);

    transportarDocumento(original, "C", "Eb");

    expect(original).toEqual(copia);
  });

  it("reescribe cada acorde con la ortografía del tono destino", () => {
    const aDb = transportarDocumento(parsearChordPro("[C]x"), "C", "Db");
    expect(acordesDe(aDb.lineas[0])[0]).toMatchObject({ acorde: { raiz: 1 }, literal: "Db" });

    const aD = transportarDocumento(parsearChordPro("[B]x"), "C", "D");
    expect(acordesDe(aD.lineas[0])[0]).toMatchObject({ acorde: { raiz: 1 }, literal: "C#" });
  });

  it("transporta el bajo con la ortografía del destino", () => {
    const documento = transportarDocumento(parsearChordPro("[C/E]x"), "C", "Ab");
    expect(acordesDe(documento.lineas[0])[0]).toMatchObject({
      acorde: { raiz: 8, calidad: "mayor", bajo: 0 },
      literal: "Ab/C",
    });
  });

  it("deja intacto el acorde no reconocido y no lo transporta (RN-005)", () => {
    const documento = transportarDocumento(
      parsearChordPro("[Cadd9]x [G]y"),
      "C",
      "Eb",
    );
    const [primero, segundo] = acordesDe(documento.lineas[0]);

    expect(primero).toMatchObject({ acorde: null, literal: "Cadd9" });
    expect(segundo).toMatchObject({ literal: "Bb" });
  });

  it("conserva la letra, las directivas y las líneas vacías", () => {
    const documento = transportarDocumento(
      parsearChordPro("{coro}\n\n[C]Cuando salga el [G]sol"),
      "C",
      "F",
    );

    expect(documento.lineas[0]).toEqual({ tipo: "directiva", nombre: "coro" });
    expect(documento.lineas[1]).toEqual({ tipo: "vacia" });
    const linea = documento.lineas[2];
    if (linea.tipo !== "letra") throw new Error("esperaba una línea de letra");
    expect(linea.segmentos.map((s) => s.texto)).toEqual([
      "Cuando salga el ",
      "sol",
    ]);
  });

  it("conserva la línea y columna originales, que apuntan al ChordPro guardado", () => {
    const documento = transportarDocumento(
      parsearChordPro("hola [G]mundo"),
      "C",
      "A",
    );
    expect(acordesDe(documento.lineas[0])[1]).toMatchObject({
      linea: 1,
      columna: 6,
    });
  });

  it("arrastra los errores de sintaxis del documento de partida", () => {
    const documento = transportarDocumento(
      parsearChordPro("[Cdim]x"),
      "C",
      "G",
    );
    expect(documento.errores).toMatchObject([
      { clase: "acorde-no-reconocido", literal: "Cdim" },
    ]);
  });
});
