"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { parsearChordPro } from "@/domain/musica";
import type { Tono } from "@/domain/musica";
import type { Estado } from "@/generated/prisma/enums";
import { ErrorDeApi, mensajeDeError, pedirApi } from "@/lib/api/cliente";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { SelectorDeTono } from "@/components/visor/SelectorDeTono";
import { CampoDeTexto } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { Boton, BotonEnlace } from "@/components/ui/Boton";
import { EtiquetaDeEstado } from "@/components/ui/EtiquetaDeEstado";
import { separarErrores } from "./errores";
import { VistaPrevia } from "./VistaPrevia";

/**
 * E.3 · Aportar canción / versión (HU-08, HU-09, HU-10).
 *
 * Una sola pantalla con dos destinos, porque el usuario no siempre sabe de
 * antemano en cuál está:
 *
 * - **Canción nueva**: título, artista, tono y ChordPro → `POST /canciones`.
 * - **Versión de una canción que ya existe**: tono y ChordPro →
 *   `POST /canciones/{id}/versiones`. Se llega con `?cancion=<id>` desde la
 *   ficha de la canción, o desde el aviso de posible duplicado (RN-010).
 *
 * Cambiar de destino **no navega** a ninguna parte: solo cambia el estado. Si
 * navegara, quien acaba de escribir una canción entera la perdería justo en el
 * momento en que descubre que ya estaba en el catálogo.
 *
 * La vista previa (RN-011) usa el renderizador real del dominio, así que lo que
 * se ve aquí es exactamente lo que verá el visor (D.3).
 */

type CancionResumen = { id: number; titulo: string; artista: string };

type Destino = { tipo: "nueva" } | { tipo: "version"; cancion: CancionResumen };

type Resultado = {
  versionId: number;
  estado: Estado;
  cancion: CancionResumen;
};

const RETARDO_DE_TECLEO = 400;
const MINIMO_PARA_BUSCAR_DUPLICADOS = 3;

const EJEMPLO = `{intro}

{verso}
[C]Cuando salga el [G]sol
[Am]y se apague la [F]luz`;

/**
 * ¿Es el mismo título (o el mismo artista)? Sin distinguir mayúsculas ni
 * tildes: quien escribe «cancion de cuna» se refiere a «Canción de cuna».
 */
function mismoTexto(uno: string, otro: string) {
  return (
    uno.trim().localeCompare(otro.trim(), "es", { sensitivity: "base" }) === 0
  );
}

/**
 * Un `401` al guardar puede ser la sesión vencida (15 min) o el bug de
 * `POST /canciones`, que responde `401` con la sesión intacta. La única forma
 * honesta de distinguirlos es volver a preguntar quién es el usuario.
 */
async function laSesionSigueViva() {
  try {
    await pedirApi("/auth/me");
    return true;
  } catch {
    return false;
  }
}

