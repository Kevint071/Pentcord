import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Cifrado, contarNoReconocidos } from "@/components/visor/Cifrado";
import type { CifradoRenderizado } from "@/domain/musica/tipos";

const CIFRADO: CifradoRenderizado = {
  tono: "C",
  modo: "notas",
  lineas: [
    { tipo: "directiva", nombre: "coro" },
    {
      tipo: "letra",
      segmentos: [
        { acorde: "C", reconocido: true, texto: "Cuando salga el " },
        { acorde: "G", reconocido: true, texto: "sol" },
      ],
    },
    { tipo: "vacia" },
    {
      tipo: "letra",
      segmentos: [
        { acorde: "Cadd9", reconocido: false, texto: "Aunque el " },
        { acorde: null, reconocido: true, texto: "camino cambie" },
      ],
    },
  ],
};

/** La letra sin los acordes intercalados: es lo que lee el músico. */
function soloLaLetra(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".cifrado-letra"))
    .map((nodo) => nodo.textContent)
    .join("");
}

describe("Cifrado", () => {
  test("pinta la letra completa y cada acorde por separado", () => {
    const { container } = render(<Cifrado cifrado={CIFRADO} />);

    expect(soloLaLetra(container)).toContain("Cuando salga el sol");
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  // RN-009b: la visualización nunca muestra el ChordPro crudo.
  test("no deja escapar corchetes de ChordPro al texto visible", () => {
    const { container } = render(<Cifrado cifrado={CIFRADO} />);

    expect(container.textContent).not.toContain("[C]");
    expect(container.textContent).not.toMatch(/\[[A-G]/);
  });

  // RN-005: se marca el acorde no reconocido sin romper el resto de la canción.
  test("marca el acorde no reconocido y deja intacto lo que lo rodea", () => {
    const { container } = render(<Cifrado cifrado={CIFRADO} />);

    const marcado = screen.getByText("Cadd9");
    expect(marcado).toHaveAttribute("data-reconocido", "false");

    const reconocido = screen.getByText("C");
    expect(reconocido).toHaveAttribute("data-reconocido", "true");
    expect(soloLaLetra(container)).toContain("Aunque el camino cambie");
  });

  test("el acorde no reconocido no se comunica solo con color", () => {
    render(<Cifrado cifrado={CIFRADO} />);

    // Además del rojo lleva un título explicativo y el subrayado ondulado y el
    // `?` que añade la hoja de estilos (Fase 7 §4).
    expect(screen.getByText("Cadd9")).toHaveAttribute(
      "title",
      expect.stringContaining("no es un acorde"),
    );
  });

  test("una directiva se pinta como sección, no como acorde", () => {
    render(<Cifrado cifrado={CIFRADO} />);
    expect(screen.getByText("coro")).toBeInTheDocument();
  });

  test("contarNoReconocidos ignora los segmentos sin acorde", () => {
    expect(contarNoReconocidos(CIFRADO)).toBe(1);
  });
});
