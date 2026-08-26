import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Visor } from "@/components/visor/Visor";

const { pedirApiMock } = vi.hoisted(() => ({ pedirApiMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/sesion/SesionProvider", () => ({
  useSesion: () => ({ usuario: null, usarApi: vi.fn().mockResolvedValue([]) }),
}));

// Solo se sustituye la llamada a la red: el catálogo de errores, los mensajes
// y sobre todo el dominio musical (parsearChordPro/renderizar) siguen siendo
// los de verdad — es justo lo que D.3 dejó de simular.
vi.mock("@/lib/api/cliente", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api/cliente")>();
  return { ...original, pedirApi: pedirApiMock };
});

function versionDeEjemplo(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    data: {
      id: 12,
      autorId: 1,
      estado: "verificada",
      tonoOriginal: "C",
      contenidoChordpro: "{verso}\n[C]Cuando salga el [G]sol",
      cancion: { id: 5, titulo: "Cuando salga el sol", artista: "Ejemplo" },
      ...overrides,
    },
  };
}

function acordes(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".cifrado-acorde")).map(
    (nodo) => nodo.textContent,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("Visor", () => {
  test("mientras carga, no muestra datos de ejemplo", () => {
    pedirApiMock.mockReturnValue(new Promise(() => {}));

    render(<Visor versionId="12" />);

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(screen.queryByText("Cuando salga el sol")).not.toBeInTheDocument();
  });

  test("pinta la versión real con la ortografía correcta de su tonalidad", async () => {
    // En Eb, [C#] y [G#] se escriben Db y Ab: justo el error que cometía la
    // maqueta, que solo sabía escribir con sostenidos.
    pedirApiMock.mockResolvedValue(
      versionDeEjemplo({
        tonoOriginal: "Eb",
        contenidoChordpro: "[C#]Cuando salga el [G#]sol",
      }),
    );

    const { container } = render(<Visor versionId="12" />);

    expect(await screen.findByText("Cuando salga el sol")).toBeInTheDocument();
    expect(screen.getByText(/Ejemplo · tono original Eb/)).toBeInTheDocument();
    expect(acordes(container)).toEqual(["Db", "Ab"]);
    expect(pedirApiMock).toHaveBeenCalledWith("/versiones/12");
  });

  test("transportar en el selector recalcula el cifrado sin volver a pedir la versión", async () => {
    pedirApiMock.mockResolvedValue(versionDeEjemplo());
    const user = userEvent.setup();

    const { container } = render(<Visor versionId="12" />);
    await screen.findByText("Cuando salga el sol");
    expect(acordes(container)).toEqual(["C", "G"]);

    await user.click(screen.getByRole("radio", { name: "G" }));

    expect(acordes(container)).toEqual(["G", "D"]);
    expect(pedirApiMock).toHaveBeenCalledTimes(1);
  });

  test("el conmutador de grados es relativo al tono activo en pantalla, no al original", async () => {
    pedirApiMock.mockResolvedValue(versionDeEjemplo());
    const user = userEvent.setup();

    const { container } = render(<Visor versionId="12" />);
    await screen.findByText("Cuando salga el sol");

    // Se transporta a G antes de mirar los grados: si el conversor siguiera
    // relativo al tono original (C), G y D saldrían como "5" y "2", no "1" y
    // "5".
    await user.click(screen.getByRole("radio", { name: "G" }));
    await user.click(screen.getByRole("radio", { name: "Grados" }));

    expect(acordes(container)).toEqual(["1", "5"]);
  });

  test("un acorde fuera de los tipos soportados se marca sin romper el resto", async () => {
    pedirApiMock.mockResolvedValue(
      versionDeEjemplo({ contenidoChordpro: "[Cadd9]Hola [G]mundo" }),
    );

    const { container } = render(<Visor versionId="12" />);
    await screen.findByText("Cuando salga el sol");

    expect(
      screen.getByText(
        "Un acorde no está entre los tipos que PentCord reconoce. Se muestran tal y como los escribió quien aportó la versión, y no cambian al transportar.",
      ),
    ).toBeInTheDocument();
    expect(acordes(container)).toEqual(["Cadd9", "G"]);
  });

  test("una versión que no existe (o no es visible) lleva al estado vacío, no a un error", async () => {
    const { ErrorDeApi } = await import("@/lib/api/cliente");
    pedirApiMock.mockRejectedValue(
      new ErrorDeApi("NOT_FOUND", "La versión no ha sido encontrada", 404),
    );

    render(<Visor versionId="999" />);

    expect(await screen.findByText("Esta versión no está")).toBeInTheDocument();
  });

  test('un fallo del servidor muestra el aviso, no la pantalla de "no existe"', async () => {
    pedirApiMock.mockRejectedValue(new Error("boom"));

    render(<Visor versionId="12" />);

    expect(
      await screen.findByText("No se pudo completar la operación."),
    ).toBeInTheDocument();
  });
});
