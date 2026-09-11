"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CampoDeTexto,
  IconoCandado,
  IconoPersona,
  IconoSobre,
} from "@/components/ui/Campo";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { mensajeDeError, pedirApi } from "@/lib/api/cliente";
import { googleLogin } from "@/lib/login";

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
  const { estado, refrescar } = useSesion();

  // Si ya hay sesión activa, esta pantalla no tiene nada que ofrecer: se
  // manda directo a donde iba el usuario (o al inicio).
  useEffect(() => {
    if (estado === "autenticado") router.replace(volverA || "/");
  }, [estado, volverA, router]);

  // El encabezado enlaza directo a "Registrarse" con `?modo=crear`, para no
  // hacer a quien ya sabe que quiere una cuenta pasar primero por "Entrar".
  const [modo, setModo] = useState<Modo>(
    parametros.get("modo") === "crear" ? "crear" : "entrar",
  );
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

  if (estado === "cargando" || estado === "autenticado") {
    return (
      <p className="px-4 py-16 text-center text-sm text-tinta-suave">
        Comprobando tu sesión…
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="rotulo text-center text-[clamp(2rem,8vw,2.75rem)] text-tinta">
        {modo === "entrar" ? "Inicia sesión" : "Crea tu cuenta"}
      </h1>
      <p className="mt-2 text-center text-sm leading-relaxed text-tinta-suave">
        Buscar y ver canciones no necesita cuenta. Guardar favoritos, aportar
        contenido y entrar a tu perfil, sí.
      </p>

      <div
        role="radiogroup"
        aria-label="¿Ya tienes cuenta?"
        className="relative mx-auto mt-6 grid w-full max-w-[15.5rem] grid-cols-2 rounded-full border border-pauta-fuerte bg-hoja p-1"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-tinta transition-transform duration-300 ease-out"
          style={{ transform: modo === "crear" ? "translateX(100%)" : "translateX(0)" }}
        />
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
              className={`relative z-10 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-300 ${
                activo ? "text-papel" : "text-tinta-suave hover:text-tinta"
              }`}
            >
              {etiqueta}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-pauta-fuerte bg-hoja p-6 shadow-hoja">
        <form onSubmit={manejarEnvio} noValidate className="flex flex-col gap-5">
          {modo === "crear" ? (
            <CampoDeTexto
              etiqueta="Nombre de usuario"
              icono={<IconoPersona />}
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
            icono={<IconoSobre />}
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
            icono={<IconoCandado />}
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            value={password}
            onChange={(evento) => {
              setPassword(evento.target.value);
              limpiarError("password");
            }}
            error={erroresDeCampo.password}
          />

          {errorApi ? (
            <Aviso tono="alerta">{mensajeDeError(errorApi)}</Aviso>
          ) : null}

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

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-pauta" />
          <span className="text-xs text-tinta-tenue">o</span>
          <span className="h-px flex-1 bg-pauta" />
        </div>

        <form action={googleLogin}>
          <button
            type="submit"
            className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-pauta-fuerte bg-hoja-alta px-4 py-2.5 text-sm font-medium text-tinta transition-all duration-150 hover:border-tinta-tenue hover:shadow-hoja active:scale-[0.98]"
          >
            <LogoDeGoogle />
            {modo === "entrar" ? "Entrar con Google" : "Crear cuenta con Google"}
          </button>
        </form>
      </div>

      {volverA ? (
        <p className="mt-4 text-center text-xs text-tinta-tenue">
          Al continuar te devolvemos a{" "}
          <code className="font-mono text-tinta-suave">{volverA}</code>.
        </p>
      ) : null}
    </div>
  );
}

/** El logo de Google va a color siempre, sea cual sea el tema: es su marca. */
function LogoDeGoogle() {
  return (
    <svg viewBox="0 0 18 18" className="size-[18px] shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
