import { describe, expect, test } from "vitest";
import { DESTINOS, esDestinoActivo } from "@/components/nav/destinos";

describe("barra de navegación fija (C.2)", () => {
  test("tiene exactamente los cuatro destinos de Fase 7 §1", () => {
    expect(DESTINOS.map((d) => d.etiqueta)).toEqual([
      "Buscar",
      "Favoritos",
      "Aportar",
      "Perfil",
    ]);
  });

  // El panel de admin vive dentro de Perfil y solo con rol administrador.
  test("no incluye el panel de administración", () => {
    const etiquetas = DESTINOS.map((d) => d.etiqueta.toLowerCase()).join(" ");
    expect(etiquetas).not.toContain("admin");
  });

  test("solo Buscar es público; los otros tres piden cuenta", () => {
    const publicos = DESTINOS.filter((d) => !d.exigeSesion);
    expect(publicos.map((d) => d.href)).toEqual(["/"]);
  });

  test("Buscar sigue activo mientras se navega el catálogo público", () => {
    expect(esDestinoActivo("/", "/canciones/12")).toBe(true);
    expect(esDestinoActivo("/", "/versiones/34")).toBe(true);
    expect(esDestinoActivo("/", "/perfil")).toBe(false);
  });

  test("un destino no se activa por un prefijo casual", () => {
    expect(esDestinoActivo("/perfil", "/perfiles")).toBe(false);
    expect(esDestinoActivo("/perfil", "/perfil/aportes")).toBe(true);
  });
});
