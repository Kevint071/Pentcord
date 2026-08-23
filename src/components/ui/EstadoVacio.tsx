import type { ReactNode } from "react";

/**
 * Pantalla vacía (Fase 7 §3). Nunca se presenta como un error: dice qué pasó y
 * ofrece la acción siguiente.
 */
export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-pauta-fuerte px-6 py-12 text-center">
      <p className="rotulo text-xl text-tinta">{titulo}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-tinta-suave">
        {descripcion}
      </p>
      {accion ? <div className="mt-5">{accion}</div> : null}
    </div>
  );
}
