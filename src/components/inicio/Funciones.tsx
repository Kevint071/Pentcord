"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Cifrado } from "@/components/visor/Cifrado";
import { parsearChordPro, renderizar } from "@/domain/musica";
import type { ModoDeAcordes, Tono } from "@/domain/musica/tipos";

/**
 * Inicio · lo que PentCord hace además de transportar.
 *
 * La cabecera ya enseña el cambio de tono, así que aquí van las otras dos cosas
 * que distinguen al cancionero, cada una con su pequeña demostración que se
 * juega sola al entrar en pantalla:
 *
 * 1. Escribir: el acorde va entre corchetes, justo antes de la sílaba, y la
 *    vista previa lo pone encima de la letra mientras se escribe (RN-011).
 * 2. Leer en notas o en grados: los grados (`1`, `5`, `6m`) no dependen del
 *    tono, así que la misma progresión vale para cualquier instrumento (RN-004).
 *
 * Las dos demos son decorativas (`aria-hidden`): el texto de cada bloque dice lo
 * mismo. Solo arrancan cuando se ven (`IntersectionObserver`); sin esa API, o en
 * jsdom, se quedan en su estado final, completo y legible.
 */

const TONO_ORIGINAL: Tono = "C";

/** Lo que «se escribe» en la primera demo. */
const FUENTE = [
  "{verso}",
  "[C]Cuando salga el [G]sol sobre el [Am]valle",
  "[F]volveremos a [C]cantar",
].join("\n");

const CARACTER_MS = 55;
const PAUSA_MS = 3600;

/** La segunda demo: nunca cambia de canción, solo de tono y de modo. */
const CANCION = parsearChordPro(
  [
    "[C]Cuando salga el [G]sol sobre el [Am]valle",
    "[F]volveremos a [C]cantar",
  ].join("\n"),
);

const PASOS_DE_LECTURA: ReadonlyArray<{ tono: Tono; modo: ModoDeAcordes }> = [
  { tono: "C", modo: "notas" },
  { tono: "C", modo: "grados" },
  { tono: "G", modo: "notas" },
  { tono: "G", modo: "grados" },
];

const PASO_DE_LECTURA_MS = 2600;

/** Verdadero una vez que el elemento ha entrado en pantalla (y para siempre). */
function useEnVista<T extends Element>() {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setVisto(true);
        observador.disconnect();
      },
      { threshold: 0.35 },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return [ref, visto] as const;
}

/** Colorea lo escrito: `[acorde]` en azul de bolígrafo y `{directiva}` apagada. */
function Fuente({ texto }: { texto: string }) {
  const lineas = texto.split("\n");
  return (
    <>
      {lineas.map((linea, i) => (
        <div key={i} className="min-h-[1.6em] whitespace-pre-wrap wrap-break-word">
          {linea.split(/(\[[^\]]*\]?|\{[^}]*\}?)/).map((trozo, j) => {
            if (trozo.startsWith("[")) {
              return (
                <span key={j} className="font-semibold text-acorde">
                  {trozo}
                </span>
              );
            }
            if (trozo.startsWith("{")) {
              return (
                <span key={j} className="text-tinta-tenue">
                  {trozo}
                </span>
              );
            }
            return <span key={j}>{trozo}</span>;
          })}
          {i === lineas.length - 1 ? <span className="escribe-cursor" /> : null}
        </div>
      ))}
    </>
  );
}

/** El ChordPro a medias no es válido: se quita el corchete o la llave sin cerrar. */
function sinMediaEtiqueta(texto: string) {
  return texto.replace(/\[[^\]]*$/, "").replace(/\{[^}]*$/, "");
}

