"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Cifrado } from "@/components/visor/Cifrado";
import { TONOS, parsearChordPro, renderizar } from "@/domain/musica";
import type { Tono } from "@/domain/musica/tipos";

/**
 * Inicio · la cabecera animada.
 *
 * Sin botones: buscar y aportar ya están en la barra de navegación, y repetirlos
 * aquí competía con el título. La cabecera solo enseña el producto. El único
 * enlace es la palabra «Canciones» del título, subrayada, que lleva a `/buscar`.
 *
 * Idea: la hoja que se reescribe. PentCord hace a mano lo que el músico hacía
 * con un bolígrafo sobre una fotocopia, así que la cabecera se escribe sola
 * como esa hoja: las cinco pautas se trazan, el título se apunta palabra a
 * palabra, «tú» se rodea a boli —el círculo que uno hace sobre lo importante— y
 * una hoja de cifrado cambia de tono por su cuenta con los acordes
 * reescribiéndose. Es el producto en una sola imagen: lo que ves moverse es el
 * transporte, no un adorno.
 *
 * La hoja es decorativa (`aria-hidden`): la demo interactiva, con su selector
 * accesible, es la de más abajo. Por eso aquí el tono lo gira un temporizador y
 * no hay controles. Con `prefers-reduced-motion` (que Windows activa a menudo
 * sin que se note) sigue girando y entrando, pero solo con fundidos y trazo: sin
 * desplazar, inclinar ni flotar. El detalle está en `globals.css`.
 *
 * Los acordes fantasma del fondo evitan a propósito los nombres que usa la demo
 * de abajo (`Am`, `Bm`…), para que el texto de la página siga siendo único.
 */

const TONO_ORIGINAL: Tono = "C";

/** El orden de la gira: saltos grandes, para que cada cambio se note. */
const GIRA: readonly Tono[] = ["C", "D", "F", "G", "Bb", "A", "E"];

const INTERVALO_MS = 2800;

const FRAGMENTO = parsearChordPro(
  "[C]Cambia el [Em]tono, y el [F]acorde [G]te sigue",
);

const PALABRAS = [
  "Canciones",
  "con",
  "acordes,",
  "en",
  "el",
  "tono",
  "que",
  "tú",
  "tocas.",
];
const INDICE_DE_TU = PALABRAS.indexOf("tú");
const INDICE_DE_CANCIONES = PALABRAS.indexOf("Canciones");

/** Acordes que flotan detrás: sitio, tamaño y ritmo propios para que no marquen compás. */
const FANTASMAS: ReadonlyArray<{
  texto: string;
  estilo: CSSProperties;
  clase?: string;
}> = [
  { texto: "Dmaj7", estilo: { left: "3%", top: "10%", "--d": "9s" } as CSSProperties },
  { texto: "G7", estilo: { left: "44%", top: "4%", "--d": "11s" } as CSSProperties, clase: "hidden sm:block" },
  { texto: "F#m", estilo: { left: "30%", bottom: "6%", "--d": "10s" } as CSSProperties },
  { texto: "Cadd9", estilo: { right: "4%", top: "6%", "--d": "12s" } as CSSProperties, clase: "hidden lg:block" },
  { texto: "Em7", estilo: { right: "9%", bottom: "4%", "--d": "8s" } as CSSProperties, clase: "hidden sm:block" },
];

function pintarTono(tono: Tono) {
  return tono.replace("b", "♭").replace("#", "♯");
}

