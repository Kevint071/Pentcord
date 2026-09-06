import { Suspense } from "react";
import { Buscador } from "@/components/buscador/Buscador";
import { Portada, MarcoDeBusqueda } from "@/components/buscador/piezas";

/**
 * D.1 · Inicio.
 *
 * El buscador lee el término y la página de la URL con `useSearchParams`, así
 * que va detrás de un límite de Suspense. La espera no es un "cargando": es
 * la misma portada, sin el campo enfocable todavía, así que quien entra ve la
 * pantalla real desde el primer pintado y no hay salto al hidratar.
 */
function PortadaEnEspera() {
  return (
    <Portada>
      <MarcoDeBusqueda>
        <span className="text-lg text-tinta-tenue">Título o artista</span>
      </MarcoDeBusqueda>
    </Portada>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PortadaEnEspera />}>
      <Buscador />
    </Suspense>
  );
}
