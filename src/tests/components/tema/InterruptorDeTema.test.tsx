import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterruptorDeTema } from "@/components/tema/InterruptorDeTema";

const pedirApi = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/api/cliente", () => ({ pedirApi: (...args: unknown[]) => pedirApi(...args) }));

const usarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion/SesionProvider", () => ({ useSesion: usarSesion }));

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

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  pedirApi.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("InterruptorDeTema", () => {
  test("con sesión, alternar guarda el tema en la cuenta", async () => {
    usarSesion.mockReturnValue({ estado: "autenticado" });
    const user = userEvent.setup();
    render(<InterruptorDeTema />);

    await user.click(screen.getByRole("button"));

    expect(pedirApi).toHaveBeenCalledWith("/usuarios/me/tema", {
      method: "PATCH",
      cuerpo: { tema: "dark" },
    });
  });

  test("sin sesión, alternar no llama a la API", async () => {
    usarSesion.mockReturnValue({ estado: "anonimo" });
    const user = userEvent.setup();
    render(<InterruptorDeTema />);

    await user.click(screen.getByRole("button"));

    expect(pedirApi).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  test("un fallo al guardar (incluida una sesión expirada) no rompe el cambio local", async () => {
    pedirApi.mockRejectedValueOnce(new Error("red caída"));
    usarSesion.mockReturnValue({ estado: "autenticado" });
    const user = userEvent.setup();
    render(<InterruptorDeTema />);

    await user.click(screen.getByRole("button"));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