function DemoDeEscritura() {
  const [ref, enVista] = useEnVista<HTMLDivElement>();
  const [escritos, setEscritos] = useState(FUENTE.length);

  useEffect(() => {
    if (!enVista) return;

    let n = 0;
    let temporizador: number;
    const paso = () => {
      setEscritos(n);
      if (n < FUENTE.length) {
        n += 1;
        temporizador = window.setTimeout(paso, CARACTER_MS);
      } else {
        n = 0;
        temporizador = window.setTimeout(paso, PAUSA_MS);
      }
    };
    temporizador = window.setTimeout(paso, 0);
    return () => window.clearTimeout(temporizador);
  }, [enVista]);

  const escrito = FUENTE.slice(0, escritos);

  const cifrado = useMemo(
    () =>
      renderizar(parsearChordPro(sinMediaEtiqueta(escrito)), {
        tonoOriginal: TONO_ORIGINAL,
        tono: TONO_ORIGINAL,
        modo: "notas",
      }),
    [escrito],
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="rounded-sm border border-pauta bg-hoja p-4 shadow-hoja sm:p-6"
    >
      <p className="directiva">{"{lo que escribes}"}</p>
      <div className="mt-2.5 min-h-[6.6rem] rounded-sm border border-pauta bg-papel px-3.5 py-3 font-mono text-[0.8125rem] leading-[1.6] text-tinta sm:text-sm">
        <Fuente texto={escrito} />
      </div>

      <p className="directiva mt-5">{"{lo que se ve}"}</p>
      <div className="escribe-cifrado mt-3 min-h-30">
        <Cifrado cifrado={cifrado} />
      </div>
    </div>
  );
}

function pintarTono(tono: Tono) {
  return tono.replace("b", "♭").replace("#", "♯");
}

function DemoDeLectura() {
  const [ref, enVista] = useEnVista<HTMLDivElement>();
  const [paso, setPaso] = useState(1);

  useEffect(() => {
    if (!enVista) return;

    let n = 1;
    const temporizador = window.setInterval(() => {
      n = (n + 1) % PASOS_DE_LECTURA.length;
      setPaso(n);
    }, PASO_DE_LECTURA_MS);
    return () => window.clearInterval(temporizador);
  }, [enVista]);

  const { tono, modo } = PASOS_DE_LECTURA[paso];

  const cifrado = useMemo(
    () => renderizar(CANCION, { tonoOriginal: TONO_ORIGINAL, tono, modo }),
    [tono, modo],
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="rounded-sm border border-pauta bg-hoja p-4 shadow-hoja sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 border-b border-pauta pb-2.5">
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

        {/* Qué modo se está leyendo: la casilla activa cambia de color. */}
        <span className="flex overflow-hidden rounded-sm border border-pauta bg-pauta font-mono text-[0.6875rem] uppercase tracking-[0.12em]">
          {(["notas", "grados"] as const).map((m) => (
            <span
              key={m}
              className={`px-3 py-1.5 transition-colors duration-300 ${
                m === modo
                  ? "bg-acorde font-semibold text-papel"
                  : "bg-hoja text-tinta-tenue"
              }`}
            >
              {m}
            </span>
          ))}
        </span>
      </div>

      <div key={`${tono}-${modo}`} className="hero-cifrado pt-5 pb-1">
        <Cifrado cifrado={cifrado} />
      </div>

      <p className="directiva mt-4 border-t border-pauta pt-3">
        {modo === "grados"
          ? "los grados no cambian con el tono"
          : "las notas sí cambian con el tono"}
      </p>
    </div>
  );
}

function Bloque({
  etiqueta,
  titulo,
  children,
  demo,
  invertido = false,
}: {
  etiqueta: string;
  titulo: string;
  children: ReactNode;
  demo: ReactNode;
  invertido?: boolean;
}) {
  return (
    <div className="revela mx-auto grid w-full max-w-5xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16">
      <div className={invertido ? "lg:order-2" : undefined}>
        <p className="directiva">{etiqueta}</p>
        <h2 className="rotulo mt-3 text-[clamp(2rem,6vw,3rem)] leading-[1.1]! text-tinta">
          {titulo}
        </h2>
        <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-tinta-suave sm:text-base">
          {children}
        </p>
      </div>
      <div className={invertido ? "lg:order-1" : undefined}>{demo}</div>
    </div>
  );
}

export function Funciones() {
  return (
    <section data-suave className="border-t border-pauta">
      <Bloque
        etiqueta="{escribir}"
        titulo="Escribe el acorde donde cae"
        demo={<DemoDeEscritura />}
      >
        Pon el acorde entre corchetes, justo antes de la sílaba. La vista previa
        lo coloca encima de la letra mientras escribes, y desde ahí cualquiera
        lo toca en su tono.
      </Bloque>

      <div className="border-t border-pauta" />

      <Bloque
        etiqueta="{leer}"
        titulo="Notas o grados, como prefieras"
        demo={<DemoDeLectura />}
        invertido
      >
        Los grados (1, 4, 5, 6m) no dependen del tono: la misma progresión sirve
        para guitarra, bajo, voz o teclado. Con un toque vuelves a las notas.
      </Bloque>
    </section>
  );
}
