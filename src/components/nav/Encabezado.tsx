"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS, esDestinoActivo } from "./destinos";
import { BotonDeBuscar, BuscadorDeEncabezado } from "./BuscadorDeEncabezado";
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
 *
 * El interruptor de tema ya no vive aquí: es la "pestaña" fija que pinta el
 * layout raíz, fuera de este `<header>`. Si volviera a colgar de una fila con
 * `backdrop-blur-sm`, su `position: fixed` quedaría anclado a esa fila (el
 * filtro crea su propio *containing block*) en vez de al viewport.
 */
export function Encabezado() {
  const ruta = usePathname();
  const { estado } = useSesion();
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  // En `/buscar` ya está el campo grande: repetirlo aquí sería dos buscadores
  // a la vez en la misma pantalla.
  const conBuscador = ruta !== "/buscar";

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

        {conBuscador ? (
          <BuscadorDeEncabezado
            abierto={buscadorAbierto}
            onCambiar={setBuscadorAbierto}
          />
        ) : null}

        {estado === "autenticado" ? (
          <nav
            aria-label="Secciones principales"
            className="order-last -mx-4 basis-full grow border-t border-pauta px-4 sm:-mx-6 sm:px-6 md:order-0 md:mx-0 md:ml-auto md:basis-auto md:grow-0 md:border-t-0 md:px-0"
          >
            <ul className="flex md:gap-1">
              {DESTINOS.map((destino) => {
                const activo = esDestinoActivo(destino.href, ruta);
                return (
                  <li key={destino.href} className="flex-1 md:flex-none">
                    <Link
                      href={destino.href}
                      aria-current={activo ? "page" : undefined}
                      className={`flex h-11 items-center justify-center gap-2 border-b-2 text-sm font-medium transition-colors md:h-auto md:rounded-full md:border-b-0 md:px-3 md:py-1.5 ${activo
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
          className={`flex h-14 items-center gap-2 sm:gap-3 ${estado === "autenticado" ? "ml-auto md:ml-0" : "ml-auto"
            }`}
        >
          {conBuscador ? (
            <BotonDeBuscar
              abierto={buscadorAbierto}
              onAlternar={() => setBuscadorAbierto((abierto) => !abierto)}
            />
          ) : null}

          {estado === "anonimo" ? (
            <>
              {/* En móvil, un solo botón sólido "Entrar": con dos junto a la
                  marca iba todo apretado en 360 px. Lleva a /login, que ya
                  trae el selector Entrar / Crear cuenta, así que no se pierde
                  el registro. Desde `sm` vuelven el enlace escueto y el botón
                  "Registrarse". El `aria-label` fija el nombre accesible en
                  los dos anchos, aunque el texto visible cambie. */}
              <Link
                href={rutaDeLogin(ruta)}
                aria-label="Iniciar sesión"
                className="text-sm font-medium whitespace-nowrap text-tinta-suave transition-colors hover:text-tinta max-sm:rounded-full max-sm:bg-tinta max-sm:px-4 max-sm:py-2 max-sm:text-papel max-sm:hover:bg-tinta/85 max-sm:hover:text-papel"
              >
                <span className="sm:hidden">Entrar</span>
                <span className="max-sm:hidden">Iniciar sesión</span>
              </Link>
              <BotonEnlace
                href={`${rutaDeLogin(ruta)}&modo=crear`}
                variante="primario"
                tamano="compacto"
                className="whitespace-nowrap max-sm:hidden"
              >
                Registrarse
              </BotonEnlace>
            </>
          ) : null}

          {estado === "autenticado" ? <MenuDePerfil /> : null}
        </div>
      </div>
    </header>
  );
}
