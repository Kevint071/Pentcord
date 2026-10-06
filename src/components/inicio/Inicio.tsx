import { Funciones } from "./Funciones";
import { HeroInicio } from "./HeroInicio";

/**
 * Inicio (`/`) · la portada del cancionero. Hasta el 2026-09-11 esta pantalla
 * era el buscador; ahora el buscador vive en `/buscar`.
 *
 * Ya no lleva botones de «Buscar» ni «Aportar» (quitados a pedido): la barra de
 * navegación los ofrece en todas las pantallas, y `/aportar` sigue mandando al
 * login si no hay sesión (`ExigeSesion`). La portada solo enseña el producto.
 *
 * La cabecera (`HeroInicio`) es animada y de cliente: título escrito sobre el
 * pentagrama, «tú» rodeado a boli y una hoja de cifrado que cambia de tono
 * sola.
 *
 * Debajo (`Funciones`), lo otro que PentCord hace: escribir con vista previa y
 * leer en notas o en grados. La antigua demo interactiva del transporte se
 * quitó el 2026-10-05: la cabecera ya enseña el mismo cambio de tono, y mejor.
 */
export function Inicio() {
  return (
    <>
      <HeroInicio />
      <Funciones />
    </>
  );
}
