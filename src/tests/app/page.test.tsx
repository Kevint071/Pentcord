import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

const redirigir = vi.fn();

// La demo del inicio es un componente de cliente; el inicio en sí es de
// servidor y puede redirigir, así que hace falta `redirect` además del
// enrutador.
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => redirigir(destino),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

function inicio(parametros: Record<string, string> = {}) {
  return Home({ searchParams: Promise.resolve(parametros) } as never);
}

beforeEach(() => {
  redirigir.mockClear();
});

// Desde el 2026-09-11 el inicio no busca: el buscador se mudó a `/buscar`.
test("el inicio se presenta con su título", async () => {
  render(await inicio());

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Canciones con acordes, en el tono que tú tocas.",
    }),
  ).toBeInTheDocument();
});

test("el inicio ya no lleva el buscador dentro", async () => {
  render(await inicio());

  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
});

// Buscar y aportar viven en la barra de navegación; la portada no los repite.
// El único enlace es la palabra «Canciones» del título, que lleva al buscador.
test("el inicio no lleva botones de buscar ni de aportar, solo el enlace del título", async () => {
  render(await inicio());

  const enlaces = screen.getAllByRole("link");
  expect(enlaces).toHaveLength(1);
  expect(enlaces[0]).toHaveTextContent("Canciones");
  expect(enlaces[0]).toHaveAttribute("href", "/buscar");
});

// Bajo la cabecera van las otras dos cosas que hace PentCord. Las demos son
// decorativas y usan el dominio real; aquí se comprueba que el texto que las
// explica está y que, sin `IntersectionObserver` (jsdom), quedan en su estado
// final legible en vez de vacías.
test("el inicio explica cómo se escribe y cómo se lee", async () => {
  render(await inicio());

  expect(
    screen.getByRole("heading", { level: 2, name: "Escribe el acorde donde cae" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { level: 2, name: "Notas o grados, como prefieras" }),
  ).toBeInTheDocument();
});

test("las demos del inicio arrancan completas, no vacías", async () => {
  render(await inicio());

  // La demo de escritura muestra el ChordPro entero y su vista previa renderizada.
  expect(screen.getAllByText("Am").length).toBeGreaterThan(0);
  expect(screen.getAllByText(/\[Am\]/).length).toBeGreaterThan(0);
});

// Las búsquedas de antes del cambio se compartían como `/?q=…`. Reenviarlas
// evita que un enlace que alguien pasó por WhatsApp caiga en una portada sin
// resultados.
test("una búsqueda antigua sobre / se reenvía a /buscar sin perder el término", async () => {
  await inicio({ q: "valle", autor: "Silvio" });

  expect(redirigir).toHaveBeenCalledWith("/buscar?q=valle&autor=Silvio");
});

test("el inicio no redirige cuando no hay búsqueda en la URL", async () => {
  await inicio();

  expect(redirigir).not.toHaveBeenCalled();
});
