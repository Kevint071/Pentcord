import type { ReactNode } from "react";

/**
 * Pantalla que todavía no está construida.
 *
 * Existe porque los cuatro destinos de la barra fija (C.2) tienen que llevar a
 * algún sitio desde el primer día. Dice con todas las letras qué falta y de qué
 * tarea del plan depende, en vez de fingir una pantalla vacía.
 */
export function PantallaPendiente({
  seccion,
  titulo,
  descripcion,
  tarea,
  children,
}: {
  seccion: string;
  titulo: string;
  descripcion: string;
  tarea: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="directiva">{`{${seccion}}`}</p>
      <h1 className="rotulo mt-3 text-[clamp(2rem,8vw,3.25rem)] text-tinta">
        {titulo}
      </h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-tinta-suave">
        {descripcion}
      </p>

      {children}

      <p className="mt-8 border-t border-pauta pt-4 font-mono text-[0.8125rem] text-tinta-tenue">
        Pendiente · {tarea}
      </p>
    </div>
  );
}
