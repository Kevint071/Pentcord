"use client";

import { useId, useState } from "react";
import type { ComponentProps, ReactNode } from "react";

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

/** Para el campo de correo. */
export function IconoSobre() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" {...trazo} />
      <path d="m4 7 8 6 8-6" {...trazo} />
    </svg>
  );
}

/** Para el campo de contraseña. */
export function IconoCandado() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2.2" {...trazo} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" {...trazo} />
    </svg>
  );
}

/** Para el campo de nombre de usuario. */
export function IconoPersona() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.4" {...trazo} />
      <path d="M4.5 19.5c1.4-4 4.2-6 7.5-6s6.1 2 7.5 6" {...trazo} />
    </svg>
  );
}

type Props = Omit<ComponentProps<"input">, "id"> & {
  etiqueta: string;
  error?: string | null;
  /** Icono a la izquierda, dentro de la caja (sobre, candado, persona…). */
  icono?: ReactNode;
};

const CURVA = "ease-[cubic-bezier(0.16,1,0.3,1)]";

/**
 * Campo en píldora, como los demás controles redondeados de la app (botones,
 * el interruptor Entrar/Crear cuenta, el buscador): levantado del fondo con
 * `shadow-hoja` en reposo, con un vuelo sutil al pasar el cursor, y un halo de
 * azul acorde al enfocar — el mismo lenguaje del buscador, pero con más
 * presencia porque aquí es el único control de la pantalla. `icono` pone un
 * glifo a la izquierda (sobre, candado…); `type="password"` añade el ojo para
 * mostrar/ocultar a la derecha.
 */
export function CampoDeTexto({
  etiqueta,
  error,
  type,
  icono,
  className = "",
  ...resto
}: Props) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const [visible, setVisible] = useState(false);
  const esPassword = type === "password";

  return (
    <div className="group">
      <label
        htmlFor={id}
        className={`text-xs font-medium tracking-wide uppercase transition-colors duration-200 ${error ? "text-alerta" : "text-tinta-tenue group-focus-within:text-acorde"}`}
      >
        {etiqueta}
      </label>
      <div
        className={`mt-1.5 flex items-center gap-2.5 rounded-full border bg-hoja-alta px-5 py-3 shadow-hoja transition-all duration-200 ${CURVA} hover:-translate-y-0.5 focus-within:translate-y-0 ${
          error
            ? "border-alerta focus-within:shadow-[0_0_0_4px_var(--color-alerta-suave)]"
            : "border-pauta-fuerte hover:border-tinta-tenue focus-within:border-acorde focus-within:shadow-[0_0_0_4px_var(--color-acorde-suave)]"
        }`}
      >
        {icono ? (
          <span
            aria-hidden="true"
            className={`flex shrink-0 items-center transition-colors duration-200 ${error ? "text-alerta" : "text-tinta-tenue group-focus-within:text-acorde"}`}
          >
            {icono}
          </span>
        ) : null}
        <input
          id={id}
          type={esPassword ? (visible ? "text" : "password") : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`w-full min-w-0 border-0 bg-transparent text-base text-tinta outline-none placeholder:text-tinta-tenue ${className}`}
          {...resto}
        />
        {esPassword ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "Ocultar la contraseña" : "Mostrar la contraseña"}
            className={`shrink-0 rounded-lg p-1.5 transition-all duration-150 hover:bg-hoja active:scale-90 ${visible ? "text-acorde" : "text-tinta-tenue hover:text-tinta"}`}
          >
            <IconoOjo tachado={!visible} />
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="entra mt-1.5 text-xs text-alerta">
          {error}
        </p>
      ) : null}
    </div>
  );
}
