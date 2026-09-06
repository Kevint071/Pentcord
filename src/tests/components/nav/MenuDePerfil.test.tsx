import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuDePerfil } from "@/components/nav/MenuDePerfil";

let ruta = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => ruta,
}));

const usarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion/SesionProvider", () => ({ useSesion: usarSesion }));

beforeEach(() => {
  ruta = "/";
  usarSesion.mockReturnValue({
    usuario: { id: 3, username: "ana", fotoPerfilUrl: null },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("MenuDePerfil", () => {
  test("cerrado por defecto; abre al hacer click en el disparador", async () => {
    const user = userEvent.setup();
    render(<MenuDePerfil />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  test("los cuatro ítems apuntan a las rutas correctas", async () => {
    const user = userEvent.setup();
    render(<MenuDePerfil />);
    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));

    expect(screen.getByRole("menuitem", { name: "Favoritos" })).toHaveAttribute(
      "href",
      "/favoritos",
    );
    expect(screen.getByRole("menuitem", { name: "Perfil" })).toHaveAttribute(
      "href",
      "/perfil",
    );
    expect(screen.getByRole("menuitem", { name: "Ajustes" })).toHaveAttribute(
      "href",
      "/cuenta",
    );
    expect(screen.getByRole("menuitem", { name: "Preferencias" })).toHaveAttribute(
      "href",
      "/preferencias",
    );
  });

  test("cierra al hacer click fuera", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <MenuDePerfil />
        <button type="button">fuera</button>
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "fuera" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  test("cierra con Escape y devuelve el foco al disparador", async () => {
    const user = userEvent.setup();
    render(<MenuDePerfil />);
    const disparador = screen.getByRole("button", { name: "Menú de perfil" });
    await user.click(disparador);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(disparador).toHaveFocus();
  });

  test("el foco inicial va al primer ítem al abrir", async () => {
    const user = userEvent.setup();
    render(<MenuDePerfil />);
    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));

    expect(screen.getByRole("menuitem", { name: "Favoritos" })).toHaveFocus();
  });

  test("cierra al navegar", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MenuDePerfil />);
    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    ruta = "/perfil";
    rerender(<MenuDePerfil />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  test("sin usuario, no se muestra nada", () => {
    usarSesion.mockReturnValue({ usuario: null });
    const { container } = render(<MenuDePerfil />);
    expect(container).toBeEmptyDOMElement();
  });
});
