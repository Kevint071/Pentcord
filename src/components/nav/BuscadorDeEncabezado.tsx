"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconoBuscar } from "./iconos";

/**
 * Búsqueda del encabezado: atajo a `/buscar?q=…` desde cualquier pantalla.
 *
 * No busca por sí misma (no hay resultados aquí): al enviar lleva a la pantalla
 * de Buscar con el término ya puesto, que es quien pagina y filtra. Por eso el
 * `Encabezado` no la pinta en `/buscar`, donde ya está el campo grande.
 *
 * Dos formas con un solo `<form>`:
 * - **md+**: píldora fija entre la marca y el riel, con la misma "caja de
 *   pauta" del buscador grande (borde que se vuelve acorde al enfocar y halo
 *   suave). Una tecla `/` a la derecha anuncia el atajo y se apaga al escribir.
 * - **móvil**: el campo se esconde y queda una lupa (`BotonDeBuscar`) junto al
 *   avatar. Pulsarla despliega el campo a ancho completo bajo la marca y lo
 *   enfoca; `Esc` o volver a pulsarla lo cierra. Dos líneas de encabezado ya
 *   pesan bastante en 360 px como para tener el campo siempre abierto.
 *
 * El estado de «desplegado» lo lleva el `Encabezado`, porque el campo y la lupa
 * cuelgan de sitios distintos del encabezado.
 */

export const ID_BUSCADOR = "buscador-encabezado";

export function BuscadorDeEncabezado({
  abierto,
  onCambiar,
}: {
  abierto: boolean;
  onCambiar: (abierto: boolean) => void;
}) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");

  // Al desplegarlo se enfoca. Va en un efecto porque hasta el pintado el campo
  // era `hidden` y no admite foco.
  useEffect(() => {
    if (abierto) entrada.current?.focus();
  }, [abierto]);

  // Atajo `/`: enfoca el campo, salvo que ya se esté escribiendo en otro.
  useEffect(() => {
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key !== "/" || evento.metaKey || evento.ctrlKey || evento.altKey) return;
      const objetivo = evento.target as HTMLElement | null;
      if (objetivo?.closest("input, textarea, select, [contenteditable='true']")) return;

      evento.preventDefault();
      onCambiar(true);
      entrada.current?.focus();
    }
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [onCambiar]);

  function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    const termino = texto.trim();
    router.push(termino ? `/buscar?q=${encodeURIComponent(termino)}` : "/buscar");
    onCambiar(false);
    entrada.current?.blur();
  }

  return (
    <form
      id={ID_BUSCADOR}
      role="search"
      aria-label="Buscar canciones"
      onSubmit={alEnviar}
      onKeyDown={(evento) => {
        if (evento.key === "Escape") {
          onCambiar(false);
          entrada.current?.blur();
        }
      }}
      className={`order-5 basis-full pb-2.5 md:order-0 md:flex md:max-w-sm md:flex-1 md:basis-auto md:pb-0 ${
        abierto ? "flex" : "hidden"
      }`}
    >
      <label htmlFor="buscar-encabezado" className="sr-only">
        Buscar por título o artista
      </label>
      <div className="group/buscar flex h-10 w-full items-center gap-2.5 rounded-full border border-pauta-fuerte bg-hoja pr-3 pl-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-acorde focus-within:shadow-[0_0_0_3px_var(--color-acorde-suave)] hover:border-tinta-tenue md:h-9">
        <IconoBuscar className="size-4.5 shrink-0 text-tinta-tenue transition-colors group-focus-within/buscar:text-acorde" />
        <input
          ref={entrada}
          id="buscar-encabezado"
          type="search"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Buscar canción o artista"
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-medium text-tinta outline-none placeholder:font-normal placeholder:text-tinta-tenue focus-visible:outline-none"
        />
        {texto === "" ? (
          <kbd
            aria-hidden="true"
            className="hidden rounded-sm border border-pauta-fuerte px-1.5 font-mono text-[0.6875rem] leading-5 text-tinta-tenue transition-opacity group-focus-within/buscar:opacity-0 md:block"
          >
            /
          </kbd>
        ) : null}
      </div>
    </form>
  );
}

/** La lupa de móvil: despliega o recoge el campo. Desde `md` no se pinta. */
export function BotonDeBuscar({
  abierto,
  onAlternar,
}: {
  abierto: boolean;
  onAlternar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-expanded={abierto}
      aria-controls={ID_BUSCADOR}
      aria-label="Buscar"
      className={`flex size-9 items-center justify-center rounded-full border transition-colors md:hidden ${
        abierto
          ? "border-acorde-borde bg-acorde-suave text-acorde"
          : "border-pauta-fuerte text-tinta-suave hover:border-tinta-tenue hover:text-tinta"
      }`}
    >
      <IconoBuscar className="size-4.5" />
    </button>
  );
}
