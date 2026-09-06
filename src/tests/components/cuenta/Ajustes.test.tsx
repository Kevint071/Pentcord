import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Ajustes } from "@/components/cuenta/Ajustes";

const cerrarSesion = vi.fn();
const usarApi = vi.fn();
const usarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion/SesionProvider", () => ({ useSesion: usarSesion }));

function usuarioLocal() {
  return {
    id: 1,
    username: "ana",
    email: "ana@pentcord.dev",
    rol: "musico" as const,
    fotoPerfilUrl: null,
    tema: null,
    metodoAutenticacion: "local" as const,
  };
}

beforeEach(() => {
  cerrarSesion.mockReset();
  usarApi.mockReset();
  usarSesion.mockReturnValue({ usuario: usuarioLocal(), cerrarSesion, usarApi });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Ajustes", () => {
  test("cuenta local: muestra el formulario de cambiar contraseña", () => {
    render(<Ajustes />);

    expect(screen.getByLabelText("Contraseña actual")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña nueva")).toBeInTheDocument();
  });

  test("cuenta de Google: oculta el formulario y explica por qué", () => {
    usarSesion.mockReturnValue({
      usuario: { ...usuarioLocal(), metodoAutenticacion: "google" },
      cerrarSesion,
      usarApi,
    });
    render(<Ajustes />);

    expect(screen.queryByLabelText("Contraseña actual")).not.toBeInTheDocument();
    expect(screen.getByText(/usa Google/i)).toBeInTheDocument();
  });

  test("valida longitud mínima y confirmación en el cliente, sin llamar a la API", async () => {
    const user = userEvent.setup();
    render(<Ajustes />);

    await user.type(screen.getByLabelText("Contraseña actual"), "actual123");
    await user.type(screen.getByLabelText("Contraseña nueva"), "corta");
    await user.type(screen.getByLabelText("Confirmar contraseña nueva"), "otra");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(
      screen.getByText("La contraseña nueva debe tener al menos 8 caracteres."),
    ).toBeInTheDocument();
    expect(screen.getByText("Las contraseñas nuevas no coinciden.")).toBeInTheDocument();
    expect(usarApi).not.toHaveBeenCalled();
  });

  test("muestra el error de passwordActual inválida junto al campo", async () => {
    const { ErrorDeApi } = await import("@/lib/api/cliente");
    usarApi.mockRejectedValue(
      new ErrorDeApi(
        "VALIDATION_ERROR",
        "La contraseña actual no es correcta.",
        400,
        { campo: "passwordActual" },
      ),
    );

    const user = userEvent.setup();
    render(<Ajustes />);

    await user.type(screen.getByLabelText("Contraseña actual"), "mala");
    await user.type(screen.getByLabelText("Contraseña nueva"), "unaClave123");
    await user.type(screen.getByLabelText("Confirmar contraseña nueva"), "unaClave123");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(
      await screen.findByText("La contraseña actual no es correcta."),
    ).toBeInTheDocument();
  });

  test("éxito limpia el formulario y avisa", async () => {
    usarApi.mockResolvedValue({ message: "Contraseña actualizada" });
    const user = userEvent.setup();
    render(<Ajustes />);

    await user.type(screen.getByLabelText("Contraseña actual"), "actual123");
    await user.type(screen.getByLabelText("Contraseña nueva"), "unaClave123");
    await user.type(screen.getByLabelText("Confirmar contraseña nueva"), "unaClave123");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(await screen.findByText("Contraseña actualizada.")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña actual")).toHaveValue("");
  });

  test("cerrar sesión llama a cerrarSesion()", async () => {
    const user = userEvent.setup();
    render(<Ajustes />);

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(cerrarSesion).toHaveBeenCalled();
  });
});
