import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

// El buscador lee el término de la URL y navega al escribir, así que necesita
// el enrutador montado.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

test("la portada abre con el trabajo que resuelve la app", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: /cámbiala de tono/i }),
  ).toBeInTheDocument();
});

test("el buscador está disponible sin necesidad de sesión", () => {
  render(<Home />);

  expect(
    screen.getByRole("searchbox", { name: "Buscar por título o artista" }),
  ).toBeInTheDocument();
});

// Sin búsqueda todavía no hay resultados: se enseña una línea real de cifrado
// en vez de un espacio en blanco.
test("sin búsqueda muestra el espécimen de letra con acordes", () => {
  const { container } = render(<Home />);

  const letra = Array.from(container.querySelectorAll(".cifrado-letra"))
    .map((nodo) => nodo.textContent)
    .join("");

  expect(letra).toBe("Cuando salga el sol sobre el valle");
  expect(container.querySelectorAll(".cifrado-acorde")).toHaveLength(3);
});
