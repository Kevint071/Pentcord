import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preferencias } from "@/components/preferencias/Preferencias";

// `Preferencias` renderiza `InterruptorDeTema`, que desde la Task 5 llama a
// `useSesion()` para decidir si guarda el tema en la cuenta al alternarlo.
vi.mock("@/lib/sesion/SesionProvider", () => ({
  useSesion: () => ({ estado: "autenticado", usarApi: vi.fn().mockResolvedValue(undefined) }),
}));

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
  document.documentElement.setAttribute("data-theme", "light");
});

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
});

describe("Preferencias", () => {
  test("muestra el título y el estado actual del tema", () => {
    render(<Preferencias />);

    expect(screen.getByRole("heading", { name: "Preferencias" })).toBeInTheDocument();
    expect(screen.getByText("Claro")).toBeInTheDocument();
  });

  test("alternar el interruptor actualiza la etiqueta de estado", async () => {
    const user = userEvent.setup();
    render(<Preferencias />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Oscuro")).toBeInTheDocument();
  });
});
