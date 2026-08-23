import type { CifradoRenderizado } from "@/domain/musica/tipos";

/**
 * D.3 · Render de la letra con la línea de acordes encima (RN-009b).
 *
 * Nunca muestra el ChordPro crudo: consume los segmentos ya posicionados que
 * devuelve el renderizador y se limita a pintarlos. Un acorde no reconocido
 * (RN-005) se marca en su sitio y la canción sigue leyéndose alrededor.
 */
export function Cifrado({ cifrado }: { cifrado: CifradoRenderizado }) {
  return (
    <div className="cifrado text-tinta">
      {cifrado.lineas.map((linea, indice) => {
        if (linea.tipo === "vacia") {
          return <div key={indice} className="cifrado-linea-vacia" />;
        }

        if (linea.tipo === "directiva") {
          return (
            <p
              key={indice}
              className="directiva mt-6 mb-3 border-b border-pauta pb-1.5 first:mt-0"
            >
              {linea.nombre}
            </p>
          );
        }

        return (
          <p key={indice} className="cifrado-linea">
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
