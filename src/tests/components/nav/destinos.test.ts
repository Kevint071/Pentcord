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
    expect(publicos.map((d) => d.href)).toEqual(["/"]);
  });

  test("Buscar sigue activo mientras se navega el catálogo público", () => {
    expect(esDestinoActivo("/", "/canciones/12")).toBe(true);
    expect(esDestinoActivo("/", "/versiones/34")).toBe(true);
    expect(esDestinoActivo("/", "/perfil")).toBe(false);
  });

  test("un destino no se activa por un prefijo casual", () => {
    expect(esDestinoActivo("/aportar", "/aportares")).toBe(false);
    expect(esDestinoActivo("/aportar", "/aportar/algo")).toBe(true);
  });
});
