"use client";

import { useSyncExternalStore } from "react";
import { InterruptorDeTema } from "@/components/tema/InterruptorDeTema";
import { EVENTO_DE_TEMA, leerTema } from "@/lib/tema/tema";

function suscribirse(alCambiar: () => void) {
  const consulta = window.matchMedia("(prefers-color-scheme: dark)");
  consulta.addEventListener("change", alCambiar);
  window.addEventListener(EVENTO_DE_TEMA, alCambiar);
  return () => {
    consulta.removeEventListener("change", alCambiar);
    window.removeEventListener(EVENTO_DE_TEMA, alCambiar);
  };
}

export function Preferencias() {
  const tema = useSyncExternalStore(suscribirse, leerTema, () => "light" as const);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <p className="directiva">{"{preferencias}"}</p>
      <h1 className="rotulo mt-3 text-[clamp(2rem,8vw,3.25rem)] text-tinta">
        Preferencias
      </h1>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-pauta pt-6">
        <div>
          <p className="font-medium text-tinta">Tema</p>
          <p className="mt-0.5 text-sm text-tinta-suave">
            Se guarda en tu cuenta y te sigue a cualquier navegador donde
            inicies sesión.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-tinta-suave">
            {tema === "dark" ? "Oscuro" : "Claro"}
          </span>
          <InterruptorDeTema />
        </div>
      </div>
    </div>
  );
}
