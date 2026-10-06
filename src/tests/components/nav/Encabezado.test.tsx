import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Encabezado } from "@/components/nav/Encabezado";

const empujar = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: empujar }),
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
// En móvil solo queda "Entrar" (lleva a /login, que ya tiene el selector de
// crear cuenta); "Registrarse" aparece desde `sm`.
test("en móvil queda un solo acceso, 'Entrar', y 'Registrarse' se oculta", () => {
  usarSesion.mockReturnValue({ estado: "anonimo" });
  render(<Encabezado />);

  const entrar = screen.getByRole("link", { name: "Iniciar sesión" });
  expect(entrar).toHaveTextContent("Entrar");
  expect(entrar.closest("div")?.className).not.toMatch(/(^|\s)hidden(\s|$)/);
  expect(entrar.className).not.toMatch(/(^|\s)hidden(\s|$)/);
  expect(screen.getByRole("link", { name: "Registrarse" }).className).toMatch(
    /max-sm:hidden/,
  );
});

// El buscador del encabezado es un atajo a /buscar; en móvil se despliega con
// una lupa (aria-expanded) y desde md es un campo fijo.
test("el encabezado ofrece un buscador y una lupa que lo despliega en móvil", () => {
  usarSesion.mockReturnValue({ estado: "anonimo" });
  render(<Encabezado />);

  expect(screen.getByRole("search", { name: "Buscar canciones" })).toBeInTheDocument();
  expect(screen.getByRole("searchbox", { name: "Buscar por título o artista" })).toBeInTheDocument();

  const lupa = screen.getByRole("button", { name: "Buscar" });
  expect(lupa).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(lupa);
  expect(lupa).toHaveAttribute("aria-expanded", "true");
});

test("enviar el buscador del encabezado lleva a /buscar con el término", () => {
  usarSesion.mockReturnValue({ estado: "anonimo" });
  render(<Encabezado />);

  fireEvent.change(screen.getByRole("searchbox"), { target: { value: " valle & mar " } });
  fireEvent.submit(screen.getByRole("search"));

  expect(empujar).toHaveBeenCalledWith("/buscar?q=valle%20%26%20mar");
});
