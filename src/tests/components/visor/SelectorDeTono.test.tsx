import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  SelectorDeTono,
  distanciaEnSemitonos,
  etiquetaDeDistancia,
} from "@/components/visor/SelectorDeTono";

describe("distancia entre tonos", () => {
  test("toma siempre el camino más corto", () => {
    expect(distanciaEnSemitonos("C", "D")).toBe(2);
    expect(distanciaEnSemitonos("C", "Bb")).toBe(-2);
    expect(distanciaEnSemitonos("C", "C")).toBe(0);
  });

  // HU-05: transportar al mismo tono es una operación válida, no un error.
  test("el tono original se nombra como tal, no como +0", () => {
    expect(etiquetaDeDistancia("C", "C")).toBe("Tono original");
  });

  test("distingue singular y plural, y el sentido del cambio", () => {
    expect(etiquetaDeDistancia("C", "Db")).toBe("+1 semitono");
    expect(etiquetaDeDistancia("C", "A")).toBe("−3 semitonos");
  });
});

describe("SelectorDeTono", () => {
  test("expone las doce teclas como un grupo de opciones", () => {
    render(
      <SelectorDeTono tonoActivo="C" tonoOriginal="C" onCambiar={() => {}} />,
    );

    expect(screen.getAllByRole("radio")).toHaveLength(12);
    expect(
      screen.getByRole("radiogroup", { name: "Tono de la canción" }),
    ).toBeInTheDocument();
  });

  test("marca el tono activo y nombra el original al lector de pantalla", () => {
    render(
      <SelectorDeTono tonoActivo="D" tonoOriginal="C" onCambiar={() => {}} />,
    );

    expect(screen.getByRole("radio", { name: "D" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "C, tono original" }),
    ).toBeInTheDocument();
  });

  test("un toque en una tecla pide ese tono", async () => {
    const alCambiar = vi.fn();
    const usuario = userEvent.setup();

    render(
      <SelectorDeTono tonoActivo="C" tonoOriginal="C" onCambiar={alCambiar} />,
    );

    await usuario.click(screen.getByRole("radio", { name: "E bemol" }));

    expect(alCambiar).toHaveBeenCalledWith("Eb");
  });

  // Las flechas se mueven por la escala cromática, no por el orden visual de
  // las teclas: a la derecha de C está Db, no D.
  test("las flechas se mueven de semitono en semitono", async () => {
    const alCambiar = vi.fn();
    const usuario = userEvent.setup();

    render(
      <SelectorDeTono tonoActivo="C" tonoOriginal="C" onCambiar={alCambiar} />,
    );

    await usuario.tab();
    await usuario.keyboard("{ArrowRight}");
    expect(alCambiar).toHaveBeenLastCalledWith("Db");

    await usuario.keyboard("{ArrowLeft}");
    expect(alCambiar).toHaveBeenLastCalledWith("B");
  });

  test("Inicio devuelve al tono original", async () => {
    const alCambiar = vi.fn();
    const usuario = userEvent.setup();

    render(
      <SelectorDeTono tonoActivo="F" tonoOriginal="A" onCambiar={alCambiar} />,
    );

    await usuario.tab();
    await usuario.keyboard("{Home}");

    expect(alCambiar).toHaveBeenLastCalledWith("A");
  });

  // Tabulación itinerante: las doce teclas son un solo alto de tabulador.
  test("solo el tono activo entra en el orden de tabulación", async () => {
    const usuario = userEvent.setup();

    render(
      <SelectorDeTono tonoActivo="G" tonoOriginal="C" onCambiar={() => {}} />,
    );

    await usuario.tab();

    expect(screen.getByRole("radio", { name: "G" })).toHaveFocus();
  });
});