export function HeroInicio() {
  const [tono, setTono] = useState<Tono>(TONO_ORIGINAL);

  useEffect(() => {
    // Gira también con «reducir animaciones»: ahí el cambio es un fundido, no
    // un desplazamiento (ver `globals.css`). Sin `matchMedia` (jsdom) no gira,
    // así los tests ven siempre el tono original.
    if (!window.matchMedia) return;

    let posicion = 0;
    const temporizador = window.setInterval(() => {
      posicion = (posicion + 1) % GIRA.length;
      setTono(GIRA[posicion]);
    }, INTERVALO_MS);
    return () => window.clearInterval(temporizador);
  }, []);

  const cifrado = useMemo(
    () => renderizar(FRAGMENTO, { tonoOriginal: TONO_ORIGINAL, tono, modo: "notas" }),
    [tono],
  );

  return (
    <section data-suave className="relative overflow-x-clip pt-8 pb-12 sm:pt-16 sm:pb-20">
      {/* Acordes que flotan al fondo, como los que se apuntan a lápiz y se tachan. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden sm:block">
        {FANTASMAS.map((f) => (
          <span
            key={f.texto}
            className={`hero-fantasma absolute font-mono text-sm font-semibold text-acorde sm:text-base ${f.clase ?? ""}`}
            style={f.estilo}
          >
            {f.texto}
          </span>
        ))}
      </div>

      {/* Los acordes de móvil: en los huecos que dejan las líneas cortas del
          título («CANCIONES», «TÚ TOCAS.») y alrededor de la hoja, sin pisar
          texto. En escritorio mandan los de arriba. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 sm:hidden">
        {[
          { texto: "Dmaj7", clase: "right-[8%] top-[6.9rem]", d: "9s" },
          { texto: "G7", clase: "right-[12%] top-[12.8rem]", d: "11s" },
          { texto: "F#m", clase: "right-[9%] top-[21.5rem]", d: "10s" },
          { texto: "Em7", clase: "left-[8%] bottom-[0.6rem]", d: "8s" },
        ].map((f) => (
          <span
            key={f.texto}
            className={`hero-fantasma absolute font-mono text-xs font-semibold text-acorde ${f.clase}`}
            style={{ "--d": f.d } as CSSProperties}
          >
            {f.texto}
          </span>
        ))}
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <div>
          {/* El `aria-label` da la frase entera: con cada palabra en su propio
              `inline-block`, el nombre accesible perdía los espacios. */}
          <h1
            aria-label={PALABRAS.join(" ")}
            className="rotulo text-[clamp(2.6rem,12vw,4.75rem)] leading-[1.16]! text-balance text-tinta"
          >
            {PALABRAS.map((palabra, i) => (
              <span key={i}>
                {i === INDICE_DE_TU ? (
                  <span
                    className="hero-palabra relative mx-[0.22em] inline-block text-acorde"
                    style={{ "--i": i } as CSSProperties}
                  >
                    {palabra}
                    {/* El círculo a boli: se dibuja solo, con el trazo sin deformarse. */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 120 70"
                      preserveAspectRatio="none"
                      className="pointer-events-none absolute inset-x-[-0.28em] inset-y-[-0.04em] h-[calc(100%+0.08em)] w-[calc(100%+0.56em)] overflow-visible"
                    >
                      <path
                        pathLength={1}
                        className="hero-circulo"
                        d="M64 6 C102 3 119 22 113 39 C107 57 70 67 38 63 C10 59 2 40 9 25 C16 9 52 3 84 9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </span>
                ) : i === INDICE_DE_CANCIONES ? (
                  <span
                    className="hero-palabra inline-block"
                    style={{ "--i": i } as CSSProperties}
                  >
                    {/* La puerta al catálogo: subrayada como un enlace, en el
                        color de acorde para que se lea como lo pulsable del
                        título. Al pasar el ratón el trazo engorda. */}
                    <Link
                      href="/buscar"
                      className="underline decoration-acorde decoration-[0.055em] underline-offset-[0.14em] transition-[text-decoration-thickness,color] duration-200 ease-out hover:text-acorde hover:decoration-[0.09em] focus-visible:text-acorde"
                    >
                      {palabra}
                    </Link>
                  </span>
                ) : (
                  <span
                    className="hero-palabra inline-block"
                    style={{ "--i": i } as CSSProperties}
                  >
                    {palabra}
                  </span>
                )}
                {i < PALABRAS.length - 1 ? " " : null}
              </span>
            ))}
          </h1>

          <p
            className="hero-entra mt-7 max-w-[34ch] text-base leading-relaxed text-tinta-suave sm:mt-9 sm:text-lg"
            style={{ "--t": "1.05s" } as CSSProperties}
          >
            Un toque cambia el tono y los acordes se reescriben al momento.
          </p>
        </div>

        {/* La hoja de cifrado que se reescribe sola. */}
        <div aria-hidden="true" className="hero-hoja-entrada relative mx-auto w-full sm:max-w-md lg:max-w-none">
          {/* El pentagrama: la hoja se apoya en él. Sale de detrás de la tarjeta
              hacia la derecha y se apaga antes del título. Solo en escritorio
              (`lg:`), donde la hoja va al lado; en una columna no hay dónde
              ponerlo sin cruzar el texto. */}
          <div className="hero-pauta pointer-events-none absolute top-1/2 -right-[50vw] -left-14 hidden h-52 -translate-y-1/2 flex-col justify-between lg:flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="hero-pauta-linea"
                style={{ "--i": i } as CSSProperties}
              />
            ))}
          </div>
          <div className="hero-hoja rounded-sm border border-pauta bg-hoja p-4 shadow-hoja sm:p-6">
            <div className="flex items-center justify-between border-b border-pauta pb-2.5">
              <span className="directiva">{"{coro}"}</span>
              <span className="directiva flex items-center gap-1.5">
                {"{tono:"}
                <span
                  key={tono}
                  className="hero-tono inline-block min-w-[1.6ch] text-center font-semibold text-acorde"
                >
                  {pintarTono(tono)}
                </span>
                {"}"}
              </span>
            </div>

            <div key={tono} className="hero-cifrado pt-5 pb-1">
              <Cifrado cifrado={cifrado} />
            </div>

            {/* La escala cromática: la casilla activa salta de tono en tono. */}
            <div className="mt-4 grid grid-cols-12 gap-px overflow-hidden rounded-sm border border-pauta bg-pauta">
              {TONOS.map((t) => (
                <span
                  key={t}
                  className={`py-1.5 text-center font-mono text-[0.625rem] transition-[background-color,color,transform] duration-300 ease-out sm:text-[0.6875rem] ${
                    t === tono
                      ? "scale-110 bg-acorde font-semibold text-papel"
                      : t === TONO_ORIGINAL
                        ? "bg-hoja-alta text-tinta"
                        : "bg-hoja text-tinta-tenue"
                  }`}
                >
                  {pintarTono(t)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
