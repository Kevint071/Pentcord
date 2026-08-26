"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Estado } from "@/generated/prisma/enums";
import { parsearChordPro, renderizar } from "@/domain/musica";
import type { ModoDeAcordes, Tono } from "@/domain/musica";
import { Cifrado, contarNoReconocidos } from "./Cifrado";
import { ConmutadorDeModo } from "./ConmutadorDeModo";
import { SelectorDeTono, etiquetaDeDistancia } from "./SelectorDeTono";
import { BotonDeFavorito } from "@/components/favoritos/BotonDeFavorito";
import { ErrorDeApi, mensajeDeError, pedirApi } from "@/lib/api/cliente";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Aviso } from "@/components/ui/Aviso";
import { BotonEnlace } from "@/components/ui/Boton";

/**
 * D.3 · Visor de versión (HU-04, HU-05, HU-06).
 *
 * Lee la versión real de `GET /versiones/{id}` y la pasa por el dominio
 * musical (Bloque A): `parsearChordPro` interpreta el ChordPro guardado y
 * `renderizar` lo transporta y convierte a grados, ya con la ortografía que
 * corresponde a cada tonalidad. El selector de tono y el conmutador
 * notas/grados solo cambian qué se le pide a `renderizar`; no hay red de por
 * medio (HU-05), es el mismo recálculo local que usaba la maqueta.
 *
 * Lo que la pantalla ya cumple:
 * - Nunca enseña ChordPro crudo; pinta segmentos posicionados (RN-009b).
 * - El cambio de tono es un recálculo local, sin red (HU-05).
 * - Notas ↔ grados es relativo al tono que está en pantalla (RN-004).
 * - Un acorde no reconocido se marca en su sitio sin romper el resto (RN-005).
 */

type VersionDelVisor = {
  id: number;
  autorId: number;
  estado: Estado;
  tonoOriginal: Tono;
  contenidoChordpro: string;
  cancion: { id: number; titulo: string; artista: string };
};

export function Visor({ versionId }: { versionId: string }) {
  const [version, setVersion] = useState<VersionDelVisor | null>(null);
  const [tono, setTono] = useState<Tono | null>(null);
  const [modo, setModo] = useState<ModoDeAcordes>("notas");
  const [error, setError] = useState<string | null>(null);
  const [noExiste, setNoExiste] = useState(false);

  useEffect(() => {
    let vigente = true;

    pedirApi<{ data: VersionDelVisor }>(`/versiones/${versionId}`)
      .then((respuesta) => {
        if (!vigente) return;
        setVersion(respuesta.data);
        setTono(respuesta.data.tonoOriginal);
      })
      .catch((causa) => {
        if (!vigente) return;
        if (causa instanceof ErrorDeApi && causa.code === "NOT_FOUND") {
          setNoExiste(true);
          return;
        }
        setError(mensajeDeError(causa));
      });

    return () => {
      vigente = false;
    };
  }, [versionId]);

  const documento = useMemo(
    () => (version ? parsearChordPro(version.contenidoChordpro) : null),
    [version],
  );

  const tonoOriginal = version?.tonoOriginal ?? null;

  const cifrado = useMemo(() => {
    if (!documento || !tonoOriginal || !tono) return null;
    return renderizar(documento, { tonoOriginal, tono, modo });
  }, [documento, tonoOriginal, tono, modo]);

  const noReconocidos = useMemo(
    () => (cifrado ? contarNoReconocidos(cifrado) : 0),
    [cifrado],
  );

  if (noExiste) {
    return (
      <Contenedor>
        <EstadoVacio
          titulo="Esta versión no está"
          descripcion="Puede que se haya retirado del catálogo o que el enlace esté mal."
          accion={<BotonEnlace href="/">Volver a buscar</BotonEnlace>}
        />
      </Contenedor>
    );
  }

  if (error) {
    return (
      <Contenedor>
        <Aviso tono="alerta">{error}</Aviso>
      </Contenedor>
    );
  }

  if (!version || !tono || !tonoOriginal || !cifrado) {
    return (
      <Contenedor>
        <p className="py-16 text-center text-sm text-tinta-suave">
          Cargando…
        </p>
      </Contenedor>
    );
  }

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
              {version.cancion.titulo}
            </h1>
            <p className="mt-1 font-mono text-sm text-tinta-suave">
              {version.cancion.artista} · tono original {tonoOriginal}
            </p>
          </div>
          <BotonDeFavorito versionId={version.id} />
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

function Contenedor({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6 sm:pt-10">
      {children}
    </div>
  );
}
