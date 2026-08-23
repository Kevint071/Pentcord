import { describe, expect, it } from "vitest";
import { CALIDADES } from "@/domain/musica/acordes";
import { acordeAGrado, gradoAAcorde } from "@/domain/musica/grados";
import type { Acorde, Calidad, ClaseDePitch } from "@/domain/musica/tipos";

const DO: ClaseDePitch = 0;
const SOL: ClaseDePitch = 7;

function acorde(raiz: ClaseDePitch, calidad: Calidad = "mayor", bajo: ClaseDePitch | null = null): Acorde {
  return { raiz, calidad, bajo };
}

describe("acordeAGrado", () => {
  it("numera los siete grados de la escala mayor", () => {
    const enDo = [0, 2, 4, 5, 7, 9, 11] as ClaseDePitch[];
    expect(enDo.map((raiz) => acordeAGrado(acorde(raiz), DO))).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
    ]);
  });

  it("escribe los cromáticos con bemol", () => {
    const cromaticos = [1, 3, 6, 8, 10] as ClaseDePitch[];
    expect(cromaticos.map((raiz) => acordeAGrado(acorde(raiz), DO))).toEqual([
      "b2",
      "b3",
      "b5",
      "b6",
      "b7",
    ]);
  });

  it("es relativo al tono activo en pantalla, no a uno fijo (RN-004)", () => {
    expect(acordeAGrado(acorde(SOL), DO)).toBe("5");
    expect(acordeAGrado(acorde(SOL), SOL)).toBe("1");
  });

  it("pega el sufijo de la calidad detrás del número", () => {
    expect(acordeAGrado(acorde(9, "menor"), DO)).toBe("6m");
    expect(acordeAGrado(acorde(7, "septima"), DO)).toBe("57");
    expect(acordeAGrado(acorde(0, "maj7"), DO)).toBe("1maj7");
    expect(acordeAGrado(acorde(9, "m7"), DO)).toBe("6m7");
    expect(acordeAGrado(acorde(5, "sus4"), DO)).toBe("4sus4");
    expect(acordeAGrado(acorde(2, "sus2"), DO)).toBe("2sus2");
  });

  it("escribe el bajo como grado, también relativo a la tónica", () => {
    expect(acordeAGrado(acorde(0, "mayor", 4), DO)).toBe("1/3");
    expect(acordeAGrado(acorde(9, "m7", 7), DO)).toBe("6m7/5");
  });
});

describe("gradoAAcorde", () => {
  it("lee los grados que escribe acordeAGrado", () => {
    expect(gradoAAcorde("6m", DO)).toEqual(acorde(9, "menor"));
    expect(gradoAAcorde("57", DO)).toEqual(acorde(7, "septima"));
    expect(gradoAAcorde("4sus4", DO)).toEqual(acorde(5, "sus4"));
    expect(gradoAAcorde("b7", DO)).toEqual(acorde(10, "mayor"));
    expect(gradoAAcorde("1/3", DO)).toEqual(acorde(0, "mayor", 4));
  });

  it("es relativo a la tónica que se le pase", () => {
    expect(gradoAAcorde("5", DO)).toEqual(acorde(7));
    expect(gradoAAcorde("5", SOL)).toEqual(acorde(2));
  });

  it("acepta sostenidos de entrada aunque nunca los escriba", () => {
    expect(gradoAAcorde("#4", DO)).toEqual(acorde(6));
    expect(gradoAAcorde("#4", DO)).toEqual(gradoAAcorde("b5", DO));
  });

  it("devuelve null para lo que no es un grado", () => {
    for (const basura of ["", "0", "8", "H", "1x", "6dim", "1/", "/3", "1/8", "b", "11"]) {
      expect(gradoAAcorde(basura, DO)).toBeNull();
    }
  });
});

describe("ida y vuelta", () => {
  it("no pierde nada en ninguna de las 12 tónicas por 12 raíces por 7 calidades", () => {
    for (let tonica = 0; tonica < 12; tonica++) {
      for (let raiz = 0; raiz < 12; raiz++) {
        for (const calidad of CALIDADES) {
          const original = acorde(raiz as ClaseDePitch, calidad);
          const grado = acordeAGrado(original, tonica as ClaseDePitch);
          expect(gradoAAcorde(grado, tonica as ClaseDePitch)).toEqual(original);
        }
      }
    }
  });

  it("no pierde el bajo en la vuelta", () => {
    for (let bajo = 0; bajo < 12; bajo++) {
      const original = acorde(0, "m7", bajo as ClaseDePitch);
      expect(gradoAAcorde(acordeAGrado(original, DO), DO)).toEqual(original);
    }
  });
});
