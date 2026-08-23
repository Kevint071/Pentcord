"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS, esDestinoActivo } from "./destinos";

/**
 * C.2 · Barra fija de móvil.
 *
 * Va abajo porque la app se usa con el teléfono en un atril y una sola mano
 * libre. Siempre visible, con o sin sesión: los destinos que piden cuenta
 * llevan al login sin perder el contexto (ver `ExigeSesion`).
 */
export function BarraNavegacion() {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Secciones principales"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-pauta bg-hoja/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {DESTINOS.map((destino) => {
          const activo = esDestinoActivo(destino.href, ruta);
          return (
            <li key={destino.href}>
              <Link
                href={destino.href}
                aria-current={activo ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[0.6875rem] font-medium transition-colors ${
                  activo ? "text-tinta" : "text-tinta-tenue"
                }`}
              >
                {/* Marca de traste: dice cuál es la sección activa sin depender
                    solo del color. */}
                <span
                  aria-hidden="true"
                  className={`h-[3px] w-6 rounded-full transition-colors ${
                    activo ? "bg-acorde" : "bg-transparent"
                  }`}
                />
                <destino.icono className="size-[22px]" />
                {destino.etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
