import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Las piezas visuales de la portada, separadas de la lógica del buscador.
 *
 * El buscador es interactivo y lee la URL con `useSearchParams`, así que vive
 * detrás de un límite de Suspense y no entra en el HTML prerrenderizado. Estas
 * piezas sí, y con ellas se construye una espera que es idéntica a la pantalla
 * real: quien entra ve la portada de inmediato, no un "cargando".
 *
 * `FilaDeCancion` vive aquí porque la usan los dos sitios que listan canciones:
 * los resultados de una búsqueda y el catálogo de la portada. Una canción se ve
 * igual se haya llegado a ella buscando o mirando.
 */

export function Contenedor({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">{children}</div>
  );
}

/**
 * La portada entera: el pentagrama en blanco antes de escribir nada. Nada de
 * titular ni de demo — el buscador es lo primero que se ve al entrar, posado
 * sobre la pauta como el título que se apunta arriba de una hoja de cifrado.
 */
export function Portada({ children }: { children: ReactNode }) {
  return (
    <section className="relative flex items-center justify-center py-8 sm:min-h-[48svh] sm:py-10">
      <div
        aria-hidden="true"
        className="pauta-pentagrama pointer-events-none absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 opacity-70 sm:h-48"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 size-104 -translate-x-1/2 -translate-y-1/2 rounded-full bg-acorde-suave opacity-40 blur-3xl sm:size-128"
      />
      <Contenedor>
        <div className="relative">
          <h1 className="rotulo text-center text-[clamp(1.75rem,6vw,2.5rem)] text-tinta">
            Busca una canción
          </h1>
          <div className="mt-6">{children}</div>
        </div>
      </Contenedor>
    </section>
  );
}

export function MarcoDeBusqueda({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-pauta-fuerte bg-hoja-alta px-5 py-4 shadow-hoja transition-colors focus-within:border-acorde">
      <svg
        viewBox="0 0 24 24"
        className="size-5 shrink-0 text-tinta-tenue"
        aria-hidden="true"
      >
        <circle
          cx="11"
          cy="11"
          r="6.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="m15.6 15.6 4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
      {children}
    </div>
  );
}

/**
 * Una canción en una lista. Pensada para ir dentro de un `<ul>` con
 * `divide-y divide-pauta`: el separador fino hace de pauta y evita convertir
 * cada canción en una tarjeta.
 */
export function FilaDeCancion({
  id,
  titulo,
  artista,
}: {
  id: number;
  titulo: string;
  artista: string;
}) {
  return (
    <li>
      <Link
        href={`/canciones/${id}`}
        className="group -mx-3 flex items-center gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-hoja"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-tinta">{titulo}</span>
          <span className="mt-0.5 block truncate font-mono text-[0.8125rem] text-tinta-suave">
            {artista}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-tinta-tenue transition-colors group-hover:text-acorde"
          aria-hidden="true"
        >
          <path
            d="m9 5 7 7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </li>
  );
}
