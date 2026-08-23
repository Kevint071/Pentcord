"use client";

import { useId, useState } from "react";
import type { ComponentProps } from "react";

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function IconoOjo({ tachado }: { tachado: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        {...trazo}
      />
      <circle cx="12" cy="12" r="2.6" {...trazo} />
      {tachado ? <path d="M4 4l16 16" {...trazo} /> : null}
    </svg>
  );
}

type Props = Omit<ComponentProps<"input">, "id"> & {
  etiqueta: string;
  error?: string | null;
};

/**
 * Campo con subrayado en vez de caja: el renglón recuerda a la hoja pautada
 * de C.1 en vez del control genérico de cualquier formulario. `type="password"`
 * añade el interruptor de mostrar/ocultar.
 */
export function CampoDeTexto({
  etiqueta,
  error,
  type,
  className = "",
  ...resto
}: Props) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const [visible, setVisible] = useState(false);
  const esPassword = type === "password";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-medium tracking-wide text-tinta-tenue uppercase"
        >
          {etiqueta}
        </label>
        {esPassword ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            className="flex items-center gap-1 text-xs font-medium text-tinta-tenue hover:text-tinta"
          >
            <IconoOjo tachado={!visible} />
            {visible ? "Ocultar" : "Mostrar"}
          </button>
        ) : null}
      </div>
      <input
        id={id}
        type={esPassword ? (visible ? "text" : "password") : type}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`mt-1.5 w-full border-0 border-b-2 border-pauta-fuerte bg-transparent py-1.5 text-base text-tinta outline-none transition-colors placeholder:text-tinta-tenue focus:border-acorde ${className}`}
        {...resto}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-alerta">
          {error}
        </p>
      ) : null}
    </div>
  );
}
