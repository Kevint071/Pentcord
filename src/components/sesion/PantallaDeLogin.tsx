"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CampoDeTexto } from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { mensajeDeError, pedirApi } from "@/lib/api/cliente";

type Modo = "entrar" | "crear";

type RespuestaAuth = { user: { id: number; email: string; username: string } };

const OPCIONES: { valor: Modo; etiqueta: string }[] = [
  { valor: "entrar", etiqueta: "Entrar" },
  { valor: "crear", etiqueta: "Crear cuenta" },
];

/**
 * E.1 · Login / Registro (HU-01).
 *
 * `POST /auth/login` y `POST /auth/register` ya existen y funcionan; esta
 * pantalla es lo único que faltaba para llamarlos. `volverA` (Bloque C, Fase 7
 * §1) conserva a dónde iba el usuario y lo devuelve ahí tras autenticarse.
 */
export function PantallaDeLogin() {
  const parametros = useSearchParams();
  const volverA = parametros.get("volverA");
  const router = useRouter();
  const { refrescar } = useSesion();

  const [modo, setModo] = useState<Modo>("entrar");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erroresDeCampo, setErroresDeCampo] = useState<Record<string, string>>(
    {},
  );
  const [errorApi, setErrorApi] = useState<unknown>(null);
  const [enviando, setEnviando] = useState(false);

  function cambiarModo(siguiente: Modo) {
    setModo(siguiente);
    setErroresDeCampo({});
    setErrorApi(null);
  }

  /** Quita el error de un campo en cuanto se vuelve a escribir en él. */
  function limpiarError(campo: string) {
    setErroresDeCampo((actual) => {
      if (!(campo in actual)) return actual;
      const { [campo]: _omitido, ...resto } = actual;
      return resto;
    });
  }

  function validar(): boolean {
    const errores: Record<string, string> = {};
    if (modo === "crear" && !username.trim()) {
      errores.username = "Escribe un nombre de usuario.";
    }
    if (!email.trim()) errores.email = "Escribe tu correo.";
    if (!password) errores.password = "Escribe tu contraseña.";
    setErroresDeCampo(errores);
    return Object.keys(errores).length === 0;
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setErrorApi(null);
    if (!validar()) return;

    setEnviando(true);
    try {
      const ruta = modo === "entrar" ? "/auth/login" : "/auth/register";
      const cuerpo =
        modo === "entrar" ? { email, password } : { email, password, username };
      await pedirApi<RespuestaAuth>(ruta, { method: "POST", cuerpo });

      // `POST /auth/login` y `/auth/register` no devuelven `rol` ni
      // `fotoPerfilUrl`: se piden con `GET /auth/me` (B.2) antes de navegar,
      // para que un administrador se reconozca como tal desde el primer clic
      // en vez de esperar a la próxima revalidación de la pestaña.
      await refrescar();
      router.replace(volverA || "/");
    } catch (error) {
      setErrorApi(error);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <p className="directiva text-center">{"{sesión}"}</p>
      <h1 className="rotulo mt-3 text-center text-[clamp(2rem,8vw,2.75rem)] text-tinta">
        {modo === "entrar" ? "Inicia sesión" : "Crea tu cuenta"}
      </h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-tinta-suave">
        Buscar y ver canciones no necesita cuenta. Guardar favoritos, aportar
        contenido y entrar a tu perfil, sí.
      </p>

      <div
        role="radiogroup"
        aria-label="¿Ya tienes cuenta?"
        className="mx-auto mt-6 inline-flex rounded-full border border-pauta-fuerte bg-hoja p-0.5"
      >
        {OPCIONES.map(({ valor, etiqueta }) => {
          const activo = modo === valor;
          return (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={activo}
              tabIndex={activo ? 0 : -1}
              onClick={() => cambiarModo(valor)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activo ? "bg-tinta text-papel" : "text-tinta-suave hover:text-tinta"
              }`}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={manejarEnvio}
        noValidate
        className="mt-6 flex flex-col gap-4 rounded-2xl border border-pauta bg-hoja p-6 shadow-hoja"
      >
        {modo === "crear" ? (
          <CampoDeTexto
            etiqueta="Nombre de usuario"
            autoComplete="username"
            value={username}
            onChange={(evento) => {
              setUsername(evento.target.value);
              limpiarError("username");
            }}
            error={erroresDeCampo.username}
          />
        ) : null}
        <CampoDeTexto
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(evento) => {
            setEmail(evento.target.value);
            limpiarError("email");
          }}
          error={erroresDeCampo.email}
        />
        <CampoDeTexto
          etiqueta="Contraseña"
          type="password"
          autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          value={password}
          onChange={(evento) => {
            setPassword(evento.target.value);
            limpiarError("password");
          }}
          error={erroresDeCampo.password}
        />

        {errorApi ? <Aviso tono="alerta">{mensajeDeError(errorApi)}</Aviso> : null}

        <Boton type="submit" disabled={enviando} className="mt-1 w-full">
          {enviando
            ? modo === "entrar"
              ? "Entrando…"
              : "Creando cuenta…"
            : modo === "entrar"
              ? "Entrar"
              : "Crear cuenta"}
        </Boton>
      </form>

      {volverA ? (
        <p className="mt-4 text-center text-xs text-tinta-tenue">
          Al continuar te devolvemos a{" "}
          <code className="font-mono text-tinta-suave">{volverA}</code>.
        </p>
      ) : null}
    </div>
  );
}
