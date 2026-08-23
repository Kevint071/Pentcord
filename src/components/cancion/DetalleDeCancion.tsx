"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Estado } from "@/generated/prisma/enums";
import { ErrorDeApi, mensajeDeError, pedirApi } from "@/lib/api/cliente";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { EtiquetaDeEstado } from "@/components/ui/EtiquetaDeEstado";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Aviso } from "@/components/ui/Aviso";
import { BotonEnlace } from "@/components/ui/Boton";

/**
 * D.2 · Detalle de canción (HU-03).
 *
 * Lista las versiones visibles: las verificadas para todo el mundo, más las
 * propias en cualquier estado, cada una con su etiqueta.
 *
 * El filtro se aplica aquí porque `GET /canciones/{id}` todavía devuelve todas
 * las versiones no eliminadas sin filtrar por estado ni autor. Esto es una
 * cortesía de la interfaz, **no** el arreglo de RN-015: mientras el servidor
 * no filtre, cualquiera puede leer una versión pendiente ajena llamando a la
 * API directamente. La tarea sigue viva en el Bloque B.3.
 */

type Version = {
  id: number;
  autorId: number;
  tonoOriginal: string;
  estado: Estado;
  creadoEn: string;
};

type Cancion = {
  id: number;
  titulo: string;
  artista: string;
  versiones: Version[];
};

const FECHA = new Intl.DateTimeFormat("es", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function DetalleDeCancion({ id }: { id: string }) {
  const { usuario } = useSesion();
  const [cancion, setCancion] = useState<Cancion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noExiste, setNoExiste] = useState(false);

  useEffect(() => {
    let vigente = true;

    pedirApi<{ data: Cancion }>(`/canciones/${id}`)
      .then((respuesta) => {
        if (vigente) setCancion(respuesta.data);
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
  }, [id]);

  if (noExiste) {
    return (
      <Contenedor>
        <EstadoVacio
          titulo="Esta canción no está"
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

  if (!cancion) {
    return (
      <Contenedor>
        <p className="py-16 text-center text-sm text-tinta-suave">Cargando…</p>
      </Contenedor>
    );
  }

  const visibles = cancion.versiones.filter(
    (version) =>
      version.estado === "verificada" ||
      (usuario !== null && version.autorId === usuario.id),
  );

  return (
    <Contenedor>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-tinta-suave transition-colors hover:text-tinta"
      >
        <span aria-hidden="true">←</span> Buscar
      </Link>

      <header className="mt-4 border-b border-pauta pb-6">
        <h1 className="rotulo text-[clamp(2rem,8vw,3.25rem)] text-tinta">
          {cancion.titulo}
        </h1>
        <p className="mt-1 font-mono text-sm text-tinta-suave">
          {cancion.artista}
        </p>
      </header>

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <p className="directiva">{"{versiones}"}</p>
          <p className="font-mono text-[0.8125rem] text-tinta-suave">
            {visibles.length}{" "}
            {visibles.length === 1 ? "disponible" : "disponibles"}
          </p>
        </div>

        {visibles.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no hay versiones"
            descripcion="Nadie ha aportado una versión verificada de esta canción. Puedes ser el primero."
            accion={
              <BotonEnlace href={`/aportar?cancion=${cancion.id}`}>
                Aportar una versión
              </BotonEnlace>
            }
          />
        ) : (
          <>
            <ul className="grid gap-2">
              {visibles.map((version, indice) => {
                const esMia = usuario !== null && version.autorId === usuario.id;
                return (
                  <li key={version.id}>
                    <Link
                      href={`/versiones/${version.id}`}
                      className="group flex items-center gap-4 rounded-xl border border-pauta bg-hoja px-4 py-3.5 transition-colors hover:border-acorde-borde hover:bg-hoja-alta"
                    >
                      {/* Lo primero que pregunta un músico: en qué tono está. */}
                      <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-acorde-borde bg-acorde-suave">
                        <span className="rotulo text-xl text-acorde">
                          {version.tonoOriginal}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-tinta">
                          Versión {indice + 1}
                          {esMia ? (
                            <span className="ml-2 font-mono text-[0.6875rem] font-normal tracking-wide text-tinta-tenue">
                              tuya
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[0.8125rem] text-tinta-suave">
                            {FECHA.format(new Date(version.creadoEn))}
                          </span>
                          {/* La etiqueta solo aporta información en las
                              propias: las ajenas siempre están verificadas. */}
                          {esMia ? (
                            <EtiquetaDeEstado estado={version.estado} />
                          ) : null}
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
              })}
            </ul>

            <div className="mt-5">
              <BotonEnlace
                href={`/aportar?cancion=${cancion.id}`}
                variante="secundario"
              >
                Aportar otra versión
              </BotonEnlace>
            </div>
          </>
        )}
      </section>
    </Contenedor>
  );
}

function Contenedor({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6 sm:pt-10">
      {children}
    </div>
  );
}
