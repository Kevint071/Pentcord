"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { mensajeDeError, rutaDeLogin } from "@/lib/api/cliente";

/**
 * E.2 · Botón de favorito (HU-07).
 *
 * Marca/desmarca al instante, sin confirmación: no es una acción destructiva.
 * Sin sesión, lleva a iniciar sesión conservando la página actual (la versión
 * que se estaba viendo no se pierde).
 */
export function BotonDeFavorito({ versionId }: { versionId: number }) {
  const { usuario, usarApi } = useSesion();
  const router = useRouter();

  // `null` = todavía no se sabe (solo aplica con sesión, mientras se consulta
  // /favoritos). Sin sesión el botón siempre se pinta como inactivo, sin
  // necesidad de tocar este estado.
  const [esFavorito, setEsFavorito] = useState<boolean | null>(null);
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) return;
    let vigente = true;
    usarApi<{ versionId: number }[]>("/favoritos")
      .then((favoritos) => {
        if (vigente) setEsFavorito(favoritos.some((f) => f.versionId === versionId));
      })
      .catch(() => {
        if (vigente) setEsFavorito(false);
      });
    return () => {
      vigente = false;
    };
  }, [usuario, versionId, usarApi]);

  async function alternar() {
    if (!usuario) {
      router.push(
        rutaDeLogin(`${window.location.pathname}${window.location.search}`),
      );
      return;
    }
    if (esFavorito === null || cambiando) return; // aún cargando el estado real

    const anterior = esFavorito;
    const siguiente = !anterior;
    setEsFavorito(siguiente);
    setCambiando(true);
    setError(null);

    try {
      await usarApi("/favoritos", {
        method: siguiente ? "POST" : "DELETE",
        cuerpo: { versionId },
      });
    } catch (causa) {
      setEsFavorito(anterior);
      setError(mensajeDeError(causa));
    } finally {
      setCambiando(false);
    }
  }

  const cargandoEstado = usuario !== null && esFavorito === null;
  const activo = usuario !== null && esFavorito === true;

  return (
    <div>
      <button
        type="button"
        onClick={alternar}
        disabled={cargandoEstado || cambiando}
        aria-pressed={activo}
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          activo
            ? "border-acorde-borde bg-acorde-suave text-acorde"
            : "border-pauta-fuerte bg-hoja text-tinta-suave hover:border-tinta-tenue hover:text-tinta"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0"
          aria-hidden="true"
          fill={activo ? "currentColor" : "none"}
        >
          <path
            d="M12 20.5s-7.5-4.6-10-9.2C.4 8 1.9 4.5 5.3 3.7c2-.5 4 .3 5.2 2 .3.4.9.4 1.2 0 1.2-1.7 3.2-2.5 5.2-2 3.4.8 4.9 4.3 3.3 7.6-2.5 4.6-10 9.2-10 9.2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        {usuario === null
          ? "Guardar en favoritos"
          : activo
            ? "En tus favoritos"
            : "Guardar en favoritos"}
      </button>
      {error ? <p className="mt-1.5 text-xs text-alerta">{error}</p> : null}
    </div>
  );
}
