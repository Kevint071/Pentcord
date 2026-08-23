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
import { useRouter } from "next/navigation";
import {
  ErrorDeApi,
  ErrorDeRed,
  pedirApi,
  rutaDeLogin,
  type OpcionesDePeticion,
} from "@/lib/api/cliente";

export type Rol = "musico" | "administrador";

export type UsuarioDeSesion = {
  id: number;
  username: string;
  email: string | null;
  rol: Rol;
  fotoPerfilUrl: string | null;
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

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoDeSesion>("cargando");
  const [usuario, setUsuario] = useState<UsuarioDeSesion | null>(null);
  const [apiDeSesionDisponible, setApiDeSesionDisponible] = useState(true);

  // Evita que dos revalidaciones simultáneas se pisen.
  const consultaEnCurso = useRef<Promise<void> | null>(null);

  const consultar = useCallback(async () => {
    try {
      const usuario = await pedirApi<UsuarioDeSesion>("/auth/me");
      setUsuario(usuario);
      setEstado("autenticado");
      setApiDeSesionDisponible(true);
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
    // No existe (todavía) un `POST /auth/logout` que borre la cookie httpOnly
    // desde el servidor — es trabajo de backend, fuera de este alcance (ver
    // docs/pendientes-backend-y-frontend.md). Mientras tanto, esto solo limpia
    // el estado local: la cookie sigue viva hasta que venza (15 min) o hasta
    // que ese endpoint exista.
    setUsuario(null);
    setEstado("anonimo");
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
