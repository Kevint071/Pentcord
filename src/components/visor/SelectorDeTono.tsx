"use client";

import { useRef } from "react";
import { distanciaEnSemitonos } from "@/domain/musica";
import type { Tono } from "@/domain/musica/tipos";

export { distanciaEnSemitonos };

/**
 * D.3 · Selector de tono.
 *
 * No es un desplegable: es una octava de piano. Las siete teclas blancas y las
 * cinco negras están donde el músico espera encontrarlas, así que elegir un
 * tono es un solo toque y se puede hacer sin leer — que es lo que hace falta
 * cuando faltan dos minutos para empezar.
 *
 * Detalles que importan:
 * - El tono original queda marcado siempre, para no perder de vista dónde está
 *   casa (RN-002: el original no cambia nunca).
 * - Las flechas del teclado se mueven de semitono en semitono, en orden
 *   cromático real, no en el orden visual de las teclas.
 * - El transporte ocurre en el cliente, sin red (HU-05).
 */

/** Orden cromático: es el que siguen las flechas del teclado. */
const CROMATICA: Tono[] = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const NATURALES: Tono[] = ["C", "D", "E", "F", "G", "A", "B"];

/** `centro` es el límite entre teclas blancas sobre el que se apoya la negra. */
const ALTERADAS: { tono: Tono; centro: number }[] = [
  { tono: "Db", centro: 1 },
  { tono: "Eb", centro: 2 },
  { tono: "F#", centro: 4 },
  { tono: "Ab", centro: 5 },
  { tono: "Bb", centro: 6 },
];

const ANCHO_BLANCA = 100 / 7;
const ANCHO_NEGRA = 9.6;

/** Nombre para leer: `Db` se pinta `D♭`, y se dice completo al lector de pantalla. */
const GLIFOS: Record<string, string> = { b: "♭", "#": "♯" };
const PALABRAS: Record<string, string> = { b: " bemol", "#": " sostenido" };

function pintarTono(tono: Tono) {
  return tono.replace(/[b#]/, (s) => GLIFOS[s]);
}

function decirTono(tono: Tono) {
  return tono.replace(/[b#]/, (s) => PALABRAS[s]);
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
  const teclas = useRef(new Map<Tono, HTMLButtonElement>());

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
      const indice = (CROMATICA.indexOf(tonoActivo) + paso + 12) % 12;
      destino = CROMATICA[indice];
    } else if (evento.key === "Home" && tonoOriginal !== null) {
      destino = tonoOriginal;
    }

    if (!destino) return;
    evento.preventDefault();
    onCambiar(destino);
    teclas.current.get(destino)?.focus();
  }

  function propiedadesDeTecla(tono: Tono) {
    const seleccionado = tono === tonoActivo;
    const esOriginal = tono === tonoOriginal;

    return {
      type: "button" as const,
      role: "radio",
      "aria-checked": seleccionado,
      // Tabulación itinerante: un solo alto de tabulador para las 12 teclas.
      tabIndex: seleccionado ? 0 : -1,
      "aria-label": `${decirTono(tono)}${esOriginal ? ", tono original" : ""}`,
      onClick: () => onCambiar(tono),
      ref: (nodo: HTMLButtonElement | null) => {
        if (nodo) teclas.current.set(tono, nodo);
        else teclas.current.delete(tono);
      },
    };
  }

  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      onKeyDown={alPulsarTecla}
      className="relative h-18 w-full select-none sm:h-20"
    >
      {/* Teclas blancas */}
      <div className="flex h-full w-full gap-px">
        {NATURALES.map((tono) => {
          const seleccionado = tono === tonoActivo;
          return (
            <button
              key={tono}
              {...propiedadesDeTecla(tono)}
              className={`relative flex flex-1 items-end justify-center rounded-b-md border border-t-0 pb-1.5 transition-colors first:rounded-tl-md last:rounded-tr-md ${
                seleccionado
                  ? "border-acorde bg-acorde text-papel"
                  : "border-pauta-fuerte bg-hoja-alta text-tinta-suave hover:bg-hoja"
              }`}
            >
              <span className="rotulo text-lg">{pintarTono(tono)}</span>
              {tono === tonoOriginal ? <MarcaDeOriginal /> : null}
            </button>
          );
        })}
      </div>

      {/* Teclas negras, apoyadas sobre los límites de las blancas */}
      {ALTERADAS.map(({ tono, centro }) => {
        const seleccionado = tono === tonoActivo;
        return (
          <button
            key={tono}
            {...propiedadesDeTecla(tono)}
            style={{
              left: `${centro * ANCHO_BLANCA - ANCHO_NEGRA / 2}%`,
              width: `${ANCHO_NEGRA}%`,
            }}
            className={`absolute top-0 flex h-[58%] items-end justify-center rounded-b-md pb-1 transition-colors ${
              seleccionado
                ? "bg-acorde text-papel"
                : "bg-tinta text-papel/70 hover:text-papel"
            }`}
          >
            <span className="rotulo text-[0.8125rem]">{pintarTono(tono)}</span>
            {tono === tonoOriginal ? <MarcaDeOriginal sobreNegra /> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Punto que señala el tono original, como la marca de traste de un mástil. */
function MarcaDeOriginal({ sobreNegra = false }: { sobreNegra?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-current ${
        sobreNegra ? "top-1.5 opacity-70" : "top-2 opacity-45"
      }`}
    />
  );
}
