"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { mensajeDeError, pedirApi } from "@/lib/api/cliente";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Aviso } from "@/components/ui/Aviso";
import {
  Contenedor,
  Encabezamiento,
  MarcoDeBusqueda,
  Muestra,
} from "./piezas";

/**
 * D.1 · Buscador de canciones (HU-02).
 *
 * El término y la página viven en la URL, así que el botón "atrás" del
 * navegador funciona, un resultado se puede compartir, y al volver de una
 * canción la búsqueda sigue donde estaba.
 *
 * `autoresSugeridos` (lo que ya devuelve `GET /canciones` cuando no se filtra
 * por autor) se usa como fichas para acotar: en un teléfono es más útil que un
 * desplegable de autocompletado, y resuelve el caso real de dos canciones con
 * el mismo título de artistas distintos.
 */

type Cancion = { id: number; titulo: string; artista: string };

type RespuestaDeBusqueda = {
  data: Cancion[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  autoresSugeridos?: string[];
};

/** Lo recibido, atado a la búsqueda que lo pidió. */
type Resultado = {
  clave: string;
  datos?: RespuestaDeBusqueda;
  error?: string;
};

const RETARDO_DE_TECLEO = 350;

export function Buscador() {
  const router = useRouter();
  const parametros = useSearchParams();

  const termino = parametros.get("q") ?? "";
  const autor = parametros.get("autor") ?? "";
  const pagina = Number(parametros.get("page") ?? "1") || 1;

  const [textoEscrito, setTextoEscrito] = useState(termino);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  // Mientras el usuario escribe manda la caja de texto. Cuando el término
  // cambia desde fuera (atrás/adelante, o una ficha de artista) se reajusta
  // durante el render, que es más barato que un efecto y no encadena pintados.
  const [terminoPintado, setTerminoPintado] = useState(termino);
  if (termino !== terminoPintado) {
    setTerminoPintado(termino);
    setTextoEscrito(termino);
  }

  const irA = useCallback(
    (siguiente: { q?: string; autor?: string; page?: number }) => {
      const query = new URLSearchParams();
      const q = siguiente.q ?? termino;
      const a = siguiente.autor ?? autor;
      const p = siguiente.page ?? 1;

      if (q) query.set("q", q);
      if (a) query.set("autor", a);
      if (p > 1) query.set("page", String(p));

      const cadena = query.toString();
      router.replace(cadena ? `/?${cadena}` : "/", { scroll: false });
    },
    [router, termino, autor],
  );

  // Rebote del tecleo: una petición cuando el usuario para, no una por letra.
  useEffect(() => {
    if (textoEscrito === termino) return;
    const temporizador = setTimeout(
      () => irA({ q: textoEscrito, page: 1 }),
      RETARDO_DE_TECLEO,
    );
    return () => clearTimeout(temporizador);
  }, [textoEscrito, termino, irA]);

  const hayBusqueda = termino !== "" || autor !== "";
  const clave = `${termino}|${autor}|${pagina}`;

  // Solo la última búsqueda pintada gana, aunque llegue antes una anterior.
  const peticion = useRef(0);

  useEffect(() => {
    if (!hayBusqueda) return;

    const actual = ++peticion.current;

    pedirApi<RespuestaDeBusqueda>("/canciones", {
      parametros: {
        titulo: termino || undefined,
        autor: autor || undefined,
        page: pagina,
        limit: 9,
      },
    })
      .then((datos) => {
        if (actual === peticion.current) setResultado({ clave, datos });
      })
      .catch((causa) => {
        if (actual === peticion.current) {
          setResultado({ clave, error: mensajeDeError(causa) });
        }
      });
  }, [clave, termino, autor, pagina, hayBusqueda]);

  // Lo recibido solo se pinta si corresponde a la búsqueda actual: así no se
  // enseñan por un instante los resultados de la búsqueda anterior.
  const vigente = resultado?.clave === clave ? resultado : null;
  const cargando = hayBusqueda && vigente === null;
  const respuesta = vigente?.datos ?? null;
  const sugerencias = respuesta?.autoresSugeridos ?? [];

  return (
    <Contenedor>
      <section className="pt-10 pb-8 sm:pt-16">
        <Encabezamiento />

        <form
          role="search"
          onSubmit={(evento) => {
            evento.preventDefault();
            irA({ q: textoEscrito, page: 1 });
          }}
          className="mt-7"
        >
          <label htmlFor="busqueda" className="sr-only">
            Buscar por título o artista
          </label>
          <MarcoDeBusqueda>
            <input
              id="busqueda"
              type="search"
              value={textoEscrito}
              onChange={(evento) => setTextoEscrito(evento.target.value)}
              placeholder="Título o artista"
              autoComplete="off"
              className="w-full bg-transparent text-base text-tinta outline-none placeholder:text-tinta-tenue"
            />
          </MarcoDeBusqueda>
        </form>

        {/* Fichas de artista: acotan cuando varios artistas comparten título. */}
        {sugerencias.length > 1 || autor ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="directiva">{"{artista}"}</span>
            {autor ? (
              <button
                type="button"
                onClick={() => irA({ autor: "", page: 1 })}
                className="inline-flex items-center gap-1.5 rounded-full border border-acorde-borde bg-acorde-suave px-3 py-1 text-sm font-medium text-acorde"
              >
                {autor}
                <span aria-hidden="true">×</span>
                <span className="sr-only">Quitar el filtro de artista</span>
              </button>
            ) : (
              sugerencias.slice(0, 6).map((nombre) => (
                <button
                  key={nombre}
                  type="button"
                  onClick={() => irA({ autor: nombre, page: 1 })}
                  className="rounded-full border border-pauta-fuerte px-3 py-1 text-sm text-tinta-suave transition-colors hover:border-tinta-tenue hover:text-tinta"
                >
                  {nombre}
                </button>
              ))
            )}
          </div>
        ) : null}

        {!hayBusqueda ? <Muestra /> : null}
      </section>

      {hayBusqueda ? (
        <section aria-live="polite" aria-busy={cargando} className="pb-4">
          {vigente?.error ? (
            <Aviso tono="alerta">{vigente.error}</Aviso>
          ) : cargando ? (
            <p className="py-10 text-center text-sm text-tinta-suave">
              Buscando…
            </p>
          ) : respuesta && respuesta.data.length === 0 ? (
            <EstadoVacio
              titulo="Sin resultados"
              descripcion={
                autor
                  ? `No hay canciones de ${autor} que coincidan. Prueba con otro título o quita el filtro de artista.`
                  : "Prueba con otra palabra del título o con el nombre del artista."
              }
            />
          ) : respuesta ? (
            <>
              <p className="directiva mb-3">
                {respuesta.pagination.total}{" "}
                {respuesta.pagination.total === 1 ? "canción" : "canciones"}
              </p>

              <ul className="grid gap-2">
                {respuesta.data.map((cancion) => (
                  <li key={cancion.id}>
                    <Link
                      href={`/canciones/${cancion.id}`}
                      className="group flex items-center gap-4 rounded-xl border border-pauta bg-hoja px-4 py-3.5 transition-colors hover:border-acorde-borde hover:bg-hoja-alta"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-tinta">
                          {cancion.titulo}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[0.8125rem] text-tinta-suave">
                          {cancion.artista}
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
                ))}
              </ul>

              <Paginacion
                pagina={respuesta.pagination.page}
                total={respuesta.pagination.totalPages}
                onIr={(destino) => irA({ page: destino })}
              />
            </>
          ) : null}
        </section>
      ) : null}
    </Contenedor>
  );
}

function Paginacion({
  pagina,
  total,
  onIr,
}: {
  pagina: number;
  total: number;
  onIr: (pagina: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <nav
      aria-label="Páginas de resultados"
      className="mt-5 flex items-center justify-between gap-4"
    >
      <button
        type="button"
        onClick={() => onIr(pagina - 1)}
        disabled={pagina <= 1}
        className="rounded-full border border-pauta-fuerte px-4 py-1.5 text-sm text-tinta transition-colors enabled:hover:border-tinta-tenue disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="font-mono text-[0.8125rem] text-tinta-suave">
        {pagina} / {total}
      </span>
      <button
        type="button"
        onClick={() => onIr(pagina + 1)}
        disabled={pagina >= total}
        className="rounded-full border border-pauta-fuerte px-4 py-1.5 text-sm text-tinta transition-colors enabled:hover:border-tinta-tenue disabled:opacity-40"
      >
        Siguiente
      </button>
    </nav>
  );
}
