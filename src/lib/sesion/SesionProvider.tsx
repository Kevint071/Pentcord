"use client";

/**
 * C.3 · Contexto de sesión.
 *
 * Consulta `GET /api/v1/auth/me` y expone el usuario y su rol. El token dura 15
 * minutos (ver `auth/login`), así que la sesión puede caducar mientras la
 * pestaña sigue abierta. Para no dejar la interfaz en un estado inconsistente:
 *
 * - El estado tiene exactamente tres valores: `cargando`, `autenticado`,
 *   `anonimo`. No hay un cuarto valor a medio camino.
 * - Cualquier llamada que responda `UNAUTHENTICATED` pasa la sesión a `anonimo`
 *   de inmediato (`usarApi`), así que la barra de navegación, el botón de
 *   favorito y el resto dejan de prometer algo que ya no es cierto.
 * - Al volver a la pestaña se revalida, que es cuando más probable es que el
 *   token haya vencido.
 *
 * Nota: `GET /auth/me` (B.2) ya existe, pero responde el usuario plano
 * (`{ id, username, ... }`) y sus errores como `{ message }`, no el `{ data }`
 * + catálogo que usa el resto de la API nueva. Mientras B.0 no unifique los
 * doce route handlers, `apiDeSesionDisponible` se mantiene para el caso en que
 * la ruta desaparezca o cambie de forma otra vez sin avisar.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ErrorDeApi,
  ErrorDeRed,
  pedirApi,
  rutaDeLogin,
  type OpcionesDePeticion,
} from "@/lib/api/cliente";
import { aplicarTema, leerTema } from "@/lib/tema/tema";

export type Rol = "musico" | "administrador";
export type MetodoAutenticacion = "local" | "google";
export type Tema = "light" | "dark";

export type UsuarioDeSesion = {
  id: number;
  username: string;
  email: string | null;
  rol: Rol;
  fotoPerfilUrl: string | null;
  tema: Tema | null;
  metodoAutenticacion: MetodoAutenticacion;
};

type EstadoDeSesion = "cargando" | "autenticado" | "anonimo";

type ValorDelContexto = {
  estado: EstadoDeSesion;
  usuario: UsuarioDeSesion | null;
  esAdministrador: boolean;
  /** `false` mientras `GET /auth/me` no exista (B.2). */
  apiDeSesionDisponible: boolean;
  /** Vuelve a preguntar quién es el usuario. */
  refrescar: () => Promise<void>;
  /** Marca la sesión como terminada y lleva al login guardando el contexto. */
  expirarSesion: (destino?: string) => void;
  /** Guarda al usuario tras un login correcto, sin esperar al refresco. */
  establecerUsuario: (usuario: UsuarioDeSesion) => void;
  /** Cierra la sesión a petición del usuario (E.4) y vuelve al inicio. */
  cerrarSesion: () => Promise<void>;
  /**
   * `true` mientras `cerrarSesion` está navegando lejos de la pantalla
   * protegida en la que se pidió. Evita que `ExigeSesion` compita con esa
   * navegación y redirija a `/login` en su lugar (ver `cerrarSesion`).
   */
  saliendo: boolean;
  /**
   * `pedirApi` con la política de sesión aplicada: un `UNAUTHENTICATED` cierra
   * la sesión y redirige al login recordando dónde estaba el usuario.
   */
  usarApi: <T>(ruta: string, opciones?: OpcionesDePeticion) => Promise<T>;
};

const ContextoDeSesion = createContext<ValorDelContexto | null>(null);

/** Ruta actual del navegador, para volver a ella tras iniciar sesión. */
function ubicacionActual() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Avisa a las demás pestañas de la misma sesión de navegador que se cerró
 * sesión, para que no la sigan dando por buena hasta su próxima revalidación
 * (foco/visibilidad). No hay nada que sincronizar en sentido contrario: un
 * login nuevo ya llega solo a cada pestaña la próxima vez que llama a la API.
 */
