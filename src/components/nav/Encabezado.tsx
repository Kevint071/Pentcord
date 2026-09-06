"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS, esDestinoActivo } from "./destinos";
import { InterruptorDeTema } from "@/components/tema/InterruptorDeTema";
import { MenuDePerfil } from "@/components/nav/MenuDePerfil";
import { BotonEnlace } from "@/components/ui/Boton";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { rutaDeLogin } from "@/lib/api/cliente";

/**
 * Encabezado: marca, navegación e interruptor de tema. Desde el 2026-09-05 es
 * la **única** superficie de navegación: la barra fija inferior de móvil ya no
 * existe.
 *
 * Un solo `<nav>` sirve a los dos anchos y cambia de forma con CSS, no con dos
 * marcados distintos: en escritorio es el riel de pastillas de siempre, a la
 * derecha de la marca; en móvil baja a una segunda línea del propio encabezado
 * y se convierte en pestañas de texto a lo ancho, sin iconos — el nombre de la
 * sección se lee de un vistazo y no hay que descifrar un pictograma. La
 * subrayada es la sección actual (la misma "marca de traste" que llevaba la
 * barra inferior, ahora bajo la etiqueta).
 *
 * Qué se enseña depende de la sesión: con cuenta, el riel de Buscar/Aportar
 * más el menú de avatar (Favoritos/Perfil/Ajustes/Preferencias); sin ella,
 * "Iniciar sesión" y "Registrarse" **en los dos anchos** — Aportar es el único
 * destino del riel que exige cuenta, y de todas formas llevaba al login.
 * Mientras se confirma la sesión no se enseña ninguno de los dos, para no
 * prometer un estado que puede no ser cierto un instante después.
 */
export function Encabezado() {
  const ruta = usePathname();
  const { estado } = useSesion();

  return (
    <header className="sticky top-0 z-30 border-b border-pauta bg-papel/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 px-4 sm:gap-x-4 sm:px-6">
        <Link
          href="/"
          className="rotulo flex h-14 items-center text-lg tracking-[0.02em] text-tinta sm:text-2xl"
          aria-label="PentCord, ir al inicio"
        >
          Pent<span className="text-acorde">Cord</span>
        </Link>

        {estado === "autenticado" ? (
          <nav
            aria-label="Secciones principales"
            /* `order-last` + `w-full`: en móvil el riel salta de línea y ocupa
               el ancho entero; el borde superior va a sangre, de ahí el margen
               negativo que compensa el acolchado del contenedor. */
            className="order-last -mx-4 w-full border-t border-pauta px-4 sm:-mx-6 sm:px-6 md:order-none md:mx-0 md:ml-auto md:w-auto md:border-t-0 md:px-0"
          >
            <ul className="flex md:gap-1">
              {DESTINOS.map((destino) => {
                const activo = esDestinoActivo(destino.href, ruta);
                return (
                  <li key={destino.href} className="flex-1 md:flex-none">
                    <Link
                      href={destino.href}
                      aria-current={activo ? "page" : undefined}
                      className={`flex h-11 items-center justify-center gap-2 border-b-2 text-sm font-medium transition-colors md:h-auto md:rounded-full md:border-b-0 md:px-3 md:py-1.5 ${
                        activo
                          ? "border-acorde text-tinta md:bg-acorde-suave md:text-acorde"
                          : "border-transparent text-tinta-suave md:hover:bg-hoja md:hover:text-tinta"
                      }`}
                    >
                      <destino.icono className="hidden size-4.5 md:block" />
                      {destino.etiqueta}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <div
          className={`flex h-14 items-center gap-2 sm:gap-3 ${
            estado === "autenticado" ? "ml-auto md:ml-0" : "ml-auto"
          }`}
        >
          {estado === "anonimo" ? (
            <>
              {/* Enlace escueto y un solo botón sólido: en 360 px caben los dos
                  junto a la marca sin recortar ninguna de las dos palabras. */}
              <Link
                href={rutaDeLogin(ruta)}
                className="text-[0.8125rem] font-medium whitespace-nowrap text-tinta-suave transition-colors hover:text-tinta sm:text-sm"
              >
                Iniciar sesión
              </Link>
              <BotonEnlace
                href={`${rutaDeLogin(ruta)}&modo=crear`}
                variante="primario"
                tamano="compacto"
                className="whitespace-nowrap"
              >
                Registrarse
              </BotonEnlace>
            </>
          ) : null}

          <InterruptorDeTema />
          {estado === "autenticado" ? <MenuDePerfil /> : null}
        </div>
      </div>
    </header>
  );
}
