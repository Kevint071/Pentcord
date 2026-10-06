import type { Metadata } from "next";
import { Suspense } from "react";
import { Buscador } from "@/components/buscador/Buscador";
import { Portada, MarcoDeBusqueda } from "@/components/buscador/piezas";

export const metadata: Metadata = { title: "Buscar" };

/**
 * D.1 · Buscar (HU-02). Mudada aquí desde `/` el 2026-09-11, para que el
 * inicio pueda ser la elección entre buscar y aportar.
 *
 * El buscador lee el término y la página de la URL con `useSearchParams`, así
 * que va detrás de un límite de Suspense. La espera no es un "cargando": es la
 * misma pantalla, sin el campo enfocable todavía, así que quien entra ve la
 * pantalla real desde el primer pintado y no hay salto al hidratar.
 */
function PortadaEnEspera() {
  return (
    <Portada titulo="Busca una canción">
      <MarcoDeBusqueda>
        <span className="text-lg text-tinta-tenue">Título o artista</span>
      </MarcoDeBusqueda>
    </Portada>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PortadaEnEspera />}>
      <Buscador />
    </Suspense>
  );
}
