import { Suspense } from "react";
import { Buscador } from "@/components/buscador/Buscador";
import {
  Contenedor,
  Encabezamiento,
  MarcoDeBusqueda,
  Muestra,
} from "@/components/buscador/piezas";

/**
 * D.1 · Inicio.
 *
 * El buscador lee el término y la página de la URL con `useSearchParams`, así
 * que va detrás de un límite de Suspense y no entra en el HTML estático. La
 * espera no es un "cargando": es la misma portada, sin el campo enfocable
 * todavía, así que quien entra ve la pantalla real desde el primer pintado y no
 * hay salto al hidratar.
 */
function PortadaEnEspera() {
  return (
    <Contenedor>
      <section className="pt-10 pb-8 sm:pt-16">
        <Encabezamiento />
        <div className="mt-7">
          <MarcoDeBusqueda>
            <span className="text-base text-tinta-tenue">Título o artista</span>
          </MarcoDeBusqueda>
        </div>
        <Muestra />
      </section>
    </Contenedor>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PortadaEnEspera />}>
      <Buscador />
    </Suspense>
  );
}
