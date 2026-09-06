import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Encabezado } from "@/components/nav/Encabezado";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const usarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion/SesionProvider", () => ({
  useSesion: usarSesion,
}));

// jsdom no implementa matchMedia; el interruptor de tema del encabezado lo
// necesita para saber el esquema de color del sistema.
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

test("sin sesión, el encabezado ofrece iniciar sesión y registrarse en vez del riel", () => {
  usarSesion.mockReturnValue({ estado: "anonimo" });
  render(<Encabezado />);

  expect(
    screen.getByRole("link", { name: "Iniciar sesión" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Registrarse" })).toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});

test("con sesión, el encabezado muestra el riel de Buscar y Aportar", () => {
  usarSesion.mockReturnValue({ estado: "autenticado" });
  render(<Encabezado />);

  expect(
    screen.getByRole("navigation", { name: "Secciones principales" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Registrarse" })).not.toBeInTheDocument();
});

test("mientras se confirma la sesión, no promete ninguno de los dos estados", () => {
  usarSesion.mockReturnValue({ estado: "cargando" });
  render(<Encabezado />);

  expect(screen.queryByRole("link", { name: "Registrarse" })).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});

// Desde el 2026-09-05, Favoritos y Perfil viven en el menú del avatar, no en
// el riel: en el riel solo quedan las dos secciones que no piden un menú.
test("con sesión hay un solo riel con Buscar y Aportar, más el menú del avatar", () => {
  usarSesion.mockReturnValue({
    estado: "autenticado",
    usuario: { id: 1, username: "ana", fotoPerfilUrl: null },
  });
  render(<Encabezado />);

  expect(screen.getAllByRole("navigation")).toHaveLength(1);
  for (const seccion of ["Buscar", "Aportar"]) {
    expect(screen.getByRole("link", { name: seccion })).toBeInTheDocument();
  }
  expect(screen.queryByRole("link", { name: "Favoritos" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Perfil" })).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Menú de perfil" }),
  ).toBeInTheDocument();
});

// Sin la barra inferior, si estos dos accesos se ocultaran en móvil no quedaría
// ninguna forma de entrar desde un teléfono.
test("iniciar sesión y registrarse se ven también en móvil", () => {
  usarSesion.mockReturnValue({ estado: "anonimo" });
  render(<Encabezado />);

  const acciones = screen
    .getByRole("link", { name: "Registrarse" })
    .closest("div");
  expect(acciones?.className).not.toMatch(/(^|\s)hidden(\s|$)/);
});
