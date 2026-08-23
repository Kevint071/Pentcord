import { describe, expect, it } from "vitest";
import { parsearChordPro } from "@/domain/musica/chordpro";
import { renderizar } from "@/domain/musica/render";

/**
 * A.8 · Verificación del NFR de rendimiento.
 *
 * Fase 3 §5 y los criterios de aceptación de HU-04 / HU-05 piden que abrir una
 * versión y cambiar de tono se resuelvan en **menos de 100 ms**. El dominio no
 * es todo el presupuesto (falta la pintura del navegador), así que lo que se
 * mide aquí es el coste del módulo, que debe quedar holgadamente por debajo.
 *
 * 20 corridas sobre una canción de ~40 líneas, promedio y p95. Se descartan
 * unas corridas de calentamiento para no medir la primera compilación del JIT.
 */

const CORRIDAS = 20;
const CALENTAMIENTO = 5;
const LIMITE_MS = 100;

/** Canción de ~40 líneas: 6 secciones, acordes con bajo y uno no reconocido. */
function cancionDeCuarentaLineas(): string {
  const secciones = ["intro", "verso", "precoro", "coro", "puente", "final"];
  const lineas: string[] = [];

  for (const [indice, seccion] of secciones.entries()) {
    lineas.push(`{${seccion}}`);
    for (let n = 0; n < 5; n++) {
      lineas.push(
        n % 2 === 0
          ? "[C]Cuando salga el [G]sol sobre el [Am7]valle,"
          : "[F]yo estaré can[C/E]tando otra [G7]vez sin pa[Dm]rar,",
      );
    }
    if (indice === 4) lineas.push("[Cadd9]aunque el camino [Gsus4]cambie de lu[Am]gar,");
    lineas.push("");
  }

  return lineas.join("\n");
}

function medir(operacion: () => void): { promedio: number; p95: number } {
  for (let n = 0; n < CALENTAMIENTO; n++) operacion();

  const muestras: number[] = [];
  for (let n = 0; n < CORRIDAS; n++) {
    const inicio = performance.now();
    operacion();
    muestras.push(performance.now() - inicio);
  }

  muestras.sort((a, b) => a - b);
  return {
    promedio: muestras.reduce((total, ms) => total + ms, 0) / muestras.length,
    p95: muestras[Math.ceil(0.95 * muestras.length) - 1],
  };
}

describe("A.8 · rendimiento sobre una canción de ~40 líneas", () => {
  const chordpro = cancionDeCuarentaLineas();

  it("la canción de prueba tiene alrededor de 40 líneas", () => {
    const total = chordpro.split("\n").length;
    expect(total).toBeGreaterThanOrEqual(38);
    expect(total).toBeLessThanOrEqual(45);
  });

  it("abrir la versión (parsear + renderizar) queda por debajo de 100 ms (HU-04)", () => {
    const { promedio, p95 } = medir(() => {
      renderizar(parsearChordPro(chordpro), {
        tonoOriginal: "C",
        tono: "C",
        modo: "notas",
      });
    });

    console.log(
      `HU-04 abrir versión: promedio ${promedio.toFixed(3)} ms · p95 ${p95.toFixed(3)} ms`,
    );
    expect(promedio).toBeLessThan(LIMITE_MS);
    expect(p95).toBeLessThan(LIMITE_MS);
  });

  it("cambiar de tono sobre el documento ya parseado queda por debajo de 100 ms (HU-05)", () => {
    const documento = parsearChordPro(chordpro);
    const tonos = ["Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
    let siguiente = 0;

    const { promedio, p95 } = medir(() => {
      renderizar(documento, {
        tonoOriginal: "C",
        tono: tonos[siguiente++ % tonos.length],
        modo: "notas",
      });
    });

    console.log(
      `HU-05 cambiar de tono: promedio ${promedio.toFixed(3)} ms · p95 ${p95.toFixed(3)} ms`,
    );
    expect(promedio).toBeLessThan(LIMITE_MS);
    expect(p95).toBeLessThan(LIMITE_MS);
  });

  it("convertir a grados queda por debajo de 100 ms (HU-06)", () => {
    const documento = parsearChordPro(chordpro);

    const { promedio, p95 } = medir(() => {
      renderizar(documento, { tonoOriginal: "C", tono: "Eb", modo: "grados" });
    });

    console.log(
      `HU-06 ver en grados: promedio ${promedio.toFixed(3)} ms · p95 ${p95.toFixed(3)} ms`,
    );
    expect(promedio).toBeLessThan(LIMITE_MS);
    expect(p95).toBeLessThan(LIMITE_MS);
  });
});
