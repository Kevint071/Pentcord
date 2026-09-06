"use client";

import { useState, type FormEvent } from "react";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { CampoDeTexto } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Confirmacion } from "@/components/ui/Confirmacion";
import {
  mensajeDeCampo,
  mensajeDeError,
  type OpcionesDePeticion,
} from "@/lib/api/cliente";

type UsarApi = <T>(ruta: string, opciones?: OpcionesDePeticion) => Promise<T>;

/**
 * E · Ajustes (2026-09-05). Reúne lo que antes vivía en la sección "cuenta"
 * de Perfil (cerrar sesión, eliminar cuenta) más el cambio de contraseña,
 * nuevo en este cambio.
 */
export function Ajustes() {
  const { usuario, cerrarSesion, usarApi } = useSesion();

  if (!usuario) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <h1 className="rotulo text-[clamp(2rem,8vw,3.25rem)] text-tinta">
        Ajustes
      </h1>

      <section className="mt-6 border-t border-pauta pt-6">
        {usuario.metodoAutenticacion === "google" ? (
          <Aviso tono="neutro">
            Tu cuenta usa Google para entrar: no tiene una contraseña propia
            que cambiar aquí.
          </Aviso>
        ) : (
          <FormularioDeContrasena usarApi={usarApi} />
        )}
      </section>

      <section className="mt-8 border-t border-pauta pt-6">
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" onClick={() => void cerrarSesion()}>
            Cerrar sesión
          </Boton>
          <EliminarCuenta onEliminar={() => usarApi("/usuarios", { method: "DELETE" })} />
        </div>
      </section>
    </div>
  );
}

function FormularioDeContrasena({ usarApi }: { usarApi: UsarApi }) {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [erroresDeCampo, setErroresDeCampo] = useState<Record<string, string>>({});
  const [errorApi, setErrorApi] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);

  function limpiarError(campo: string) {
    setErroresDeCampo((actual) => {
      if (!(campo in actual)) return actual;
      const { [campo]: _omitido, ...resto } = actual;
      return resto;
    });
  }

  function validar(): boolean {
    const errores: Record<string, string> = {};
    if (!passwordActual) errores.passwordActual = "Escribe tu contraseña actual.";
    if (passwordNueva.length < 8) {
      errores.passwordNueva = "La contraseña nueva debe tener al menos 8 caracteres.";
    }
    if (passwordConfirmar !== passwordNueva) {
      errores.passwordConfirmar = "Las contraseñas nuevas no coinciden.";
    }
    setErroresDeCampo(errores);
    return Object.keys(errores).length === 0;
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setErrorApi(null);
    setExito(false);
    if (!validar()) return;

    setEnviando(true);
    try {
      await usarApi("/usuarios/me/password", {
        method: "PATCH",
        cuerpo: { passwordActual, passwordNueva },
      });
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
      setExito(true);
    } catch (causa) {
      const errorDeCampo = mensajeDeCampo(causa, "passwordActual");
      if (errorDeCampo) {
        setErroresDeCampo((actual) => ({ ...actual, passwordActual: errorDeCampo }));
      } else {
        setErrorApi(causa);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="mt-3 flex max-w-sm flex-col gap-4">
      <CampoDeTexto
        etiqueta="Contraseña actual"
        type="password"
        autoComplete="current-password"
        value={passwordActual}
        onChange={(evento) => {
          setPasswordActual(evento.target.value);
          limpiarError("passwordActual");
        }}
        error={erroresDeCampo.passwordActual}
      />
      <CampoDeTexto
        etiqueta="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        value={passwordNueva}
        onChange={(evento) => {
          setPasswordNueva(evento.target.value);
          limpiarError("passwordNueva");
        }}
        error={erroresDeCampo.passwordNueva}
      />
      <CampoDeTexto
        etiqueta="Confirmar contraseña nueva"
        type="password"
        autoComplete="new-password"
        value={passwordConfirmar}
        onChange={(evento) => {
          setPasswordConfirmar(evento.target.value);
          limpiarError("passwordConfirmar");
        }}
        error={erroresDeCampo.passwordConfirmar}
      />

      {errorApi ? <Aviso tono="alerta">{mensajeDeError(errorApi)}</Aviso> : null}
      {exito ? <Aviso tono="neutro">Contraseña actualizada.</Aviso> : null}

      <Boton type="submit" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Cambiar contraseña"}
      </Boton>
    </form>
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
