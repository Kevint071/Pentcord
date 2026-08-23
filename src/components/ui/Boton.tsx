import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primario" | "secundario" | "discreto" | "peligro";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTES: Record<Variante, string> = {
  // El azul de bolígrafo se reserva para los acordes y el tono. Las acciones
  // van en tinta, para que el color siga significando "esto es música".
  primario: "bg-tinta text-papel hover:bg-tinta/85",
  secundario:
    "border border-pauta-fuerte bg-hoja text-tinta hover:border-tinta-tenue",
  discreto: "text-tinta-suave hover:bg-hoja hover:text-tinta",
  // Reservado para acciones que empiezan a borrar algo (versión o cuenta).
  peligro: "bg-alerta text-papel hover:bg-alerta/85",
};

export function Boton({
  variante = "primario",
  className = "",
  children,
  ...resto
}: ComponentProps<"button"> & { variante?: Variante; children: ReactNode }) {
  return (
    <button
      {...resto}
      className={`${BASE} ${VARIANTES[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

export function BotonEnlace({
  variante = "primario",
  className = "",
  children,
  ...resto
}: ComponentProps<typeof Link> & { variante?: Variante; children: ReactNode }) {
  return (
    <Link {...resto} className={`${BASE} ${VARIANTES[variante]} ${className}`}>
      {children}
    </Link>
  );
}
