"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import type { Estado } from "@/generated/prisma/enums";
import { mensajeDeError, pedirApi } from "@/lib/api/cliente";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { EtiquetaDeEstado } from "@/components/ui/EtiquetaDeEstado";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Aviso } from "@/components/ui/Aviso";
import { Boton, BotonEnlace } from "@/components/ui/Boton";
import { Confirmacion } from "@/components/ui/Confirmacion";

const LIMITE_FOTO = 10 * 1024 * 1024;

type Contribucion = {
  id: number;
  cancionId: number;
  tonoOriginal: string;
  estado: Estado;
  creadoEn: string;
};

type CancionResumen = { id: number; titulo: string; artista: string };

const ESTADOS_ELIMINABLES: Estado[] = ["pendiente", "verificada", "rechazada"];

/**
 * E.4 · Perfil (HU-12, HU-13, HU-14).
 *
 * Una regla de C.2 se decide aquí: el panel de administración **no** va en la
 * barra fija. Solo aparece dentro de Perfil, y solo si el rol es
 * `administrador`.
 */
export function Perfil() {
  const { usuario, esAdministrador, establecerUsuario, cerrarSesion, usarApi } =
    useSesion();

  if (!usuario) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <p className="directiva">{"{perfil}"}</p>
      <h1 className="rotulo mt-3 text-[clamp(2rem,8vw,3.25rem)] text-tinta">
        {usuario.username}
      </h1>

      <FotoDePerfil
        fotoActual={usuario.fotoPerfilUrl}
        inicial={usuario.username.charAt(0).toUpperCase()}
        onSubida={(url) => establecerUsuario({ ...usuario, fotoPerfilUrl: url })}
        subir={(cuerpoCrudo) =>
          usarApi<{ url: string }>("/usuarios/me/foto", {
            method: "POST",
            cuerpoCrudo,
          })
        }
      />

      <dl className="mt-6 grid gap-3 border-t border-pauta pt-5 text-sm">
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 text-tinta-tenue">Correo</dt>
          <dd className="font-mono text-tinta">{usuario.email ?? "—"}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-24 shrink-0 text-tinta-tenue">Rol</dt>
          <dd className="font-mono text-tinta">{usuario.rol}</dd>
        </div>
      </dl>

      <MisAportes />

      <section className="mt-8 border-t border-pauta pt-6">
        <p className="directiva">{"{cuenta}"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Boton variante="secundario" onClick={() => void cerrarSesion()}>
            Cerrar sesión
          </Boton>
          <EliminarCuenta onEliminar={() => usarApi("/usuarios", { method: "DELETE" })} />
        </div>
      </section>

      {esAdministrador ? (
        <section className="mt-6 rounded-xl border border-acorde-borde bg-acorde-suave px-4 py-4">
          <p className="directiva text-acorde">{"{administración}"}</p>
          <p className="mt-2 text-sm leading-relaxed text-tinta">
            Tienes rol de administrador. Las versiones pendientes ya se pueden
            listar y su contenido ya se puede leer sin bloqueos de visibilidad
            (RN-015), pero el panel para aprobar o rechazar (E.5) sigue
            pendiente: mostrar la versión &ldquo;renderizada&rdquo; en vez del
            ChordPro crudo depende del Bloque A, que todavía no existe.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function FotoDePerfil({
  fotoActual,
  inicial,
  onSubida,
  subir,
}: {
  fotoActual: string | null;
  inicial: string;
  onSubida: (url: string) => void;
  subir: (cuerpoCrudo: FormData) => Promise<{ url: string }>;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;

    setError(null);

    if (!archivo.type.startsWith("image/")) {
      setError("Ese archivo no es una imagen.");
      return;
    }
    if (archivo.size > LIMITE_FOTO) {
      setError("La imagen pesa más de 10 MB.");
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("file", archivo);
      const { url } = await subir(formData);
      onSubida(url);
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="mt-6 flex items-center gap-4">
      <div className="size-20 shrink-0 overflow-hidden rounded-full border border-pauta bg-hoja">
        {fotoActual ? (
          // eslint-disable-next-line @next/next/no-img-element -- viene de Cloudinary, no del build local.
          <img src={fotoActual} alt="" className="size-full object-cover" />
        ) : (
          <div className="rotulo grid size-full place-items-center text-2xl text-tinta-tenue">
            {inicial}
          </div>
        )}
      </div>
      <div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-pauta-fuerte bg-hoja px-4 py-2 text-sm font-medium text-tinta transition-colors hover:border-tinta-tenue has-disabled:cursor-not-allowed has-disabled:opacity-50">
          {subiendo ? "Subiendo…" : "Cambiar foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={manejarArchivo}
            disabled={subiendo}
          />
        </label>
        <p className="mt-1.5 text-xs text-tinta-tenue">JPG o PNG, hasta 10 MB.</p>
        {error ? <p className="mt-1 text-xs text-alerta">{error}</p> : null}
      </div>
    </div>
  );
}

function MisAportes() {
  const { usarApi } = useSesion();
  const [contribuciones, setContribuciones] = useState<Contribucion[] | null>(
    null,
  );
  const [canciones, setCanciones] = useState<Map<number, CancionResumen>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);
  const [objetivo, setObjetivo] = useState<Contribucion | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vigente = true;

    usarApi<Contribucion[]>("/myContributions")
      .then(async (datos) => {
        if (!vigente) return;
        setContribuciones(datos);

        const idsUnicos = [...new Set(datos.map((c) => c.cancionId))];
        const resueltas = await Promise.all(
          idsUnicos.map((id) =>
            pedirApi<{ data: CancionResumen }>(`/canciones/${id}`)
              .then((r) => r.data)
              .catch(() => null),
          ),
        );
        if (!vigente) return;
        setCanciones(
          new Map(
            resueltas
              .filter((c): c is CancionResumen => c !== null)
              .map((c) => [c.id, c]),
          ),
        );
      })
      .catch((causa) => {
        if (vigente) setError(mensajeDeError(causa));
      });

    return () => {
      vigente = false;
    };
  }, [usarApi]);

  async function solicitarEliminacion() {
    if (!objetivo) return;
    setEnviando(true);
    try {
      await usarApi(`/versiones/${objetivo.id}`, { method: "PATCH" });
      setContribuciones((actual) =>
        (actual ?? []).map((c) =>
          c.id === objetivo.id ? { ...c, estado: "pendienteEliminacion" } : c,
        ),
      );
      setObjetivo(null);
    } catch (causa) {
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mt-8 border-t border-pauta pt-6">
      <p className="directiva">{"{mis aportes}"}</p>

      {error ? (
        <div className="mt-3">
          <Aviso tono="alerta">{error}</Aviso>
        </div>
      ) : null}

      {!error && contribuciones === null ? (
        <p className="mt-4 text-sm text-tinta-suave">Cargando…</p>
      ) : null}

      {contribuciones && contribuciones.length === 0 ? (
        <div className="mt-4">
          <EstadoVacio
            titulo="Todavía no has aportado nada"
            descripcion="Cuando aportes una canción o una versión, aparecerá aquí con su estado de revisión."
            accion={<BotonEnlace href="/aportar">Aportar una canción</BotonEnlace>}
          />
        </div>
      ) : null}

      {contribuciones && contribuciones.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {contribuciones.map((c) => {
            const cancion = canciones.get(c.cancionId);
            const puedeEliminarse = ESTADOS_ELIMINABLES.includes(c.estado);
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-pauta bg-hoja px-4 py-3.5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-acorde-borde bg-acorde-suave">
                  <span className="rotulo text-base text-acorde">
                    {c.tonoOriginal}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-tinta">
                    {cancion?.titulo ?? `Canción #${c.cancionId}`}
                  </span>
                  <span className="block truncate font-mono text-[0.8125rem] text-tinta-suave">
                    {cancion?.artista ?? "—"}
                  </span>
                </span>
                <EtiquetaDeEstado estado={c.estado} />
                <Link
                  href={`/versiones/${c.id}`}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-tinta-suave transition-colors hover:bg-hoja-alta hover:text-tinta"
                >
                  Ver
                </Link>
                {puedeEliminarse ? (
                  <button
                    type="button"
                    onClick={() => setObjetivo(c)}
                    className="rounded-full px-3 py-1.5 font-mono text-[0.75rem] text-tinta-tenue transition-colors hover:bg-alerta-suave hover:text-alerta"
                  >
                    solicitar eliminación
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <Confirmacion
        abierta={objetivo !== null}
        titulo="¿Solicitar la eliminación de esta versión?"
        descripcion="Un administrador tiene que confirmarla. Mientras tanto, la versión sigue visible tal y como está."
        textoConfirmar="Solicitar eliminación"
        peligro
        confirmando={enviando}
        onConfirmar={() => void solicitarEliminacion()}
        onCancelar={() => setObjetivo(null)}
      />
    </section>
  );
}

function EliminarCuenta({ onEliminar }: { onEliminar: () => Promise<unknown> }) {
  const { cerrarSesion } = useSesion();
  const [abierta, setAbierta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      await onEliminar();
      await cerrarSesion();
    } catch (causa) {
      setError(mensajeDeError(causa));
      setEnviando(false);
    }
  }

  return (
    <>
      <Boton variante="peligro" onClick={() => setAbierta(true)}>
        Eliminar cuenta
      </Boton>
      {error ? (
        <div className="mt-2 w-full">
          <Aviso tono="alerta">{error}</Aviso>
        </div>
      ) : null}
      <Confirmacion
        abierta={abierta}
        titulo="¿Eliminar tu cuenta?"
        descripcion={
          <>
            Tus versiones ya verificadas siguen visibles en el catálogo para
            los demás. Tu perfil, tus favoritos y el resto de tu cuenta dejan
            de estar disponibles y no vas a poder recuperarlos.
          </>
        }
        textoConfirmar="Eliminar cuenta"
        peligro
        confirmando={enviando}
        onConfirmar={() => void confirmar()}
        onCancelar={() => setAbierta(false)}
      />
    </>
  );
}
