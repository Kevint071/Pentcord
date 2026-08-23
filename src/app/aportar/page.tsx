import type { Metadata } from "next";
import { ExigeSesion } from "@/components/ui/ExigeSesion";
import { PantallaPendiente } from "@/components/ui/PantallaPendiente";

export const metadata: Metadata = { title: "Aportar" };

export default function Page() {
  return (
    <ExigeSesion>
      <PantallaPendiente
        seccion="aportar"
        titulo="Aportar una canción"
        descripcion="El formulario llevará la vista previa renderizada al lado del texto, para ver cómo queda mientras se escribe. Depende del parser de ChordPro, que es parte del módulo de dominio musical."
        tarea="E.3 · Aportar canción/versión (HU-08, HU-09, HU-10) — necesita el Bloque A"
      />
    </ExigeSesion>
  );
}
