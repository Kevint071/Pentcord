import type { CifradoRenderizado } from "@/domain/musica/tipos";

/**
 * D.3 · Render de la letra con la línea de acordes encima (RN-009b).
 *
 * Nunca muestra el ChordPro crudo: consume los segmentos ya posicionados que
 * devuelve el renderizador y se limita a pintarlos. Un acorde no reconocido
 * (RN-005) se marca en su sitio y la canción sigue leyéndose alrededor.
 *
 * `lineasConError` es opcional y solo lo usa la vista previa de E.3: el
 * renderizador devuelve una línea por cada línea del texto, así que el número
 * de línea del error (1-based, RN-013) es el índice + 1 y se puede marcar en el
 * sitio exacto sin que el visor tenga que enterarse.
 */
export function Cifrado({
  cifrado,
  lineasConError,
}: {
  cifrado: CifradoRenderizado;
  lineasConError?: ReadonlySet<number>;
}) {
  return (
    <div className="cifrado text-tinta">
      {cifrado.lineas.map((linea, indice) => {
        const conError = lineasConError?.has(indice + 1) ? true : undefined;

        if (linea.tipo === "vacia") {
          return <div key={indice} className="cifrado-linea-vacia" />;
        }

        if (linea.tipo === "directiva") {
          return (
            <p
              key={indice}
              data-linea-error={conError}
              className="directiva mt-6 mb-3 border-b border-pauta pb-1.5 first:mt-0"
            >
              {linea.nombre}
            </p>
          );
        }

        return (
          <p key={indice} data-linea-error={conError} className="cifrado-linea">
            {linea.segmentos.map((segmento, posicion) => (
              <span key={posicion} className="cifrado-segmento">
                <span
                  className="cifrado-acorde"
                  data-reconocido={segmento.reconocido}
                  title={
                    segmento.acorde && !segmento.reconocido
                      ? `«${segmento.acorde}» no es un acorde de los tipos que PentCord reconoce`
                      : undefined
                  }
                >
                  {segmento.acorde ?? ""}
                </span>
                <span className="cifrado-letra">{segmento.texto}</span>
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** Cuenta los acordes que el parser no supo leer, para avisar una sola vez. */
export function contarNoReconocidos(cifrado: CifradoRenderizado) {
  return cifrado.lineas.reduce((total, linea) => {
    if (linea.tipo !== "letra") return total;
    return (
      total +
      linea.segmentos.filter((s) => s.acorde !== null && !s.reconocido).length
    );
  }, 0);
}
