"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS, esDestinoActivo } from "./destinos";
import { InterruptorDeTema } from "@/components/tema/InterruptorDeTema";

/**
 * Encabezado: marca, riel de navegación en escritorio (la barra inferior solo
 * existe en móvil) e interruptor de tema.
 */
export function Encabezado() {
  const ruta = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-pauta bg-papel/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="rotulo text-2xl tracking-[0.02em] text-tinta"
          aria-label="PentCord, ir al inicio"
        >
          Pent<span className="text-acorde">Cord</span>
        </Link>

        <nav
          aria-label="Secciones principales"
          className="ml-auto hidden md:block"
        >
          <ul className="flex items-center gap-1">
            {DESTINOS.map((destino) => {
              const activo = esDestinoActivo(destino.href, ruta);
              return (
                <li key={destino.href}>
                  <Link
                    href={destino.href}
                    aria-current={activo ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      activo
                        ? "bg-acorde-suave text-acorde"
                        : "text-tinta-suave hover:bg-hoja hover:text-tinta"
                    }`}
                  >
                    <destino.icono className="size-4.5" />
                    {destino.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <InterruptorDeTema className="ml-auto md:ml-0" />
      </div>
    </header>
  );
}
