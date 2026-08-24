"use client";

import { useMemo } from "react";
import { renderizar } from "@/domain/musica";
import type { DocumentoChordPro, ErrorDeSintaxis, Tono } from "@/domain/musica";
import { Cifrado } from "@/components/visor/Cifrado";
import { separarErrores } from "./errores";

/**
 * E.3 · Vista previa del aporte (RN-011, RN-012, RN-013).
 *
 * Es la misma pantalla que verá el músico: el mismo renderizador del dominio
 * (A.6) y el mismo componente que usa el visor (D.3). Nunca se enseña el
 * ChordPro crudo aquí tampoco — el ChordPro está en el textarea de al lado, que
 * es donde se escribe.
 *
 * RN-013 pide señalar el error **en el punto exacto sin romper ni congelar la
 * vista previa**. Por eso el parser nunca lanza (A.3): mientras se teclea un
 * acorde a medio escribir, la línea sigue pintándose, marcada, y la lista de
 * abajo lleva a la línea y columna donde está el problema.
 */
export function VistaPrevia({
  documento,
  tono,
  vacia,
  onIrAlPunto,
}: {
  documento: DocumentoChordPro;
  tono: Tono;
  /** Sin nada escrito todavía: se explica qué va a aparecer aquí. */
  vacia: boolean;
  onIrAlPunto: (linea: number, columna: number) => void;
}) {
  // El tono de la vista previa **es** el original: no hay transporte todavía,
  // pero sí ortografía de la tonalidad (en Eb un `C#` se pinta `Db`).
  const cifrado = useMemo(
    () => renderizar(documento, { tonoOriginal: tono, tono, modo: "notas" }),
    [documento, tono],
  );

  const { bloqueantes, avisos } = useMemo(
    () => separarErrores(documento.errores),
    [documento],
  );

  const lineasConError = useMemo(
    () => new Set(bloqueantes.map((error) => error.linea)),
    [bloqueantes],
  );

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="directiva">{"{vista previa}"}</p>
        <p className="font-mono text-[0.8125rem] text-tinta-suave">
          tono {tono}
        </p>
      </div>

      <div className="rounded-xl border border-pauta bg-hoja px-4 py-4 sm:px-5">
        {vacia ? (
          <p className="py-8 text-center text-sm leading-relaxed text-tinta-suave">
            Aquí vas viendo la canción como la va a leer quien la toque: los
            acordes encima de la sílaba en la que entran.
          </p>
        ) : (
          <Cifrado cifrado={cifrado} lineasConError={lineasConError} />
        )}
      </div>

      {bloqueantes.length > 0 ? (
        <ListaDeErrores
          id="errores-de-sintaxis"
          tono="alerta"
          titulo={
            bloqueantes.length === 1
              ? "Hay 1 error que corregir antes de guardar"
              : `Hay ${bloqueantes.length} errores que corregir antes de guardar`
          }
          errores={bloqueantes}
          onIrAlPunto={onIrAlPunto}
        />
      ) : null}

      {avisos.length > 0 ? (
        <ListaDeErrores
          id="acordes-no-reconocidos"
          tono="neutro"
          titulo={
            avisos.length === 1
              ? "1 acorde que PentCord no sabe transportar"
              : `${avisos.length} acordes que PentCord no sabe transportar`
          }
          nota="Se guardan y se muestran tal y como los escribas, pero no cambian al transportar la canción. Puedes guardar igualmente."
          errores={avisos}
          onIrAlPunto={onIrAlPunto}
        />
      ) : null}
    </div>
  );
}

function ListaDeErrores({
  id,
  tono,
  titulo,
  nota,
  errores,
  onIrAlPunto,
}: {
  id: string;
  tono: "alerta" | "neutro";
  titulo: string;
  nota?: string;
  errores: ErrorDeSintaxis[];
  onIrAlPunto: (linea: number, columna: number) => void;
}) {
  const esAlerta = tono === "alerta";

  return (
    <section
      id={id}
      className={`mt-4 rounded-xl border px-4 py-3.5 ${
        esAlerta
          ? "border-alerta/40 bg-alerta-suave"
          : "border-pauta-fuerte bg-hoja"
      }`}
    >
      <p
        className={`text-sm font-medium ${esAlerta ? "text-alerta" : "text-tinta"}`}
      >
        {titulo}
      </p>
      {nota ? (
        <p className="mt-1 text-xs leading-relaxed text-tinta-suave">{nota}</p>
      ) : null}

      <ul className="mt-2.5 grid gap-1.5">
        {errores.map((error, indice) => (
          <li key={`${error.linea}-${error.columna}-${indice}`}>
            <button
              type="button"
              onClick={() => onIrAlPunto(error.linea, error.columna)}
              className="flex w-full items-baseline gap-2.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-papel"
            >
              <span
                className={`shrink-0 font-mono text-[0.6875rem] ${
                  esAlerta ? "text-alerta" : "text-tinta-tenue"
                }`}
              >
                {error.linea}:{error.columna}
              </span>
              <span className="text-sm leading-snug text-tinta">
                {error.mensaje}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
