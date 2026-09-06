"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pedirApi } from "@/lib/api/cliente";
import { FilaDeCancion } from "@/components/buscador/piezas";

/**
 * Portada · el catálogo, debajo del buscador.
 *
 * Es la respuesta a "no sé qué escribir": canciones que existen de verdad y los
 * artistas que hay dentro, a un toque. Sale de la misma llamada que ya usa el
 * buscador (`GET /canciones` sin filtro devuelve la primera página **y**
 * `autoresSugeridos` con todos los artistas), así que no hace falta ningún
 * endpoint nuevo.
 *
 * Si la llamada falla, la sección no se pinta: la portada nunca depende de la
 * red para ser usable — el buscador ya está arriba.
 */

const CUANTAS = 5;
const CUANTOS_ARTISTAS = 8;

type Cancion = { id: number; titulo: string; artista: string };

type Respuesta = {
  data: Cancion[];
  pagination: { total: number };
  autoresSugeridos?: string[];
};

export function Catalogo() {
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    pedirApi<Respuesta>("/canciones", { parametros: { limit: CUANTAS } })
      .then((datos) => {
        if (vigente) setRespuesta(datos);
      })
      .catch(() => {
        if (vigente) setFallo(true);
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (fallo || !respuesta) return null;

  const canciones = respuesta.data;
  const artistas = respuesta.autoresSugeridos ?? [];
  const total = respuesta.pagination.total;

  if (total === 0) {
    return (
      <section className="border-t border-pauta py-10">
        <h2 className="rotulo text-2xl text-tinta">Todavía no hay canciones</h2>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-tinta-suave">
          El catálogo lo escriben los músicos que lo usan. La primera canción
          puede ser la tuya.
        </p>
      </section>
    );
  }

  return (
    <section className="border-t border-pauta py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="rotulo text-2xl text-tinta">Abre una canción</h2>
        <p className="font-mono text-[0.8125rem] text-tinta-suave">
          {total} {total === 1 ? "canción" : "canciones"} de {artistas.length}{" "}
          {artistas.length === 1 ? "artista" : "artistas"}
        </p>
      </div>

      <ul className="mt-4 divide-y divide-pauta border-t border-pauta">
        {canciones.map((cancion) => (
          <FilaDeCancion key={cancion.id} {...cancion} />
        ))}
      </ul>

      {artistas.length > 1 ? (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="directiva">{"{artista}"}</span>
          {artistas.slice(0, CUANTOS_ARTISTAS).map((nombre) => (
            <Link
              key={nombre}
              href={`/?autor=${encodeURIComponent(nombre)}`}
              className="rounded-full border border-pauta-fuerte px-3 py-1 text-sm text-tinta-suave transition-colors hover:border-tinta-tenue hover:text-tinta"
            >
              {nombre}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