export function Aportar({ cancionId }: { cancionId: number | null }) {
  const { expirarSesion } = useSesion();

  const [destino, setDestino] = useState<Destino>({ tipo: "nueva" });
  const [cargandoCancion, setCargandoCancion] = useState(cancionId !== null);
  const [errorDeCancion, setErrorDeCancion] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [artista, setArtista] = useState("");
  const [tono, setTono] = useState<Tono>("C");
  const [contenido, setContenido] = useState("");

  // Atadas al término que las trajo: así el aviso no sobrevive al título que lo
  // provocó, y no hace falta limpiarlo desde el efecto.
  const [parecidas, setParecidas] = useState<{
    termino: string;
    canciones: CancionResumen[];
  }>({ termino: "", canciones: [] });
  const [revisionDeParecidas, setRevisionDeParecidas] = useState(0);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<ReactNode | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const areaRef = useRef<HTMLTextAreaElement>(null);
  const esNueva = destino.tipo === "nueva";

  // Se llega con `?cancion=<id>`: hay que saber de qué canción se trata para
  // poder nombrarla, no basta con el id.
  useEffect(() => {
    if (cancionId === null) return;
    let vigente = true;

    pedirApi<{ data: CancionResumen }>(`/canciones/${cancionId}`)
      .then(({ data }) => {
        if (vigente) setDestino({ tipo: "version", cancion: data });
      })
      .catch((causa) => {
        if (!vigente) return;
        setErrorDeCancion(
          causa instanceof ErrorDeApi && causa.code === "NOT_FOUND"
            ? "Esa canción no está en el catálogo. Puedes aportarla como canción nueva."
            : mensajeDeError(causa),
        );
      })
      .finally(() => {
        if (vigente) setCargandoCancion(false);
      });

    return () => {
      vigente = false;
    };
  }, [cancionId]);

  // RN-010 · Advertencia de posible duplicado. No bloquea nada: si la búsqueda
  // falla se calla, porque avisar de un duplicado es una ayuda, no un requisito
  // para poder aportar.
  useEffect(() => {
    if (!esNueva) return;
    const buscado = titulo.trim();
    if (buscado.length < MINIMO_PARA_BUSCAR_DUPLICADOS) return;

    let vigente = true;
    const temporizador = setTimeout(() => {
      pedirApi<{ data: CancionResumen[] }>("/canciones", {
        parametros: { titulo: buscado, limit: 5 },
      })
        .then(({ data }) => {
          if (!vigente) return;
          // `contains` es de mano ancha: solo interesa el mismo título.
          setParecidas({
            termino: buscado,
            canciones: data.filter((c) => mismoTexto(c.titulo, buscado)),
          });
        })
        .catch(() => {
          if (vigente) setParecidas({ termino: buscado, canciones: [] });
        });
    }, RETARDO_DE_TECLEO);

    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [titulo, esNueva, revisionDeParecidas]);

  const documento = useMemo(() => parsearChordPro(contenido), [contenido]);
  const { bloqueantes } = useMemo(
    () => separarErrores(documento.errores),
    [documento],
  );

  // El aviso vale solo mientras el título siga siendo el que se buscó.
  const duplicados = mismoTexto(parecidas.termino, titulo)
    ? parecidas.canciones
    : [];

  const contenidoVacio = contenido.trim() === "";
  const faltaTitulo = esNueva && titulo.trim() === "";
  const faltaArtista = esNueva && artista.trim() === "";

  const motivoParaNoGuardar = contenidoVacio
    ? "Escribe la canción para poder guardarla."
    : faltaTitulo || faltaArtista
      ? faltaTitulo && faltaArtista
        ? "Faltan el título y el artista."
        : faltaTitulo
          ? "Falta el título."
          : "Falta el artista."
      : bloqueantes.length > 0
        ? bloqueantes.length === 1
          ? "Corrige el error de la vista previa para poder guardar."
          : `Corrige los ${bloqueantes.length} errores de la vista previa para poder guardar.`
        : null;

  const puedeGuardar = motivoParaNoGuardar === null && !enviando;

  /** RN-013 · Lleva el cursor al punto exacto del error, 1-based. */
  const irAlPunto = useCallback((linea: number, columna: number) => {
    const area = areaRef.current;
    if (!area) return;

    const lineas = area.value.split("\n");
    let posicion = 0;
    for (let i = 0; i < linea - 1 && i < lineas.length; i += 1) {
      posicion += lineas[i].length + 1;
    }
    posicion += Math.max(0, columna - 1);

    area.focus();
    area.setSelectionRange(posicion, posicion);
  }, []);

  function elegirCancion(cancion: CancionResumen) {
    setDestino({ tipo: "version", cancion });
    setError(null);
    setErrorDeCancion(null);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!puedeGuardar) return;

    setEnviando(true);
    setError(null);

    try {
      if (destino.tipo === "version") {
        const { data } = await pedirApi<{
          data: { id: number; estado: Estado };
        }>(`/canciones/${destino.cancion.id}/versiones`, {
          method: "POST",
          cuerpo: { contenido_chordpro: contenido, tono_original: tono },
        });
        setResultado({
          versionId: data.id,
          estado: data.estado,
          cancion: destino.cancion,
        });
      } else {
        const creada = await pedirApi<{
          id: number;
          titulo: string;
          artista: string;
          version: { id: number; estado: Estado };
        }>("/canciones", {
          method: "POST",
          cuerpo: {
            titulo: titulo.trim(),
            artista: artista.trim(),
            contenido_chordpro: contenido,
            tono_original: tono,
          },
        });
        setResultado({
          versionId: creada.version.id,
          estado: creada.version.estado,
          cancion: {
            id: creada.id,
            titulo: creada.titulo,
            artista: creada.artista,
          },
        });
      }
    } catch (causa) {
      if (causa instanceof ErrorDeApi && causa.code === "UNAUTHENTICATED") {
        if (!(await laSesionSigueViva())) {
          expirarSesion();
          return;
        }
        // Sesión viva y aun así 401: es el bug de `POST /canciones` (B.4), que
        // llama a su propio endpoint de versiones sin reenviar la cookie.
        setError(esNueva ? <FalloAlCrearCancion /> : mensajeDeError(causa));
        // La canción sí llegó a crearse: al volver a buscar aparece, y desde el
        // aviso de duplicado se puede aportar la versión sin perder el texto.
        if (esNueva) setRevisionDeParecidas((n) => n + 1);
        return;
      }
      setError(mensajeDeError(causa));
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return (
      <Contenedor>
        <AporteRecibido
          resultado={resultado}
          onAportarOtra={() => {
            setResultado(null);
            setContenido("");
            setTitulo("");
            setArtista("");
            setTono("C");
            setParecidas({ termino: "", canciones: [] });
          }}
        />
      </Contenedor>
    );
  }

  return (
    <Contenedor>
      <Link
        href={destino.tipo === "version" ? `/canciones/${destino.cancion.id}` : "/"}
        className="inline-flex items-center gap-1.5 text-sm text-tinta-suave transition-colors hover:text-tinta"
      >
        <span aria-hidden="true">←</span>{" "}
        {destino.tipo === "version" ? "La canción" : "Buscar"}
      </Link>

      <header className="mt-4">
        <p className="directiva">{"{aportar}"}</p>
        <h1 className="rotulo mt-2 text-[clamp(2rem,8vw,3.25rem)] text-tinta">
          {esNueva ? "Aportar una canción" : "Aportar una versión"}
        </h1>
        {destino.tipo === "version" ? (
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-sm text-tinta-suave">
            <span>
              {destino.cancion.titulo} · {destino.cancion.artista}
            </span>
            <button
              type="button"
              onClick={() => setDestino({ tipo: "nueva" })}
              className="text-[0.75rem] text-tinta-tenue underline underline-offset-4 transition-colors hover:text-tinta"
            >
              no es esta canción
            </button>
          </p>
        ) : (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-tinta-suave">
            Escribe los acordes entre corchetes, justo antes de la sílaba en la
            que entran. A la derecha ves cómo va quedando.
          </p>
        )}
      </header>

      {cargandoCancion ? (
        <p className="mt-6 text-sm text-tinta-suave">Cargando la canción…</p>
      ) : null}

      {errorDeCancion ? (
        <div className="mt-5">
          <Aviso tono="alerta">{errorDeCancion}</Aviso>
        </div>
      ) : null}

      <form onSubmit={guardar} className="mt-6 pb-12">
        {/* RN-012: en pantalla ancha el texto y su vista previa se miran; en
            móvil la vista previa va debajo, que es el orden en el que se lee. */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
          <div className="grid content-start gap-6">
            {esNueva ? (
              <div className="grid gap-5">
                <CampoDeTexto
                  etiqueta="Título"
                  value={titulo}
                  onChange={(evento) => setTitulo(evento.target.value)}
                  placeholder="Cuando salga el sol"
                  autoComplete="off"
                />
                <CampoDeTexto
                  etiqueta="Artista"
                  value={artista}
                  onChange={(evento) => setArtista(evento.target.value)}
                  placeholder="Quien la canta"
                  autoComplete="off"
                />
              </div>
            ) : null}

            {esNueva && duplicados.length > 0 ? (
              <PosibleDuplicado
                parecidas={duplicados}
                artista={artista}
                onElegir={elegirCancion}
              />
            ) : null}

            <div>
              <p className="text-xs font-medium tracking-wide text-tinta-tenue uppercase">
                Tono original
              </p>
              <p className="mt-1 mb-2 text-xs text-tinta-suave">
                El tono en el que está escrita. Quien la lea podrá transportarla
                a cualquier otro sin tocar esto.
              </p>
              <SelectorDeTono
                tonoActivo={tono}
                tonoOriginal={null}
                onCambiar={setTono}
                etiqueta="Tono original de la versión"
              />
            </div>

            <div>
              <label
                htmlFor="chordpro"
                className="text-xs font-medium tracking-wide text-tinta-tenue uppercase"
              >
                Letra con acordes
              </label>
              <textarea
                id="chordpro"
                ref={areaRef}
                value={contenido}
                onChange={(evento) => setContenido(evento.target.value)}
                rows={16}
                spellCheck={false}
                placeholder={EJEMPLO}
                className="mt-1.5 w-full resize-y rounded-lg border border-pauta-fuerte bg-hoja px-3 py-2.5 font-mono text-sm leading-relaxed text-tinta outline-none transition-colors placeholder:text-tinta-tenue focus:border-acorde"
              />
              <Ayuda />
            </div>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <VistaPrevia
              documento={documento}
              tono={tono}
              vacia={contenidoVacio}
              onIrAlPunto={irAlPunto}
            />
          </div>
        </div>

        <div className="mt-8 border-t border-pauta pt-5">
          {error ? (
            <div className="mb-4">
              <Aviso tono="alerta">{error}</Aviso>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Boton
              type="submit"
              disabled={!puedeGuardar}
              aria-describedby={
                bloqueantes.length > 0 ? "errores-de-sintaxis" : undefined
              }
            >
              {enviando ? "Guardando…" : "Guardar el aporte"}
            </Boton>
            {motivoParaNoGuardar ? (
              <p className="text-sm text-tinta-suave">{motivoParaNoGuardar}</p>
            ) : (
              <p className="text-sm text-tinta-suave">
                Queda pendiente de revisión hasta que un administrador la
                apruebe.
              </p>
            )}
          </div>
        </div>
      </form>
    </Contenedor>
  );
}

/** RN-010 · Advertencia no bloqueante de posible duplicado. */
function PosibleDuplicado({
  parecidas,
  artista,
  onElegir,
}: {
  parecidas: CancionResumen[];
  artista: string;
  onElegir: (cancion: CancionResumen) => void;
}) {
  const mismoArtista =
    artista.trim() !== "" &&
    parecidas.some((c) => mismoTexto(c.artista, artista));

  return (
    <section className="rounded-xl border border-pauta-fuerte bg-hoja px-4 py-3.5">
      <p className="text-sm font-medium text-tinta">
        {mismoArtista
          ? "Esta canción ya está en el catálogo"
          : "Ya hay una canción con este título"}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-tinta-suave">
        Si es la misma, aporta tu versión ahí: se sumará a las que ya tiene, sin
        duplicar la canción. Si no lo es, sigue y créala como nueva.
      </p>

      <ul className="mt-3 grid gap-2">
        {parecidas.map((cancion) => (
          <li
            key={cancion.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-pauta bg-papel px-3 py-2"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-tinta">
                {cancion.titulo}
              </span>
              <span className="block truncate font-mono text-[0.75rem] text-tinta-suave">
                {cancion.artista}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onElegir(cancion)}
              className="rounded-full border border-pauta-fuerte px-3 py-1 text-sm text-tinta transition-colors hover:border-tinta-tenue"
            >
              Aportar mi versión aquí
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Confirmación de que el aporte quedó registrado y en qué estado. */
function AporteRecibido({
  resultado,
  onAportarOtra,
}: {
  resultado: Resultado;
  onAportarOtra: () => void;
}) {
  return (
    <div className="py-6 sm:py-10">
      <p className="directiva">{"{aporte recibido}"}</p>
      <h1 className="rotulo mt-2 text-[clamp(2rem,8vw,3.25rem)] text-tinta">
        Gracias
      </h1>

      <div className="mt-5 rounded-xl border border-pauta bg-hoja px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-mono text-sm text-tinta">
            {resultado.cancion.titulo} · {resultado.cancion.artista}
          </span>
          <EtiquetaDeEstado estado={resultado.estado} />
        </div>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-tinta-suave">
          {resultado.estado === "pendiente"
            ? "Un administrador la revisa antes de que aparezca en el catálogo. Mientras tanto solo la ves tú, en Perfil › Mis aportes, y puedes abrirla cuando quieras."
            : "Ya está publicada: cualquiera puede encontrarla en el catálogo."}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <BotonEnlace href={`/versiones/${resultado.versionId}`}>
          Ver la versión
        </BotonEnlace>
        <BotonEnlace
          href={`/canciones/${resultado.cancion.id}`}
          variante="secundario"
        >
          Ir a la canción
        </BotonEnlace>
        <Boton variante="discreto" type="button" onClick={onAportarOtra}>
          Aportar otra
        </Boton>
      </div>
    </div>
  );
}

/** El bug de `POST /canciones` (B.4), explicado sin dejar al usuario colgado. */
function FalloAlCrearCancion() {
  return (
    <>
      El servidor creó la canción pero no llegó a guardar la versión:{" "}
      <code className="font-mono">POST /api/v1/canciones</code> llama a su
      propio endpoint de versiones sin reenviar tu sesión, así que esa segunda
      llamada se rechaza. Es un fallo conocido del backend (B.4), no tuyo. Tu
      canción ya debería aparecer aquí arriba como posible duplicado: entra por
      ahí y guarda la versión sin perder lo que escribiste.
    </>
  );
}

function Ayuda() {
  return (
    <details className="mt-3 rounded-lg border border-pauta bg-hoja px-3 py-2">
      <summary className="cursor-pointer text-sm text-tinta-suave transition-colors hover:text-tinta">
        Cómo se escribe
      </summary>
      <div className="mt-2.5 grid gap-2.5 text-sm leading-relaxed text-tinta-suave">
        <p>
          El acorde va entre corchetes, pegado a la sílaba en la que entra:{" "}
          <code className="font-mono text-tinta">
            [C]Cuando salga el [G]sol
          </code>
        </p>
        <p>
          Las secciones van entre llaves, solas en su línea:{" "}
          <code className="font-mono text-tinta">
            {"{intro} {verso} {precoro} {coro} {puente} {interludio} {solo} {final}"}
          </code>
        </p>
        <p>
          PentCord transporta mayor{" "}
          <code className="font-mono text-tinta">C</code>, menor{" "}
          <code className="font-mono text-tinta">Cm</code>, séptima{" "}
          <code className="font-mono text-tinta">C7</code>,{" "}
          <code className="font-mono text-tinta">Cmaj7</code>,{" "}
          <code className="font-mono text-tinta">Cm7</code>,{" "}
          <code className="font-mono text-tinta">Csus2</code>,{" "}
          <code className="font-mono text-tinta">Csus4</code> y con bajo{" "}
          <code className="font-mono text-tinta">C/E</code>. Cualquier otro se
          guarda tal cual, pero se queda quieto al cambiar de tono.
        </p>
      </div>
    </details>
  );
}

function Contenedor({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      {children}
    </div>
  );
}
