"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { rutaDeLogin } from "@/lib/api/cliente";
import { Aviso } from "./Aviso";

/**
 * Envuelve una pantalla que necesita cuenta (Favoritos, Aportar, Perfil).
 *
 * Sin sesión lleva al login recordando a dónde iba el usuario (Fase 7 §1), y
 * mientras tanto no muestra nada del contenido protegido: así el flujo no
 * parpadea con datos vacíos antes de redirigir.
 */
export function ExigeSesion({ children }: { children: React.ReactNode }) {
  const { estado, apiDeSesionDisponible } = useSesion();
  const router = useRouter();

  useEffect(() => {
    if (estado !== "anonimo" || !apiDeSesionDisponible) return;
    router.replace(
      rutaDeLogin(`${window.location.pathname}${window.location.search}`),
    );
  }, [estado, apiDeSesionDisponible, router]);

  if (estado === "cargando") {
    return (
      <p className="px-4 py-16 text-center text-sm text-tinta-suave">
        Comprobando tu sesión…
      </p>
    );
  }

  if (estado === "anonimo") {
    // Si `GET /auth/me` deja de responder (cambia de forma, o desaparece) no
    // se puede afirmar que el usuario no tiene sesión, así que se lo decimos
    // en vez de redirigir en bucle.
    if (!apiDeSesionDisponible) {
      return (
        <div className="px-4 py-10">
          <Aviso tono="alerta">
            Esta pantalla necesita <code className="font-mono">GET /auth/me</code>{" "}
            para saber quién eres, y esa llamada no está respondiendo como se
            espera ahora mismo.
          </Aviso>
        </div>
      );
    }
    return (
      <p className="px-4 py-16 text-center text-sm text-tinta-suave">
        Te llevamos a iniciar sesión…
      </p>
    );
  }

  return <>{children}</>;
}
