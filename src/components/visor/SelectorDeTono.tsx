"use client";

import { useRef } from "react";
import { TONOS, distanciaEnSemitonos } from "@/domain/musica";
import type { Tono } from "@/domain/musica/tipos";

export { distanciaEnSemitonos };

/**
 * D.3 · Selector de tono.
 *
 * No es un desplegable ni un teclado de piano: es la escala cromática puesta
 * en fila, de semitono en semitono. PentCord lo usan guitarras, bajos, voces y
 * teclados, así que el control no puede hablar el idioma de un instrumento
 * concreto — los doce tonos son lo único que todos comparten.
 *
 * Detalles que importan:
 * - Los doce están a la vista y a un solo toque: elegir tono no obliga a leer
 *   ni a contar semitonos.
 * - El orden en pantalla es el orden cromático, así que las flechas del
 *   teclado se mueven por donde el ojo espera (con el piano no coincidía: a la
 *   derecha de C se veía D, pero la flecha llevaba a Db).
 * - El tono original queda marcado siempre, para no perder de vista dónde está
 *   casa (RN-002: el original no cambia nunca).
 * - El transporte ocurre en el cliente, sin red (HU-05).
 */

/** Nombre para leer: `Db` se pinta `D♭`, y se dice completo al lector de pantalla. */
const GLIFOS: Record<string, string> = { b: "♭", "#": "♯" };
const PALABRAS: Record<string, string> = { b: " bemol", "#": " sostenido" };

function pintarTono(tono: Tono) {
  return tono.replace(/[b#]/, (s) => GLIFOS[s]);
}

function decirTono(tono: Tono) {
  return tono.replace(/[b#]/, (s) => PALABRAS[s]);
}

/** Un tono sin alteración: se pinta en tinta plena para poder buscarlo de un vistazo. */
function esNatural(tono: Tono) {
  return tono.length === 1;
}

export function etiquetaDeDistancia(desde: Tono, hasta: Tono) {
  const semitonos = distanciaEnSemitonos(desde, hasta);
  if (semitonos === 0) return "Tono original";
  const signo = semitonos > 0 ? "+" : "−";
  const cantidad = Math.abs(semitonos);
  return `${signo}${cantidad} ${cantidad === 1 ? "semitono" : "semitonos"}`;
}

export function SelectorDeTono({
  tonoActivo,
  tonoOriginal,
  onCambiar,
  etiqueta = "Tono de la canción",
}: {
  tonoActivo: Tono;
  /**
   * La marca de "casa". `null` en el formulario de aportar (E.3), donde el tono
   * que se está eligiendo *es* el original y no hay nada anterior que señalar.
   */
  tonoOriginal: Tono | null;
  onCambiar: (tono: Tono) => void;
  etiqueta?: string;
}) {
  const celdas = useRef(new Map<Tono, HTMLButtonElement>());

  function alPulsarTecla(evento: React.KeyboardEvent) {
    const pasos: Record<string, number> = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
    };
    const paso = pasos[evento.key];

    let destino: Tono | undefined;
    if (paso !== undefined) {
      // La escala da la vuelta: a la derecha de B vuelve a estar C.
      const indice = (TONOS.indexOf(tonoActivo) + paso + 12) % 12;
      destino = TONOS[indice];
    } else if (evento.key === "Home" && tonoOriginal !== null) {
      destino = tonoOriginal;
    }

    if (!destino) return;
    evento.preventDefault();
    onCambiar(destino);
    celdas.current.get(destino)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      onKeyDown={alPulsarTecla}
      className="flex w-full select-none gap-px overflow-hidden rounded-lg border border-pauta-fuerte bg-pauta-fuerte"
    >
      {TONOS.map((tono) => {
        const seleccionado = tono === tonoActivo;
        const esOriginal = tono === tonoOriginal;

        return (
          <button
            key={tono}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            // Tabulación itinerante: un solo alto de tabulador para los doce.
            tabIndex={seleccionado ? 0 : -1}
            aria-label={`${decirTono(tono)}${esOriginal ? ", tono original" : ""}`}
            onClick={() => onCambiar(tono)}
            ref={(nodo) => {
              if (nodo) celdas.current.set(tono, nodo);
              else celdas.current.delete(tono);
            }}
            className={`relative flex h-11 flex-1 basis-0 items-center justify-center transition-colors sm:h-12 ${
              seleccionado
                ? "bg-acorde text-papel"
                : `bg-hoja hover:bg-hoja-alta ${
                    esNatural(tono) ? "text-tinta" : "text-tinta-suave"
                  }`
            }`}
          >
            <span className="rotulo text-[0.9375rem] sm:text-base">
              {pintarTono(tono)}
            </span>
            {esOriginal ? (
              /* Dónde está casa: un punto bajo el nombre, como la marca que se
                 deja a lápiz en el tono en el que se escribió la canción. */
              <span
                aria-hidden="true"
                className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current opacity-50"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
