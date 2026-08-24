import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Aportar } from "@/components/aportar/Aportar";

const { pedirApiMock } = vi.hoisted(() => ({ pedirApiMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/sesion/SesionProvider", () => ({
  useSesion: () => ({ expirarSesion: vi.fn() }),
}));

// Solo se sustituye la llamada a la red: el catálogo de errores y los mensajes
// siguen siendo los de verdad.
vi.mock("@/lib/api/cliente", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api/cliente")>();
  return { ...original, pedirApi: pedirApiMock };
});

/** El textarea lleva corchetes y llaves, que `user.type` interpreta como teclas. */
function escribirCancion(texto: string) {
  fireEvent.change(screen.getByLabelText("Letra con acordes"), {
    target: { value: texto },
  });
}

function rellenarDatos(titulo: string, artista: string) {
  fireEvent.change(screen.getByLabelText("Título"), {
    target: { value: titulo },
  });
  fireEvent.change(screen.getByLabelText("Artista"), {
    target: { value: artista },
  });
}

function botonDeGuardar() {
  return screen.getByRole("button", { name: /guardar el aporte/i });
}

function acordes(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".cifrado-acorde")).map(
    (nodo) => nodo.textContent,
  );
}

beforeEach(() => {
  // Por defecto no hay ninguna canción parecida (RN-010).
  pedirApiMock.mockResolvedValue({ data: [] });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Aportar · canción nueva", () => {
  test("RN-011 · la vista previa pinta los acordes encima de la letra mientras se escribe", () => {
    const { container } = render(<Aportar cancionId={null} />);

    escribirCancion("[C]Cuando salga el [G]sol");

    expect(acordes(container)).toEqual(["C", "G"]);
    expect(
      Array.from(container.querySelectorAll(".cifrado-letra"))
        .map((nodo) => nodo.textContent)
        .join(""),
    ).toContain("Cuando salga el sol");
  });

  test("el tono elegido manda en la ortografía de la vista previa", async () => {
    const user = userEvent.setup();
    const { container } = render(<Aportar cancionId={null} />);

    escribirCancion("[C#]Hola");
    expect(acordes(container)).toEqual(["C#"]);

    await user.click(screen.getByRole("radio", { name: "E bemol" }));

    // En Eb la misma clase de pitch se escribe con bemol, no con sostenido.
    expect(acordes(container)).toEqual(["Db"]);
  });

  test("RN-013 · un corchete sin cerrar señala línea y columna y bloquea el guardado", () => {
    const { container } = render(<Aportar cancionId={null} />);

    rellenarDatos("Cuando salga el sol", "Aksel");
    escribirCancion("[C]Hola\n[G Adiós");

    expect(botonDeGuardar()).toBeDisabled();

    const panel = screen.getByRole("button", {
      name: /falta el corchete de cierre/i,
    });
    expect(within(panel).getByText("2:1")).toBeInTheDocument();

    // La vista previa no se rompe ni se congela: la línea sigue ahí, marcada.
    expect(acordes(container)).toContain("C");
    expect(container.querySelector("[data-linea-error]")).not.toBeNull();
  });

  test("RN-013 · al pulsar el error el cursor va al punto exacto del textarea", async () => {
    const user = userEvent.setup();
    render(<Aportar cancionId={null} />);

    escribirCancion("[C]Hola\n[G Adiós");
    await user.click(
      screen.getByRole("button", { name: /falta el corchete de cierre/i }),
    );

    const area = screen.getByLabelText<HTMLTextAreaElement>(
      "Letra con acordes",
    );
    expect(area).toHaveFocus();
    // Línea 2, columna 1 → justo después del salto de línea.
    expect(area.selectionStart).toBe("[C]Hola\n".length);
  });

  test("RN-005 · un acorde que PentCord no sabe transportar avisa, pero deja guardar", async () => {
    render(<Aportar cancionId={null} />);

    rellenarDatos("Cuando salga el sol", "Aksel");
    escribirCancion("[Cadd9]Hola");

    expect(
      screen.getByText(/no sabe transportar/i),
    ).toBeInTheDocument();
    await waitFor(() => expect(botonDeGuardar()).toBeEnabled());
  });

  test("sin contenido no se puede guardar", () => {
    render(<Aportar cancionId={null} />);

    rellenarDatos("Cuando salga el sol", "Aksel");

    expect(botonDeGuardar()).toBeDisabled();
    expect(
      screen.getByText("Escribe la canción para poder guardarla."),
    ).toBeInTheDocument();
  });

  test("guarda la canción y confirma que queda pendiente de revisión", async () => {
    const user = userEvent.setup();
    pedirApiMock.mockImplementation((ruta: string, opciones?: unknown) => {
      if (ruta === "/canciones" && opciones !== undefined) {
        const metodo = (opciones as { method?: string }).method;
        if (metodo === "POST") {
          return Promise.resolve({
            id: 7,
            titulo: "Cuando salga el sol",
            artista: "Aksel",
            version: { id: 42, estado: "pendiente" },
          });
        }
      }
      return Promise.resolve({ data: [] });
    });

    render(<Aportar cancionId={null} />);
    rellenarDatos("Cuando salga el sol", "Aksel");
    escribirCancion("[C]Cuando salga el [G]sol");

    await waitFor(() => expect(botonDeGuardar()).toBeEnabled());
    await user.click(botonDeGuardar());

    expect(await screen.findByText("Pendiente de revisión")).toBeInTheDocument();
    expect(pedirApiMock).toHaveBeenCalledWith("/canciones", {
      method: "POST",
      cuerpo: {
        titulo: "Cuando salga el sol",
        artista: "Aksel",
        contenido_chordpro: "[C]Cuando salga el [G]sol",
        tono_original: "C",
      },
    });
    expect(screen.getByRole("link", { name: "Ver la versión" })).toHaveAttribute(
      "href",
      "/versiones/42",
    );
  });

  test("RN-010 · avisa del posible duplicado y deja aportar la versión ahí sin perder lo escrito", async () => {
    const user = userEvent.setup();
    pedirApiMock.mockResolvedValue({
      data: [{ id: 7, titulo: "Cuando salga el sol", artista: "Aksel" }],
    });

    render(<Aportar cancionId={null} />);
    escribirCancion("[C]Cuando salga el [G]sol");
    rellenarDatos("cuando salga el sol", "Aksel");

    const aviso = await screen.findByText("Esta canción ya está en el catálogo");
    expect(aviso).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Aportar mi versión aquí" }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /aportar una versión/i }),
    ).toBeInTheDocument();
    // Lo escrito sigue donde estaba: cambiar de destino no navega.
    expect(screen.getByLabelText("Letra con acordes")).toHaveValue(
      "[C]Cuando salga el [G]sol",
    );
  });
});

describe("Aportar · versión de una canción que ya existe", () => {
  test("nombra la canción, no pide título ni artista y guarda en su endpoint", async () => {
    const user = userEvent.setup();
    pedirApiMock.mockImplementation((ruta: string, opciones?: unknown) => {
      if (ruta === "/canciones/7" && opciones === undefined) {
        return Promise.resolve({
          data: { id: 7, titulo: "Cuando salga el sol", artista: "Aksel" },
        });
      }
      return Promise.resolve({ data: { id: 42, estado: "pendiente" } });
    });

    render(<Aportar cancionId={7} />);

    expect(
      await screen.findByText(/Cuando salga el sol · Aksel/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Título")).not.toBeInTheDocument();

    escribirCancion("[A]Otra versión");
    await user.click(botonDeGuardar());

    await waitFor(() =>
      expect(pedirApiMock).toHaveBeenCalledWith("/canciones/7/versiones", {
        method: "POST",
        cuerpo: {
          contenido_chordpro: "[A]Otra versión",
          tono_original: "C",
        },
      }),
    );
    expect(await screen.findByText("Pendiente de revisión")).toBeInTheDocument();
  });
});
