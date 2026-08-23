import { describe, expect, it } from "vitest";
import { DIRECTIVAS, parsearChordPro } from "@/domain/musica/chordpro";

/** Atajo: la línea `indice` (0-based) suponiendo que es de letra. */
function lineaDeLetra(texto: string, indice = 0) {
  const linea = parsearChordPro(texto).lineas[indice];
  if (linea.tipo !== "letra") throw new Error(`la línea ${indice} no es de letra`);
  return linea;
}

describe("DIRECTIVAS", () => {
  it("son las ocho secciones en español, sin alias en inglés", () => {
    expect(DIRECTIVAS).toEqual([
      "intro",
      "verso",
      "precoro",
      "coro",
      "puente",
      "interludio",
      "solo",
      "final",
    ]);
  });
});

describe("parsearChordPro · líneas de letra", () => {
  it("trocea la letra en segmentos que empiezan en cada acorde", () => {
    const linea = lineaDeLetra("[C]Cuando salga el [G]sol");

    expect(linea.segmentos).toEqual([
      {
        acorde: {
          acorde: { raiz: 0, calidad: "mayor", bajo: null },
          literal: "C",
          linea: 1,
          columna: 1,
        },
        texto: "Cuando salga el ",
      },
      {
        acorde: {
          acorde: { raiz: 7, calidad: "mayor", bajo: null },
          literal: "G",
          linea: 1,
          columna: 20,
        },
        texto: "sol",
      },
    ]);
  });

  it("abre un segmento sin acorde cuando la letra empieza antes del primero", () => {
    const linea = lineaDeLetra("tu voz sigue [F]siendo");

    expect(linea.segmentos[0]).toEqual({ acorde: null, texto: "tu voz sigue " });
    expect(linea.segmentos[1].acorde?.literal).toBe("F");
  });

  it("admite un acorde al final, sin letra debajo", () => {
    const linea = lineaDeLetra("final [Am]");

    expect(linea.segmentos[1]).toMatchObject({ texto: "" });
    expect(linea.segmentos[1].acorde?.literal).toBe("Am");
  });

  it("no crea segmentos vacíos en una línea sin acordes", () => {
    const linea = lineaDeLetra("solo letra");
    expect(linea.segmentos).toEqual([{ acorde: null, texto: "solo letra" }]);
  });
});

describe("parsearChordPro · líneas vacías y directivas", () => {
  it("marca como vacía la línea en blanco y la que solo tiene espacios", () => {
    const documento = parsearChordPro("a\n\n   \nb");
    expect(documento.lineas.map((l) => l.tipo)).toEqual([
      "letra",
      "vacia",
      "vacia",
      "letra",
    ]);
  });

  it("reconoce las directivas de la lista blanca y normaliza a minúsculas", () => {
    const documento = parsearChordPro("{Coro}\n{ puente }");
    expect(documento.lineas).toEqual([
      { tipo: "directiva", nombre: "coro" },
      { tipo: "directiva", nombre: "puente" },
    ]);
    expect(documento.errores).toEqual([]);
  });

  it("rechaza cualquier directiva fuera de la lista blanca", () => {
    const documento = parsearChordPro("{verso}\n{title: Sol}");

    expect(documento.errores).toHaveLength(1);
    expect(documento.errores[0]).toMatchObject({
      clase: "directiva-no-reconocida",
      linea: 2,
      columna: 1,
      literal: "title: Sol",
    });
  });

  it("acepta los corchetes dentro de una línea que no es solo directiva", () => {
    const linea = lineaDeLetra("{coro} y algo más");
    expect(linea.segmentos).toEqual([
      { acorde: null, texto: "{coro} y algo más" },
    ]);
  });
});

describe("parsearChordPro · errores con línea y columna exactas (RN-013)", () => {
  it("señala el corchete sin cerrar y sigue leyendo el resto como letra", () => {
    const documento = parsearChordPro("[C]Hola [G");

    expect(documento.errores).toEqual([
      {
        clase: "corchete-sin-cerrar",
        linea: 1,
        columna: 9,
        literal: "[G",
        mensaje: expect.any(String),
      },
    ]);
    const linea = documento.lineas[0];
    if (linea.tipo !== "letra") throw new Error("esperaba una línea de letra");
    expect(linea.segmentos[0].texto).toBe("Hola [G");
  });

  it("señala el corchete vacío y no inventa un acorde", () => {
    const documento = parsearChordPro("[]Hola");

    expect(documento.errores).toMatchObject([
      { clase: "corchete-vacio", linea: 1, columna: 1 },
    ]);
    const linea = documento.lineas[0];
    if (linea.tipo !== "letra") throw new Error("esperaba una línea de letra");
    expect(linea.segmentos).toEqual([{ acorde: null, texto: "Hola" }]);
  });

  it("conserva el literal del acorde no reconocido en su sitio (RN-005)", () => {
    const documento = parsearChordPro("Aunque el [Cadd9]camino");

    expect(documento.errores).toMatchObject([
      {
        clase: "acorde-no-reconocido",
        linea: 1,
        columna: 11,
        literal: "Cadd9",
      },
    ]);
    const linea = documento.lineas[0];
    if (linea.tipo !== "letra") throw new Error("esperaba una línea de letra");
    expect(linea.segmentos[1].acorde).toEqual({
      acorde: null,
      literal: "Cadd9",
      linea: 1,
      columna: 11,
    });
  });

  it("acumula todos los errores en vez de parar en el primero", () => {
    const documento = parsearChordPro("[Cdim]uno\n{xyz}\n[G]dos [");

    expect(documento.errores.map((e) => [e.clase, e.linea, e.columna])).toEqual([
      ["acorde-no-reconocido", 1, 1],
      ["directiva-no-reconocida", 2, 1],
      ["corchete-sin-cerrar", 3, 8],
    ]);
  });

  it("cuenta las líneas igual con saltos de Windows", () => {
    const documento = parsearChordPro("[C]uno\r\n[Hx]dos");
    expect(documento.errores[0]).toMatchObject({ linea: 2, columna: 1 });
  });

  it("no reporta errores en un documento válido", () => {
    const documento = parsearChordPro("{verso}\n[C]Cuando salga el [G]sol\n\n{coro}\n[Am7]Nada");
    expect(documento.errores).toEqual([]);
  });

  it("devuelve un documento vacío para una entrada vacía", () => {
    expect(parsearChordPro("")).toEqual({ lineas: [{ tipo: "vacia" }], errores: [] });
  });
});
