import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BotonDeFavorito } from "@/components/favoritos/BotonDeFavorito";

const push = vi.fn();
let usuario: { id: number } | null = null;
let usarApi: ReturnType<typeof vi.fn>;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/sesion/SesionProvider", () => ({
  useSesion: () => ({ usuario, usarApi }),
}));

afterEach(() => {
  vi.clearAllMocks();
  usuario = null;
});

describe("BotonDeFavorito", () => {
  test("sin sesión, lleva al login conservando la página actual", async () => {
    usuario = null;
    usarApi = vi.fn();
    window.history.pushState({}, "", "/versiones/12");

    const user = userEvent.setup();
    render(<BotonDeFavorito versionId={12} />);

    await user.click(screen.getByRole("button", { name: "Guardar en favoritos" }));

    expect(usarApi).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/login?volverA=%2Fversiones%2F12");
  });

  test("con sesión, marca como favorito al instante (optimista) y llama a POST", async () => {
    usuario = { id: 1 };
    usarApi = vi
      .fn()
      .mockResolvedValueOnce([]) // GET /favoritos al montar: todavía no es favorito
      .mockResolvedValueOnce({ message: "ok" }); // POST /favoritos

    const user = userEvent.setup();
    render(<BotonDeFavorito versionId={12} />);

    const boton = await screen.findByRole("button", { name: "Guardar en favoritos" });
    await user.click(boton);

    expect(await screen.findByRole("button", { name: "En tus favoritos" })).toBeInTheDocument();
    expect(usarApi).toHaveBeenLastCalledWith("/favoritos", {
      method: "POST",
      cuerpo: { versionId: 12 },
    });
  });

  test("si el POST falla, revierte el cambio optimista y muestra el error", async () => {
    usuario = { id: 1 };
    usarApi = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("No se pudo completar la operación."));

    const user = userEvent.setup();
    render(<BotonDeFavorito versionId={12} />);

    const boton = await screen.findByRole("button", { name: "Guardar en favoritos" });
    await user.click(boton);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Guardar en favoritos" })).toBeInTheDocument(),
    );
    expect(screen.getByText("No se pudo completar la operación.")).toBeInTheDocument();
  });
});
