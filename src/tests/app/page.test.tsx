import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

// El buscador lee el término de la URL y navega al escribir, así que necesita
// el enrutador montado.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// El catálogo de la portada sale de `GET /canciones`; se sustituye solo la
// llamada a la red.
const pedirApiMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/cliente", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api/cliente")>();
  return { ...original, pedirApi: pedirApiMock };
});

beforeEach(() => {
  pedirApiMock.mockReset();
  pedirApiMock.mockResolvedValue({
    data: [
      { id: 7, titulo: "Ojalá", artista: "Silvio Rodríguez" },
      { id: 8, titulo: "Zamba de mi esperanza", artista: "Luis Profili" },
    ],
    pagination: { total: 2, page: 1, limit: 5, totalPages: 1 },
    autoresSugeridos: ["Luis Profili", "Silvio Rodríguez"],
  });
});

// La portada abre con el buscador: nada de titular de marketing ni de demo
// delante. Lo que se añadió el 2026-09-05 va debajo, no encima.
test("la portada abre con el buscador, sin nada delante", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "Busca una canción" }),
  ).toBeInTheDocument();
});

test("el buscador está disponible sin necesidad de sesión", () => {
  render(<Home />);

  expect(
    screen.getByRole("searchbox", { name: "Buscar por título o artista" }),
  ).toBeInTheDocument();
});

test("debajo del buscador se ofrecen canciones del catálogo", async () => {
  render(<Home />);

  expect(
    await screen.findByRole("link", { name: /Ojalá/ }),
  ).toHaveAttribute("href", "/canciones/7");
  expect(
    screen.getByRole("link", { name: "Silvio Rodríguez" }),
  ).toHaveAttribute("href", "/?autor=Silvio%20Rodr%C3%ADguez");
});

// La demo no es una animación: usa el dominio real, así que cambiar de tono
// tiene que reescribir los acordes de verdad.
test("la demo de la portada transporta con el motor real", async () => {
  const usuario = userEvent.setup();
  render(<Home />);

  expect(screen.getByText("Am")).toBeInTheDocument();

  await usuario.click(screen.getByRole("radio", { name: "D" }));

  expect(screen.getByText("Bm")).toBeInTheDocument();
  expect(screen.queryByText("Am")).not.toBeInTheDocument();
  expect(screen.getByText("+2 semitonos")).toBeInTheDocument();
});

test("la portada ofrece aportar una canción que falte", () => {
  render(<Home />);

  expect(
    screen.getByRole("link", { name: "Aportar una canción" }),
  ).toHaveAttribute("href", "/aportar");
});

// El catálogo depende de la red; el buscador no. Si la llamada falla, la
// sección desaparece y la portada se sigue pudiendo usar.
test("si el catálogo falla, el buscador sigue en pie", async () => {
  pedirApiMock.mockRejectedValue(new Error("sin red"));
  render(<Home />);

  expect(
    await screen.findByRole("searchbox", { name: "Buscar por título o artista" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Abre una canción" }),
  ).not.toBeInTheDocument();
});
