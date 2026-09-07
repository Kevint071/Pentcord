import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SesionProvider, useSesion } from "@/lib/sesion/SesionProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
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

function SondaConCerrarSesion() {
  const { estado, cerrarSesion } = useSesion();
  return (
    <>
      <span>{estado}</span>
      <button onClick={() => void cerrarSesion()}>cerrar sesión</button>
    </>
  );
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

describe("SesionProvider · cerrarSesion", () => {
  test("llama a DELETE /auth/logout para borrar la cookie httpOnly del servidor", async () => {
    fetchSimulado.mockImplementation((url: string) => {
      if (url === "/api/v1/auth/logout") {
        return Promise.resolve(respuestaFalsa({ message: "ok" }));
      }
      return Promise.resolve(respuestaFalsa({}, 401));
    });

    render(
      <SesionProvider>
        <SondaConCerrarSesion />
      </SesionProvider>,
    );

    await screen.findByText("anonimo");
    (await screen.findByRole("button")).click();

    await waitFor(() => {
      const llamadaALogout = fetchSimulado.mock.calls.find(
        ([url]) => url === "/api/v1/auth/logout",
      );
      expect(llamadaALogout).toBeDefined();
      expect(llamadaALogout?.[1]).toMatchObject({ method: "DELETE" });
    });
  });

  test("limpia el estado local aunque DELETE /auth/logout falle", async () => {
    fetchSimulado.mockImplementation((url: string) => {
      if (url === "/api/v1/auth/logout") {
        return Promise.reject(new Error("red caída"));
      }
      return Promise.resolve(
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
    });

    render(
      <SesionProvider>
        <SondaConCerrarSesion />
      </SesionProvider>,
    );

    await screen.findByText("autenticado");
    screen.getByRole("button").click();

    await screen.findByText("anonimo");
  });

  test("una pestaña que cierra sesión avisa a las demás por BroadcastChannel", async () => {
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

    // "Otra pestaña": otra instancia del provider suscrita al mismo canal.
    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );
    await screen.findByText("autenticado");

    const canalDeOtraPestana = new BroadcastChannel("pentcord:sesion");
    canalDeOtraPestana.postMessage("cerrada");
    canalDeOtraPestana.close();

    await screen.findByText("anonimo");
  });
});
