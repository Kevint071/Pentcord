import type { ReactNode } from "react";

/**
 * Las piezas visuales de la portada, separadas de la lógica del buscador.
 *
 * El buscador es interactivo y lee la URL con `useSearchParams`, así que vive
 * detrás de un límite de Suspense y no entra en el HTML prerrenderizado. Estas
 * piezas sí, y con ellas se construye una espera que es idéntica a la pantalla
 * real: quien entra ve la portada de inmediato, no un "cargando".
 */

export function Contenedor({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">{children}</div>
  );
}

export function Encabezamiento() {
  return (
    <h1 className="rotulo text-[clamp(2.5rem,11vw,4.5rem)] text-tinta">
      Encuentra la versión.
      <br />
      <span className="text-acorde">Cámbiala de tono.</span>
    </h1>
  );
}

export function MarcoDeBusqueda({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-pauta-fuerte bg-hoja-alta px-5 py-3 shadow-hoja focus-within:border-acorde">
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
 * Espécimen: una línea de canción tal y como la pinta PentCord. Explica el
 * producto mejor que un párrafo, y desaparece en cuanto el usuario busca.
 */
export function Muestra() {
  return (
    <figure className="mt-10 border-t border-pauta pt-6">
      <div className="cifrado text-tinta">
        <p className="cifrado-linea">
          <span className="cifrado-segmento">
            <span className="cifrado-acorde">C</span>
            <span className="cifrado-letra">Cuando salga el </span>
          </span>
          <span className="cifrado-segmento">
            <span className="cifrado-acorde">G</span>
            <span className="cifrado-letra">sol sobre el </span>
          </span>
          <span className="cifrado-segmento">
            <span className="cifrado-acorde">Am</span>
            <span className="cifrado-letra">valle</span>
          </span>
        </p>
      </div>
      <figcaption className="mt-3 text-sm leading-relaxed text-tinta-suave">
        Así se lee una canción aquí: cada acorde encima de su sílaba exacta. Un
        toque en el selector la pasa a tu tono, o a grados, sin recargar nada.
      </figcaption>
    </figure>
  );
}
