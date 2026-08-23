import { describe, expect, it } from "vitest";
import {
  TONOS,
  claseDePitch,
  claseDeTono,
  distanciaEnSemitonos,
  esTono,
  nombrarNota,
} from "@/domain/musica/notas";
import type { ClaseDePitch, Tono } from "@/domain/musica/tipos";

/**
 * Tabla de teoría musical escrita a mano, no derivada del código (A.1 / A.7).
 *
 * Para cada una de las 12 tonalidades del selector, el nombre que le
 * corresponde a cada clase de pitch 0–11. Es la ortografía **práctica**
 * decidida para PentCord: la dirección (sostenidos o bemoles) la marca la
 * armadura de la tonalidad, y nunca se escriben `E#`, `B#`, `Fb` ni `Cb`.
 */
const ORTOGRAFIA_ESPERADA: Record<Tono, string[]> = {
  //     0     1     2     3     4     5     6     7     8     9    10    11
  C:    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  Db:   ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  D:    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  Eb:   ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  E:    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  F:    ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  "F#": ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  G:    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  Ab:   ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  A:    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  Bb:   ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  B:    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
};

const CLASES: ClaseDePitch[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

describe("TONOS", () => {
  it("son los 12 tonos del selector, en orden cromático desde C", () => {
    expect(TONOS).toEqual([
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
    ]);
  });
});

describe("nombrarNota", () => {
  it.each(TONOS)(
    "escribe las 12 clases de pitch con la ortografía de %s",
    (tonalidad) => {
      const obtenido = CLASES.map((clase) => nombrarNota(clase, tonalidad));
      expect(obtenido).toEqual(ORTOGRAFIA_ESPERADA[tonalidad]);
    },
  );

  it("distingue Db de C# según la tonalidad (el error de la maqueta)", () => {
    expect(nombrarNota(1, "Eb")).toBe("Db");
    expect(nombrarNota(1, "D")).toBe("C#");
  });

  it("nunca escribe E#, B#, Fb ni Cb", () => {
    const prohibidas = ["E#", "B#", "Fb", "Cb"];
    for (const tonalidad of TONOS) {
      for (const clase of CLASES) {
        expect(prohibidas).not.toContain(nombrarNota(clase, tonalidad));
      }
    }
  });
});

describe("claseDePitch", () => {
  it("lee las siete naturales", () => {
    expect(
      ["C", "D", "E", "F", "G", "A", "B"].map(claseDePitch),
    ).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it("lee sostenidos y bemoles", () => {
    expect(claseDePitch("C#")).toBe(1);
    expect(claseDePitch("Db")).toBe(1);
    expect(claseDePitch("A#")).toBe(10);
    expect(claseDePitch("Bb")).toBe(10);
  });

  it("acepta como entrada las enarmónicas que nunca escribe de salida", () => {
    expect(claseDePitch("E#")).toBe(5);
    expect(claseDePitch("B#")).toBe(0);
    expect(claseDePitch("Fb")).toBe(4);
    expect(claseDePitch("Cb")).toBe(11);
  });

  it("devuelve null para lo que no es una nota", () => {
    expect(claseDePitch("H")).toBeNull();
    expect(claseDePitch("c")).toBeNull();
    expect(claseDePitch("")).toBeNull();
    expect(claseDePitch("C##")).toBeNull();
    expect(claseDePitch("Cx")).toBeNull();
  });
});

describe("distanciaEnSemitonos", () => {
  it("es cero cuando el tono no cambia", () => {
    expect(distanciaEnSemitonos("C", "C")).toBe(0);
  });

  it("toma siempre el camino más corto, entre -5 y +6", () => {
    expect(distanciaEnSemitonos("C", "D")).toBe(2);
    expect(distanciaEnSemitonos("C", "F#")).toBe(6);
    expect(distanciaEnSemitonos("C", "G")).toBe(-5);
    expect(distanciaEnSemitonos("Eb", "C")).toBe(-3);
    expect(distanciaEnSemitonos("B", "C")).toBe(1);
  });
});

describe("esTono", () => {
  it("reconoce los tonos del selector", () => {
    expect(esTono("F#")).toBe(true);
    expect(esTono("Bb")).toBe(true);
  });

  it("rechaza enarmónicas que no están en el selector y basura", () => {
    expect(esTono("C#")).toBe(false);
    expect(esTono("Gb")).toBe(false);
    expect(esTono("H")).toBe(false);
  });
});

describe("claseDeTono", () => {
  it("da la clase de pitch de cada tono del selector", () => {
    expect(TONOS.map(claseDeTono)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });
});
