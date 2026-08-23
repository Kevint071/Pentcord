"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ModoDeAcordes, Tono } from "@/domain/musica/tipos";
import { Cifrado, contarNoReconocidos } from "./Cifrado";
import { ConmutadorDeModo } from "./ConmutadorDeModo";
import { SelectorDeTono, etiquetaDeDistancia } from "./SelectorDeTono";
import { BotonDeFavorito } from "@/components/favoritos/BotonDeFavorito";
import {
  VERSION_DE_MAQUETA,
  renderizarMaqueta,
} from "@/lib/demo/cifradoDeMaqueta";

/**
 * D.3 · Visor de versión (HU-04, HU-05, HU-06).
 *
 * ⚠️ Maqueta: el contenido sale de `src/lib/demo/cifradoDeMaqueta.ts`, no de la
 * API. El Bloque A (dominio musical) todavía no existe, así que ni el parser de
 * ChordPro ni el transportador ni el conversor a grados son reales. Lo que sí
 * es definitivo es la pantalla y el contrato que consume
 * (`src/domain/musica/tipos.ts`): cuando A aterrice, se cambia el origen de
 * `cifrado` y nada más.
 *
 * Lo que la pantalla ya cumple:
 * - Nunca enseña ChordPro crudo; pinta segmentos posicionados (RN-009b).
 * - El cambio de tono es un recálculo local, sin red (HU-05).
 * - Notas ↔ grados es relativo al tono que está en pantalla (RN-004).
 * - Un acorde no reconocido se marca en su sitio sin romper el resto (RN-005).
 */
export function Visor({ versionId }: { versionId: string }) {
  const tonoOriginal = VERSION_DE_MAQUETA.tonoOriginal;
  const [tono, setTono] = useState<Tono>(tonoOriginal);
  const [modo, setModo] = useState<ModoDeAcordes>("notas");

  const cifrado = useMemo(() => renderizarMaqueta(tono, modo), [tono, modo]);
  const noReconocidos = useMemo(() => contarNoReconocidos(cifrado), [cifrado]);

  const transportada = tono !== tonoOriginal;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
      <div className="pt-6 sm:pt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-tinta-suave transition-colors hover:text-tinta"
        >
          <span aria-hidden="true">←</span> Buscar
        </Link>

        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="rotulo text-[clamp(2rem,8vw,3.25rem)] text-tinta">
              {VERSION_DE_MAQUETA.titulo}
            </h1>
            <p className="mt-1 font-mono text-sm text-tinta-suave">
              {VERSION_DE_MAQUETA.artista} · tono original {tonoOriginal}
            </p>
          </div>
          <BotonDeFavorito versionId={Number(versionId)} />
        </header>
      </div>

      {/* Consola de lectura. Se queda pegada bajo el encabezado para poder
          cambiar de tono a mitad de canción sin volver arriba. */}
      <div className="sticky top-14 z-20 -mx-4 mt-5 border-y border-pauta bg-papel/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="directiva">{"{tono}"}</p>
          <div className="flex items-center gap-3">
            <span
              aria-live="polite"
              className={`font-mono text-[0.8125rem] ${
                transportada ? "text-acorde" : "text-tinta-suave"
              }`}
            >
              {etiquetaDeDistancia(tonoOriginal, tono)}
            </span>
            {transportada ? (
              <button
                type="button"
                onClick={() => setTono(tonoOriginal)}
                className="rounded-full border border-pauta-fuerte px-2.5 py-0.5 font-mono text-[0.6875rem] text-tinta-suave transition-colors hover:border-tinta-tenue hover:text-tinta"
              >
                volver a {tonoOriginal}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-2">
          <SelectorDeTono
            tonoActivo={tono}
            tonoOriginal={tonoOriginal}
            onCambiar={setTono}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <ConmutadorDeModo modo={modo} onCambiar={setModo} />
          <p className="hidden text-[0.8125rem] text-tinta-tenue sm:block">
            Flechas ← → para moverte de semitono en semitono
          </p>
        </div>
      </div>

      <AvisoDeMaqueta versionId={versionId} />

      {noReconocidos > 0 ? (
        <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-alerta">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          >
            <path
              d="M12 8v5M12 16.2v.1M12 3.5 21 19H3z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            {noReconocidos === 1
              ? "Un acorde no está entre los tipos que PentCord reconoce"
              : `${noReconocidos} acordes no están entre los tipos que PentCord reconoce`}
            . Se muestran tal y como los escribió quien aportó la versión, y no
            cambian al transportar.
          </span>
        </p>
      ) : null}

      <article className="mt-6 pb-10">
        <Cifrado cifrado={cifrado} />
      </article>
    </div>
  );
}

function AvisoDeMaqueta({ versionId }: { versionId: string }) {
  return (
    <p className="mt-5 rounded-lg border border-dashed border-pauta-fuerte px-3 py-2.5 text-sm leading-relaxed text-tinta-suave">
      <span className="directiva mr-2">{"{maqueta}"}</span>
      Esta pantalla todavía no lee la versión {versionId} de la base de datos:
      muestra una canción de ejemplo. El motor musical (Bloque A) es lo que falta
      para leer el ChordPro real, transportarlo con la ortografía correcta de
      cada tonalidad y convertirlo a grados.
    </p>
  );
}
