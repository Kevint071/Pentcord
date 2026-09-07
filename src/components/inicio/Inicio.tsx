import { Contenedor } from "@/components/buscador/piezas";
import { BotonEnlace } from "@/components/ui/Boton";
import { DemoDeTransporte } from "./DemoDeTransporte";

/**
 * Portada · lo que va **debajo** del buscador cuando todavía no se ha buscado
 * nada. En cuanto hay búsqueda desaparece: los resultados ocupan ese sitio.
 *
 * El orden responde a lo que le pasa a quien acaba de entrar: primero la
 * prueba de lo único que PentCord hace distinto (transportar), y al final la
 * puerta de entrada para quien no encontró la suya. Nada de esto explica la
 * app antes de dejar usarla: el campo de búsqueda sigue siendo lo primero de
 * la página.
 *
 * Las dos franjas se separan con una línea fina, como las pautas de una hoja,
 * en vez de con tarjetas: la única caja de la página es la del cifrado, que sí
 * representa un papel.
 */
export function Inicio() {
  return (
    <Contenedor>
      <section className="pt-8 pb-10 sm:pt-10">
        <h2 className="rotulo text-2xl text-tinta">Prueba el transporte</h2>
        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-tinta-suave">
          Toca un tono y los acordes se reescriben al momento, con la ortografía
          de esa tonalidad. Es el mismo motor que abre cualquier canción: sin
          recargar, sin red y sin cuenta.
        </p>
        <div className="mt-5">
          <DemoDeTransporte />
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-pauta py-10">
        <div>
          <h2 className="rotulo text-2xl text-tinta">
            ¿Falta la canción que tocas?
          </h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-tinta-suave">
            Escríbela una vez, con los acordes entre corchetes encima de cada
            sílaba, y queda para todos. Necesitas una cuenta.
          </p>
        </div>
        <BotonEnlace href="/aportar" variante="secundario">
          Aportar una canción
        </BotonEnlace>
      </section>
    </Contenedor>
  );
}
