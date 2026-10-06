import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Buscar from "@/app/buscar/page";

const reemplazar = vi.hoisted(() => vi.fn());
const pedirApiMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: reemplazar, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/buscar",
}));

// Solo se sustituye la llamada a la red: los mensajes de error siguen siendo
// los de verdad.
vi.mock("@/lib/api/cliente", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api/cliente")>();
  return { ...original, pedirApi: pedirApiMock };
});

function respuesta(canciones: { id: number; titulo: string; artista: string }[]) {
  return {
    data: canciones,
    pagination: {
      total: canciones.length,
      page: 1,
      limit: 9,
      totalPages: 1,
    },
  };
}

beforeEach(() => {
  reemplazar.mockClear();
  pedirApiMock.mockReset();
  pedirApiMock.mockResolvedValue(respuesta([]));
});

test("la pantalla de buscar abre con el campo, sin nada delante", () => {
  render(<Buscar />);

  expect(
    screen.getByRole("heading", { level: 1, name: "Busca una canción" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("searchbox", { name: "Buscar por título o artista" }),
  ).toBeInTheDocument();
});

// La demo y las llamadas a aportar se quedaron en el inicio: aquí abajo solo
// van las canciones.
test("la pantalla de buscar no arrastra la portada del inicio", () => {
  render(<Buscar />);

  expect(screen.queryByText("Prueba el transporte")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Aportar" }),
  ).not.toBeInTheDocument();
});

// Sin término no hay estado vacío: buscar sin escribir nada es hojear el
// catálogo entero, que es lo que se espera de un buscador.
test("sin término, la pantalla lista el catálogo entero", async () => {
  pedirApiMock.mockResolvedValue(
    respuesta([
      { id: 1, titulo: "Al alba", artista: "Aute" },
      { id: 2, titulo: "Zamba", artista: "Falú" },
    ]),
  );

  render(<Buscar />);

  expect(await screen.findByText("Al alba")).toBeInTheDocument();
  expect(screen.getByText("Zamba")).toBeInTheDocument();
  expect(screen.getByText(/Todo el catálogo/)).toBeInTheDocument();
});

test("el catálogo se pide sin filtro de título", () => {
  render(<Buscar />);

  expect(pedirApiMock).toHaveBeenCalledWith(
    "/canciones",
    expect.objectContaining({
      parametros: expect.objectContaining({ titulo: undefined }),
    }),
  );
});

// El término vive en la URL para que atrás y compartir funcionen. Tras la
// mudanza esa URL es `/buscar`, no `/`.
test("el término buscado se escribe en la URL de /buscar", async () => {
  const usuario = userEvent.setup();
  render(<Buscar />);

  await usuario.type(
    screen.getByRole("searchbox", { name: "Buscar por título o artista" }),
    "valle{Enter}",
  );

  expect(reemplazar).toHaveBeenCalledWith("/buscar?q=valle", {
    scroll: false,
  });
});
