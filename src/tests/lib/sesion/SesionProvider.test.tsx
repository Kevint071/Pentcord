import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SesionProvider, useSesion } from "@/lib/sesion/SesionProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function respuestaFalsa(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function Sonda() {
  const { estado } = useSesion();
  return <span>{estado}</span>;
}

let fetchSimulado: ReturnType<typeof vi.fn>;

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  fetchSimulado = vi.fn();
  vi.stubGlobal("fetch", fetchSimulado);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("SesionProvider · tema de cuenta", () => {
  test("aplica el tema de la cuenta si difiere del local al resolver /auth/me", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    fetchSimulado.mockResolvedValue(
      respuestaFalsa({
        id: 1,
        username: "ana",
        email: "a@a.com",
        rol: "musico",
        fotoPerfilUrl: null,
        tema: "dark",
        metodoAutenticacion: "local",
      }),
    );

    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );

    await screen.findByText("autenticado");
    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark"),
    );
  });

  test("no toca el tema si la cuenta no tiene preferencia guardada", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    fetchSimulado.mockResolvedValue(
      respuestaFalsa({
        id: 1,
        username: "ana",
        email: "a@a.com",
        rol: "musico",
        fotoPerfilUrl: null,
        tema: null,
        metodoAutenticacion: "local",
      }),
    );

    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );

    await screen.findByText("autenticado");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
