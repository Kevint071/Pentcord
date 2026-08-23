import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PantallaDeLogin } from "@/components/sesion/PantallaDeLogin";

const refrescar = vi.fn().mockResolvedValue(undefined);
const replace = vi.fn();
let volverA: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(volverA ? { volverA } : {}),
}));

vi.mock("@/lib/sesion/SesionProvider", () => ({
  useSesion: () => ({ refrescar }),
}));

function respuestaFalsa(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchSimulado: ReturnType<typeof vi.fn>;

beforeEach(() => {
  volverA = null;
  fetchSimulado = vi.fn();
  vi.stubGlobal("fetch", fetchSimulado);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("PantallaDeLogin", () => {
  test("abre en modo entrar, sin el campo de usuario", () => {
    render(<PantallaDeLogin />);

    expect(
      screen.getByRole("heading", { name: "Inicia sesión" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre de usuario")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  test("crear cuenta añade el campo de usuario y llama a /auth/register", async () => {
    const usuario = { id: 3, email: "ana@pentcord.dev", username: "ana" };
    fetchSimulado.mockResolvedValue(
      respuestaFalsa({ message: "ok", user: usuario }, 201),
    );

    const user = userEvent.setup();
    render(<PantallaDeLogin />);

    await user.click(screen.getByRole("radio", { name: "Crear cuenta" }));
    await user.type(screen.getByLabelText("Nombre de usuario"), "ana");
    await user.type(screen.getByLabelText("Correo"), usuario.email);
    await user.type(screen.getByLabelText("Contraseña"), "unaClave123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    const [url, opciones] = fetchSimulado.mock.calls[0];
    expect(url).toBe("/api/v1/auth/register");
    expect(JSON.parse(opciones.body)).toEqual({
      email: usuario.email,
      password: "unaClave123",
      username: "ana",
    });

    expect(refrescar).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/");
  });

  test("no llama a la API si faltan campos", async () => {
    const user = userEvent.setup();
    render(<PantallaDeLogin />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(fetchSimulado).not.toHaveBeenCalled();
    expect(screen.getByText("Escribe tu correo.")).toBeInTheDocument();
    expect(screen.getByText("Escribe tu contraseña.")).toBeInTheDocument();
  });

  test("credenciales inválidas muestran un aviso genérico y no autentican", async () => {
    fetchSimulado.mockResolvedValue(
      respuestaFalsa({ message: "Credenciales invalidas" }, 401),
    );

    const user = userEvent.setup();
    render(<PantallaDeLogin />);

    await user.type(screen.getByLabelText("Correo"), "ana@pentcord.dev");
    await user.type(screen.getByLabelText("Contraseña"), "mala");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credenciales invalidas",
    );
    expect(refrescar).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  test("vuelve al sitio guardado en volverA tras autenticarse", async () => {
    volverA = "/versiones/12?tono=D";
    fetchSimulado.mockResolvedValue(
      respuestaFalsa(
        { user: { id: 1, email: "a@a.com", username: "a" } },
        200,
      ),
    );

    const user = userEvent.setup();
    render(<PantallaDeLogin />);

    expect(screen.getByText("/versiones/12?tono=D")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Correo"), "a@a.com");
    await user.type(screen.getByLabelText("Contraseña"), "clave");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("/versiones/12?tono=D", { selector: "code" }))
      .toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/versiones/12?tono=D");
  });

  test("mostrar/ocultar contraseña cambia el tipo del campo", async () => {
    const user = userEvent.setup();
    render(<PantallaDeLogin />);

    const campo = screen.getByLabelText("Contraseña");
    expect(campo).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Mostrar" }));
    expect(campo).toHaveAttribute("type", "text");
  });
});
