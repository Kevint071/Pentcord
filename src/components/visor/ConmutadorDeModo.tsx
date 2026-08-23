"use client";

import type { ModoDeAcordes } from "@/domain/musica/tipos";

/**
 * D.3 · Conmutador notas ↔ grados (HU-06).
 *
 * La conversión es siempre relativa al tono activo en pantalla, no a uno fijo
 * (RN-004), así que el control vive pegado al selector de tono.
 */
export function ConmutadorDeModo({
  modo,
  onCambiar,
}: {
  modo: ModoDeAcordes;
  onCambiar: (modo: ModoDeAcordes) => void;
}) {
  const opciones: { valor: ModoDeAcordes; etiqueta: string }[] = [
    { valor: "notas", etiqueta: "Notas" },
    { valor: "grados", etiqueta: "Grados" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Mostrar los acordes como"
      className="inline-flex rounded-full border border-pauta-fuerte bg-hoja p-0.5"
    >
      {opciones.map(({ valor, etiqueta }) => {
        const activo = modo === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo ? 0 : -1}
            onClick={() => onCambiar(valor)}
            onKeyDown={(evento) => {
              if (["ArrowLeft", "ArrowRight"].includes(evento.key)) {
                evento.preventDefault();
                onCambiar(modo === "notas" ? "grados" : "notas");
              }
            }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activo
                ? "bg-tinta text-papel"
                : "text-tinta-suave hover:text-tinta"
            }`}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}
