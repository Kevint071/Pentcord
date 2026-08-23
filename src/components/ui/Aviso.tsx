import type { ReactNode } from "react";

type Tono = "neutro" | "alerta";

/**
 * Mensaje en línea. `role="alert"` solo en el tono de alerta, para no
 * interrumpir al lector de pantalla con avisos informativos.
 */
export function Aviso({
  tono = "neutro",
  children,
}: {
  tono?: Tono;
  children: ReactNode;
}) {
  const clases =
    tono === "alerta"
      ? "border-alerta/40 bg-alerta-suave text-alerta"
      : "border-pauta bg-hoja text-tinta-suave";

  return (
    <p
      role={tono === "alerta" ? "alert" : undefined}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm leading-relaxed ${clases}`}
    >
      {tono === "alerta" ? (
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        >
          <path
            d="M12 8v5M12 16.2v.1M12 3.5 21 19H3z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      <span>{children}</span>
    </p>
  );
}
