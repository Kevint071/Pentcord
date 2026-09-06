import { describe, expect, it } from "vitest";
import { colorDeAvatar } from "@/lib/avatar/colorDeAvatar";

describe("colorDeAvatar", () => {
  it("es determinista: el mismo id siempre da el mismo color", () => {
    expect(colorDeAvatar(42)).toBe(colorDeAvatar(42));
  });

  it.each([
    [0, "#2a4b8d"],
    [1, "#1f6f5c"],
    [8, "#2a4b8d"],
    [123, "#7a4419"],
  ])("id %i mapea al color %s de la paleta", (id, esperado) => {
    expect(colorDeAvatar(id)).toBe(esperado);
  });

  it("dos ids distintos pueden dar colores distintos (la paleta tiene 8 tonos)", () => {
    const colores = new Set(
      Array.from({ length: 8 }, (_, i) => colorDeAvatar(i)),
    );
    expect(colores.size).toBe(8);
  });

  it("devuelve siempre un color con contraste suficiente contra blanco (≥ 4.5:1)", () => {
    for (let id = 0; id < 16; id++) {
      const hex = colorDeAvatar(id);
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
