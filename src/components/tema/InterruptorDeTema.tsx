"use client";

import { useSyncExternalStore } from "react";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { pedirApi } from "@/lib/api/cliente";
import { EVENTO_DE_TEMA, aplicarTema, leerTema, type Tema } from "@/lib/tema/tema";

function suscribirse(alCambiar: () => void) {
  const consulta = window.matchMedia("(prefers-color-scheme: dark)");
  consulta.addEventListener("change", alCambiar);
  window.addEventListener(EVENTO_DE_TEMA, alCambiar);
  return () => {
    consulta.removeEventListener("change", alCambiar);
    window.removeEventListener(EVENTO_DE_TEMA, alCambiar);
  };
}

/** `boton`: el círculo de siempre (fila de Preferencias). `pestana`: prendida
 * al canto derecho de la pantalla, como una cejilla en el mástil. La usa el
 * layout raíz, fija y fuera del `<header>`. */
type Variante = "boton" | "pestana";

/** Silueta de la pestaña, en un viewBox 32×56: filo recto contra el borde de
 * pantalla (x=32, sin trazo, se funde con el borde de la ventana) y una
 * cápsula de radio único (28 = mitad del alto) hacia la izquierda, como una
 * lengüeta redondeada corriente — sin el quiebre de una curva compuesta.
 */
const RUTA_PESTANA = "M28,0 L32,0 L32,56 L28,56 A28,28 0 0 1 28,0 Z";

const RUTA_PESTANA_CURVA = "M32,0 L28,0 A28,28 0 0 0 28,56 L32,56";

const FORMAS: Record<Variante, string> = {
  boton:
    "grid size-9 place-items-center rounded-full border border-pauta text-tinta-suave transition-colors hover:border-pauta-fuerte hover:text-tinta",
  pestana:
    "group fixed top-24 right-0 z-40 grid h-14 w-8 place-items-center text-tinta-suave drop-shadow-md transition-colors hover:text-tinta sm:top-28",
};

export function InterruptorDeTema({
  className = "",
  variante = "boton",
}: {
  className?: string;
  variante?: Variante;
}) {
  // En el servidor no se sabe qué tema resolverá el navegador, así que el botón
  // se dibuja neutro hasta hidratar en vez de adivinar y corregirse después.
  const tema = useSyncExternalStore<Tema | null>(suscribirse, leerTema, () => null);
  const { estado } = useSesion();

  function alternar() {
    const siguiente: Tema = leerTema() === "dark" ? "light" : "dark";
    aplicarTema(siguiente);
    if (estado === "autenticado") {
      // `pedirApi` (no `usarApi`): un 401 aquí no debe expulsar a login —
      // guardar el tema es una operación de baja importancia, no crítica.
      pedirApi("/usuarios/me/tema", { method: "PATCH", cuerpo: { tema: siguiente } }).catch(
        () => { },
      );
    }
  }

  const vaAOscuro = tema !== "dark";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={vaAOscuro ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      title={vaAOscuro ? "Modo oscuro" : "Modo claro"}
      className={`${FORMAS[variante]} ${className}`}
    >
      {variante === "pestana" ? (
        <svg
          viewBox="0 0 32 56"
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full overflow-visible"
        >
          {/* Relleno con la figura cerrada (incluye el canto recto en x=48, pegado
           * al borde de pantalla, que no debe llevar trazo). */}
          <path d={RUTA_PESTANA} className="fill-hoja" />
          {/* Trazo solo sobre la curva, sin el canto recto de cierre — si ese
           * canto llevara stroke, el hover lo iluminaría contra el borde real
           * de la pantalla. */}
          <path
            d={RUTA_PESTANA_CURVA}
            fill="none"
            className="stroke-pauta transition-colors group-hover:stroke-pauta-fuerte"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
      <span className={variante === "pestana" ? "translate-x-0.5" : ""}>
        {tema === null ? (
          <span
            aria-hidden="true"
            className="size-3.5 rounded-full border border-current opacity-40"
          />
        ) : vaAOscuro ? (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
              d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M12 2.2v2.6M12 19.2v2.6M2.2 12h2.6M19.2 12h2.6M5.1 5.1l1.9 1.9M17 17l1.9 1.9M18.9 5.1 17 7M7 17l-1.9 1.9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
