import { describe, expect, test } from "vitest";
import { DESTINOS, esDestinoActivo } from "@/components/nav/destinos";

describe("barra de navegación fija (C.2, recortada el 2026-09-05)", () => {
  test("tiene exactamente Buscar y Aportar; Favoritos y Perfil viven en el menú del avatar", () => {
    expect(DESTINOS.map((d) => d.etiqueta)).toEqual(["Buscar", "Aportar"]);
  });

  test("no incluye el panel de administración", () => {
    const etiquetas = DESTINOS.map((d) => d.etiqueta.toLowerCase()).join(" ");
    expect(etiquetas).not.toContain("admin");
  });

  test("solo Buscar es público; Aportar pide cuenta", () => {
    const publicos = DESTINOS.filter((d) => !d.exigeSesion);
    expect(publicos.map((d) => d.href)).toEqual(["/buscar"]);
  });

  test("Buscar sigue activo mientras se navega el catálogo público", () => {
    expect(esDestinoActivo("/buscar", "/buscar")).toBe(true);
    expect(esDestinoActivo("/buscar", "/canciones/12")).toBe(true);
    expect(esDestinoActivo("/buscar", "/versiones/34")).toBe(true);
    expect(esDestinoActivo("/buscar", "/perfil")).toBe(false);
  });

  // Desde el 2026-09-11 el inicio es una pantalla propia (las dos puertas),
  // no la de buscar: ninguna pestaña del riel debe quedarse subrayada ahí.
  test("el inicio no activa ninguna sección del riel", () => {
    for (const destino of DESTINOS) {
      expect(esDestinoActivo(destino.href, "/")).toBe(false);
    }
  });

  test("un destino no se activa por un prefijo casual", () => {
    expect(esDestinoActivo("/aportar", "/aportares")).toBe(false);
    expect(esDestinoActivo("/aportar", "/aportar/algo")).toBe(true);
  });
});
