"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Boton } from "./Boton";

/**
 * Modal de confirmación explícita, para las acciones destructivas de E.4
 * (solicitar eliminación de una versión propia, eliminar la cuenta).
 *
 * Sin librería de diálogo: overlay + `role="dialog"`, cierre con Escape o con
 * clic fuera, y el foco se mueve al panel al abrir para que el teclado no se
 * quede en el botón que ya no está visible detrás del overlay.
 */
export function Confirmacion({
  abierta,
  titulo,
  descripcion,
  textoConfirmar,
  peligro = false,
  confirmando = false,
  onConfirmar,
  onCancelar,
}: {
  abierta: boolean;
  titulo: string;
  descripcion: ReactNode;
  textoConfirmar: string;
  peligro?: boolean;
  confirmando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierta) return;
    panelRef.current?.focus();

    function alTeclado(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCancelar();
    }
    document.addEventListener("keydown", alTeclado);
    return () => document.removeEventListener("keydown", alTeclado);
  }, [abierta, onCancelar]);

  if (!abierta) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/40 px-4"
      onClick={onCancelar}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacion-titulo"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border border-pauta bg-hoja p-6 shadow-hoja outline-none"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="confirmacion-titulo" className="rotulo text-xl text-tinta">
          {titulo}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-tinta-suave">
          {descripcion}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Boton
            type="button"
            variante="secundario"
            onClick={onCancelar}
            disabled={confirmando}
          >
            Cancelar
          </Boton>
          <Boton
            type="button"
            variante={peligro ? "peligro" : "primario"}
            onClick={onConfirmar}
            disabled={confirmando}
          >
            {confirmando ? "Un momento…" : textoConfirmar}
          </Boton>
        </div>
      </div>
    </div>
  );
}
