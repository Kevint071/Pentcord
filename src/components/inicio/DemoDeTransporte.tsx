"use client";

import { useMemo, useState } from "react";
import { Cifrado } from "@/components/visor/Cifrado";
import {
  SelectorDeTono,
  etiquetaDeDistancia,
} from "@/components/visor/SelectorDeTono";
import { parsearChordPro, renderizar } from "@/domain/musica";
import type { Tono } from "@/domain/musica/tipos";

/**
 * Portada · el transporte, en vivo y debajo del buscador.
 *
 * No es una animación ni una captura: es el visor entero en pequeño —el mismo
 * `parsearChordPro`/`renderizar` del dominio, el mismo `<Cifrado>` y el mismo
 * `SelectorDeTono` de D.3— sobre un fragmento fijo. Quien toca un tono aquí ve
 * exactamente lo que verá al abrir cualquier canción, y lo ve sin cuenta, sin
 * red y sin recargar (HU-05).
 */

const TONO_ORIGINAL: Tono = "C";

const FRAGMENTO = parsearChordPro(
  ["[C]Cuando salga el [G]sol sobre el [Am]valle", "[F]volveremos a [C]cantar"].join("\n"),
);

export function DemoDeTransporte() {
  const [tono, setTono] = useState<Tono>(TONO_ORIGINAL);

  const cifrado = useMemo(
    () =>
      renderizar(FRAGMENTO, {
        tonoOriginal: TONO_ORIGINAL,
        tono,
        modo: "notas",
      }),
    [tono],
  );

  return (
    <div>
      <div aria-hidden className="h-9" />
      <Cifrado cifrado={cifrado} />

      <div className="mt-6">
        <SelectorDeTono
          tonoActivo={tono}
          tonoOriginal={TONO_ORIGINAL}
          onCambiar={setTono}
          etiqueta="Tono del ejemplo"
        />
        <p
          aria-live="polite"
          className="mt-2 text-center font-mono text-[0.8125rem] text-tinta-suave"
        >
          {etiquetaDeDistancia(TONO_ORIGINAL, tono)}
        </p>
      </div>
    </div>
  );
}
