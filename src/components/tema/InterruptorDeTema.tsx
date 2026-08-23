"use client";

import { useSyncExternalStore } from "react";
import { CLAVE_DE_TEMA } from "./guionDeTema";

type Tema = "light" | "dark";

const EVENTO = "pentcord:tema";

/**
 * El tema real no vive en React: vive en el atributo `data-theme` del documento
 * (lo pone el guion previo al pintado) y en la preferencia del sistema. Así que
 * se lee como lo que es, un almacén externo, en vez de copiarlo a un estado.
 */
function leerTema(): Tema {
  const marcado = document.documentElement.getAttribute("data-theme");
  if (marcado === "light" || marcado === "dark") return marcado;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function suscribirse(alCambiar: () => void) {
  const consulta = window.matchMedia("(prefers-color-scheme: dark)");
  consulta.addEventListener("change", alCambiar);
  window.addEventListener(EVENTO, alCambiar);
  return () => {
    consulta.removeEventListener("change", alCambiar);
    window.removeEventListener(EVENTO, alCambiar);
  };
}

export function InterruptorDeTema({ className = "" }: { className?: string }) {
  // En el servidor no se sabe qué tema resolverá el navegador, así que el botón
  // se dibuja neutro hasta hidratar en vez de adivinar y corregirse después.
  const tema = useSyncExternalStore<Tema | null>(
    suscribirse,
    leerTema,
    () => null,
  );

  function alternar() {
    const siguiente: Tema = leerTema() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", siguiente);
    try {
      localStorage.setItem(CLAVE_DE_TEMA, siguiente);
    } catch {
      // Modo privado o almacenamiento bloqueado: el tema dura esta sesión.
    }
    window.dispatchEvent(new Event(EVENTO));
  }

  const vaAOscuro = tema !== "dark";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={vaAOscuro ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      title={vaAOscuro ? "Modo oscuro" : "Modo claro"}
      className={`grid size-9 place-items-center rounded-full border border-pauta text-tinta-suave transition-colors hover:border-pauta-fuerte hover:text-tinta ${className}`}
    >
      {tema === null ? (
        <span
          aria-hidden="true"
          className="size-4 rounded-full border border-current opacity-40"
        />
      ) : vaAOscuro ? (
        <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
          <path
            d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
