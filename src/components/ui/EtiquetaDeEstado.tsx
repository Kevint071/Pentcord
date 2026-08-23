import type { Estado } from "@/generated/prisma/enums";

/**
 * Etiqueta de estado de una versión (HU-03, HU-11).
 *
 * El estado nunca se comunica solo con color (Fase 7 §4): el texto lo dice
 * siempre, y el color es un refuerzo.
 */
const PRESENTACION: Record<Estado, { texto: string; clases: string }> = {
  pendiente: {
    texto: "Pendiente de revisión",
    clases: "border-pauta-fuerte text-tinta-suave",
  },
  verificada: {
    texto: "Verificada",
    clases: "border-acorde-borde bg-acorde-suave text-acorde",
  },
  rechazada: {
    texto: "Rechazada",
    clases: "border-alerta/40 bg-alerta-suave text-alerta",
  },
  pendienteEliminacion: {
    texto: "Eliminación solicitada",
    clases: "border-alerta/40 text-alerta",
  },
  eliminada: {
    texto: "Eliminada",
    clases: "border-pauta text-tinta-tenue",
  },
};

export function EtiquetaDeEstado({ estado }: { estado: Estado }) {
  const { texto, clases } = PRESENTACION[estado];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[0.6875rem] font-medium tracking-wide ${clases}`}
    >
      {texto}
    </span>
  );
}