const CANAL_SESION = "pentcord:sesion";

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [estado, setEstado] = useState<EstadoDeSesion>("cargando");
  const [usuario, setUsuario] = useState<UsuarioDeSesion | null>(null);
  const [apiDeSesionDisponible, setApiDeSesionDisponible] = useState(true);
  const [saliendo, setSaliendo] = useState(false);

  // La navegación de `cerrarSesion` es asíncrona: hasta que la ruta cambie de
  // verdad, `ExigeSesion` sigue montado sobre la pantalla protegida y vería
  // `estado === "anonimo"` antes de que el `push("/")` termine. `saliendo` se
  // apaga en cuanto el pathname cambia, que es cuando ya no hace falta. Se
  // ajusta durante el render (no en un efecto) siguiendo el patrón de React
  // para "resetear estado cuando cambia algo" sin un re-render de más.
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setSaliendo(false);
  }

  // Evita que dos revalidaciones simultáneas se pisen.
  const consultaEnCurso = useRef<Promise<void> | null>(null);
  const canalSesion = useRef<BroadcastChannel | null>(null);

  const consultar = useCallback(async () => {
    try {
      const usuario = await pedirApi<UsuarioDeSesion>("/auth/me");
      setUsuario(usuario);
      setEstado("autenticado");
      setApiDeSesionDisponible(true);
      if (
        (usuario.tema === "light" || usuario.tema === "dark") &&
        usuario.tema !== leerTema()
      ) {
        aplicarTema(usuario.tema);
      }
    } catch (error) {
      setUsuario(null);
      setEstado("anonimo");

      if (error instanceof ErrorDeApi) {
        // 404 = el endpoint todavía no está construido (B.2). 401 = no hay
        // sesión, que es una respuesta legítima y no un fallo.
        setApiDeSesionDisponible(!error.esRutaInexistente);
      } else if (error instanceof ErrorDeRed) {
        setApiDeSesionDisponible(false);
      }
    }
  }, []);

  const refrescar = useCallback(async () => {
    if (consultaEnCurso.current) return consultaEnCurso.current;
    const promesa = consultar().finally(() => {
      consultaEnCurso.current = null;
    });
    consultaEnCurso.current = promesa;
    return promesa;
  }, [consultar]);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  // Si se cierra sesión en otra pestaña, esta se entera al instante en vez de
  // esperar a que vuelva a tener el foco (BroadcastChannel no existe en todos
  // los navegadores objetivo — sin él, la pestaña simplemente espera a su
  // próxima revalidación, como antes).
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const canal = new BroadcastChannel(CANAL_SESION);
    canalSesion.current = canal;
    canal.onmessage = (evento) => {
      if (evento.data === "cerrada") {
        setUsuario(null);
        setEstado("anonimo");
      }
    };
    return () => {
      canal.close();
      canalSesion.current = null;
    };
  }, []);

  // El token vence a los 15 minutos: el momento más probable de descubrirlo es
  // al volver a la pestaña.
  useEffect(() => {
    function alVolver() {
      if (document.visibilityState === "visible") void refrescar();
    }
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
    };
  }, [refrescar]);

  const expirarSesion = useCallback(
    (destino?: string) => {
      setUsuario(null);
      setEstado("anonimo");
      router.push(rutaDeLogin(destino ?? ubicacionActual()));
    },
    [router],
  );

  const establecerUsuario = useCallback((nuevo: UsuarioDeSesion) => {
    setUsuario(nuevo);
    setEstado("autenticado");
    setApiDeSesionDisponible(true);
  }, []);

  const cerrarSesion = useCallback(async () => {
    setSaliendo(true);
    setUsuario(null);
    setEstado("anonimo");
    try {
      // `DELETE /auth/logout` (backend, commit 5ccdf2a) borra la cookie
      // httpOnly `accesstoken` desde el servidor — el navegador no puede
      // hacerlo por su cuenta. Si la llamada falla (red caída, ya no había
      // sesión) igual se sigue: el estado local ya quedó limpio arriba.
      await pedirApi("/auth/logout", { method: "DELETE" });
    } catch {
      // Best effort: nada que mostrarle al usuario por esto.
    }
    canalSesion.current?.postMessage("cerrada");
    router.push("/");
  }, [router]);

  const usarApi = useCallback(
    async <T,>(ruta: string, opciones?: OpcionesDePeticion): Promise<T> => {
      try {
        return await pedirApi<T>(ruta, opciones);
      } catch (error) {
        if (error instanceof ErrorDeApi && error.code === "UNAUTHENTICATED") {
          expirarSesion();
        }
        throw error;
      }
    },
    [expirarSesion],
  );

  const valor = useMemo<ValorDelContexto>(
    () => ({
      estado,
      usuario,
      esAdministrador: usuario?.rol === "administrador",
      apiDeSesionDisponible,
      refrescar,
      expirarSesion,
      establecerUsuario,
      cerrarSesion,
      saliendo,
      usarApi,
    }),
    [
      estado,
      usuario,
      apiDeSesionDisponible,
      refrescar,
      expirarSesion,
      establecerUsuario,
      cerrarSesion,
      saliendo,
      usarApi,
    ],
  );

  return (
    <ContextoDeSesion.Provider value={valor}>
      {children}
    </ContextoDeSesion.Provider>
  );
}

export function useSesion() {
  const valor = useContext(ContextoDeSesion);
  if (!valor) {
    throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  }
  return valor;
}
