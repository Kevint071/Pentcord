import { describe, expect, it } from "vitest";
import { CALIDADES, nombrarAcorde, parsearAcorde } from "@/domain/musica/acordes";
import type { Acorde } from "@/domain/musica/tipos";

describe("CALIDADES", () => {
  it("son exactamente las siete calidades de RN-005", () => {
    expect(CALIDADES).toEqual([
      "mayor",
      "menor",
      "septima",
      "maj7",
      "m7",
      "sus2",
      "sus4",
    ]);
  });
});

describe("parsearAcorde", () => {
  it("lee las siete calidades sobre la misma raíz", () => {
    expect(parsearAcorde("C")).toEqual({ raiz: 0, calidad: "mayor", bajo: null });
    expect(parsearAcorde("Cm")).toEqual({ raiz: 0, calidad: "menor", bajo: null });
    expect(parsearAcorde("C7")).toEqual({ raiz: 0, calidad: "septima", bajo: null });
    expect(parsearAcorde("Cmaj7")).toEqual({ raiz: 0, calidad: "maj7", bajo: null });
    expect(parsearAcorde("Cm7")).toEqual({ raiz: 0, calidad: "m7", bajo: null });
    expect(parsearAcorde("Csus2")).toEqual({ raiz: 0, calidad: "sus2", bajo: null });
    expect(parsearAcorde("Csus4")).toEqual({ raiz: 0, calidad: "sus4", bajo: null });
  });

  it("lee raíces alteradas", () => {
    expect(parsearAcorde("F#m")).toEqual({ raiz: 6, calidad: "menor", bajo: null });
    expect(parsearAcorde("Bb")).toEqual({ raiz: 10, calidad: "mayor", bajo: null });
  });

  it("acepta las grafías alternativas más comunes de cada calidad", () => {
    expect(parsearAcorde("Cmin")?.calidad).toBe("menor");
    expect(parsearAcorde("CM7")?.calidad).toBe("maj7");
    expect(parsearAcorde("CMaj7")?.calidad).toBe("maj7");
    expect(parsearAcorde("Cmin7")?.calidad).toBe("m7");
    expect(parsearAcorde("Csus")?.calidad).toBe("sus4");
  });

  it("lee acordes con bajo", () => {
    expect(parsearAcorde("C/E")).toEqual({ raiz: 0, calidad: "mayor", bajo: 4 });
    expect(parsearAcorde("Am7/G")).toEqual({ raiz: 9, calidad: "m7", bajo: 7 });
  });

  it("devuelve null para las calidades fuera de RN-005", () => {
    for (const fuera of ["Cadd9", "C9", "Cdim", "Caug", "C6", "Cm7b5", "C11"]) {
      expect(parsearAcorde(fuera)).toBeNull();
    }
  });

  it("devuelve null para texto que no es un acorde", () => {
    for (const basura of ["", "c", "H", "x", "C/", "/E", "C/H", "Cmm", "C ", "1"]) {
      expect(parsearAcorde(basura)).toBeNull();
    }
  });
});

describe("nombrarAcorde", () => {
  const laMenorSeptima: Acorde = { raiz: 9, calidad: "m7", bajo: null };

  it("escribe la calidad en su forma canónica, no en la que se escribió", () => {
    const acorde = parsearAcorde("CMaj7")!;
    expect(nombrarAcorde(acorde, "C")).toBe("Cmaj7");
  });

  it("escribe el mayor sin sufijo", () => {
    expect(nombrarAcorde({ raiz: 7, calidad: "mayor", bajo: null }, "C")).toBe("G");
  });

  it("usa la ortografía de la tonalidad en la que se pinta", () => {
    const acorde: Acorde = { raiz: 1, calidad: "mayor", bajo: null };
    expect(nombrarAcorde(acorde, "Eb")).toBe("Db");
    expect(nombrarAcorde(acorde, "D")).toBe("C#");
  });

  it("escribe también el bajo con la ortografía de la tonalidad", () => {
    const acorde: Acorde = { raiz: 8, calidad: "mayor", bajo: 3 };
    expect(nombrarAcorde(acorde, "Ab")).toBe("Ab/Eb");
    expect(nombrarAcorde(acorde, "E")).toBe("G#/D#");
  });

  it("da la vuelta a parsearAcorde sin pérdida", () => {
    expect(nombrarAcorde(laMenorSeptima, "C")).toBe("Am7");
    expect(parsearAcorde(nombrarAcorde(laMenorSeptima, "C"))).toEqual(laMenorSeptima);
  });
});
