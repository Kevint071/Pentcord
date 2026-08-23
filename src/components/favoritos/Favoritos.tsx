"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Estado } from "@/generated/prisma/enums";
import { ErrorDeApi, mensajeDeError } from "@/lib/api/cliente";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Aviso } from "@/components/ui/Aviso";
import { BotonEnlace } from "@/components/ui/Boton";

/**
 * E.2 · Página de Favoritos (HU-07).
 *
 * RN-019: una versión que dejó de ser visible (eliminada) se excluye en
 * silencio, sin avisar — no es un error, es que ya no está.
 */

type FavoritoConVersion = {
  versionId: number;
  version: {
    id: number;
    tonoOriginal: string;
    estado: Estado;
    eliminadoEn: string | null;
    cancion: { id: number; titulo: string; artista: string };
  };
};

export function Favoritos() {
  const { usarApi } = useSesion();
  const [favoritos, setFavoritos] = useState<FavoritoConVersion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quitando, setQuitando] = useState<number | null>(null);

  useEffect(() => {
    let vigente = true;
    usarApi<FavoritoConVersion[]>("/favoritos")
      .then((datos) => {
        if (vigente) setFavoritos(datos);
      })
      .catch((causa) => {
        if (vigente) setError(mensajeDeError(causa));
      });
    return () => {
      vigente = false;
    };
  }, [usarApi]);

  async function quitar(versionId: number) {
    setQuitando(versionId);
    try {
      await usarApi("/favoritos", { method: "DELETE", cuerpo: { versionId } });
      setFavoritos((actual) =>
        (actual ?? []).filter((f) => f.versionId !== versionId),
      );
    } catch (causa) {
      if (!(causa instanceof ErrorDeApi)) setError(mensajeDeError(causa));
    } finally {
      setQuitando(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="directiva">{"{favoritos}"}</p>
      <h1 className="rotulo mt-3 text-[clamp(2rem,8vw,3.25rem)] text-tinta">
        Tus favoritos
      </h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-tinta-suave">
        Las versiones que guardaste, para abrirlas sin volver a buscarlas.
      </p>

      <div className="mt-6">
        {error ? <Aviso tono="alerta">{error}</Aviso> : null}

        {!error && favoritos === null ? (
          <p className="py-16 text-center text-sm text-tinta-suave">
            Cargando…
          </p>
        ) : null}

        {favoritos ? (
          (() => {
            const visibles = favoritos.filter((f) => f.version.eliminadoEn === null);

            if (visibles.length === 0) {
              return (
                <EstadoVacio
                  titulo="Aún no hay nada aquí"
                  descripcion="Cuando guardes una versión, aparecerá en esta lista para que la encuentres sin buscarla de nuevo."
                  accion={<BotonEnlace href="/">Buscar canciones</BotonEnlace>}
                />
              );
            }

            return (
              <ul className="grid gap-2">
                {visibles.map(({ versionId, version }) => (
                  <li key={versionId}>
                    <div className="group flex items-center gap-4 rounded-xl border border-pauta bg-hoja px-4 py-3.5 transition-colors hover:border-acorde-borde hover:bg-hoja-alta">
                      <Link
                        href={`/versiones/${versionId}`}
                        className="grid size-12 shrink-0 place-items-center rounded-lg border border-acorde-borde bg-acorde-suave"
                      >
                        <span className="rotulo text-xl text-acorde">
                          {version.tonoOriginal}
                        </span>
                      </Link>

                      <Link href={`/versiones/${versionId}`} className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-tinta">
                          {version.cancion.titulo}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[0.8125rem] text-tinta-suave">
                          {version.cancion.artista}
                        </span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => quitar(versionId)}
                        disabled={quitando === versionId}
                        className="shrink-0 rounded-full px-3 py-1.5 font-mono text-[0.75rem] text-tinta-tenue transition-colors hover:bg-alerta-suave hover:text-alerta disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {quitando === versionId ? "quitando…" : "quitar"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            );
          })()
        ) : null}
      </div>
    </div>
  );
}
