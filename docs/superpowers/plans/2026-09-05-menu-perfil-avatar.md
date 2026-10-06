# Menú de perfil con avatar, Ajustes y Preferencias — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el ítem "Perfil" del riel de navegación por un avatar con menú (Favoritos, Perfil, Ajustes, Preferencias); mover cambiar-contraseña/eliminar-cuenta/cerrar-sesión a `/cuenta` y el tema claro/oscuro a `/preferencias`, guardando el tema en la cuenta.

**Architecture:** Dos endpoints nuevos (`PATCH /usuarios/me/tema`, `PATCH /usuarios/me/password`) son los primeros en usar el catálogo de errores (`errorResponse`/`ApiError`) — el resto de la API sigue sin migrar (B.0). El frontend extrae el núcleo de tema a `src/lib/tema/tema.ts` (compartido entre el interruptor y Preferencias) y añade un módulo puro `colorDeAvatar` + componente `Avatar` reutilizado en el encabezado y en Perfil. La navegación se reparte entre `destinos.tsx` (Buscar/Aportar, sin cambios de patrón) y el nuevo `MenuDePerfil.tsx` (Favoritos/Perfil/Ajustes/Preferencias).

**Tech Stack:** Next.js 16 (route handlers), Prisma 7 (`prisma-client` generator), Vitest 4 + Testing Library, Tailwind v4 (tokens semánticos en `globals.css`).

**Spec:** `docs/superpowers/specs/2026-09-05-menu-perfil-avatar-design.md`

## Global Constraints

- Backend es una **excepción puntual** confirmada por el usuario a [[feedback_no-tocar-backend]] — solo estos dos endpoints + el campo `tema` + los dos campos nuevos en `GET /auth/me`. No tocar nada más de la API.
- Los dos endpoints nuevos usan `errorResponse()` / `ApiError` / `toErrorResponse()` de `src/lib/errors.ts` (código nuevo del catálogo), **no** el formato legado `{ error: "texto" }` que usa el resto de la API hoy (B.0 sigue pendiente para los demás).
- Migración de Prisma: el agente ejecuta `npx prisma migrate dev` directamente contra la base configurada en `.env` (confirmado con el usuario — no hay base de prueba separada, B.1 sigue pendiente).
- Favoritos sale del riel de navegación por completo; vive solo dentro del menú del avatar.
- Rutas: Ajustes vive en `/cuenta` (no `/ajustes`); Preferencias en `/preferencias`.
- Color del avatar: determinista por `id` numérico del usuario (no `username`, no aleatorio).
- El icono de tema del encabezado se queda donde está y hace lo mismo que el control de Preferencias — control duplicado sobre el mismo estado, no se elimina.
- Todo el trabajo de este plan implica actualizar `docs/plan-implementacion-mvp.md` al terminar ([[feedback_actualizar-plan]]) — es la Task 13.

---

## Task 1: Migración de esquema — campo `tema` en `User`

**Files:**
- Modify: `prisma/schema.prisma`
- (genera) `prisma/migrations/<timestamp>_agregar_tema_usuario/migration.sql`

**Interfaces:**
- Produces: `User.tema: string | null` en el cliente de Prisma generado (`@/generated/prisma/client`), consumido por las Tasks 2 y 4.

- [ ] **Step 1: Añadir el campo al schema**

En `prisma/schema.prisma`, dentro de `model User`, justo debajo de `fotoPerfilUrl`:

```prisma
  fotoPerfilUrl       String?             @map("foto_perfil_url")
  tema                String?             @db.VarChar(10) @map("tema")
  creadoEn            DateTime            @default(now()) @map("creado_en")
```

- [ ] **Step 2: Generar y aplicar la migración**

Run: `npx prisma migrate dev --name agregar_tema_usuario`

Expected: crea `prisma/migrations/<timestamp>_agregar_tema_usuario/migration.sql` con un `ALTER TABLE "users" ADD COLUMN "tema" VARCHAR(10);`, la aplica contra la base de `.env`, y regenera el cliente en `src/generated/prisma`. Sin prompts destructivos (columna nueva nullable).

- [ ] **Step 3: Verificar que el cliente ve el campo nuevo**

Run: `npx tsc --noEmit`

Expected: sin errores nuevos (el campo `tema` ya es válido en `prisma.user.update({ data: { tema } })` cuando se use en la Task 2).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): agregar campo tema opcional a User"
```

---

## Task 2: `PATCH /api/v1/usuarios/me/tema`

**Files:**
- Create: `src/app/api/v1/usuarios/me/tema/route.ts`
- Test: `src/tests/app/api/v1/usuarios/me/tema/route.test.ts`

**Interfaces:**
- Consumes: `getUserFromToken(request)` → `{ userId, userdb, error }` (`src/lib/getUserFromToken.ts`); `prisma.user.update` (`@/lib/prisma`); `errorResponse`, `ApiError`, `toErrorResponse` (`@/lib/errors`).
- Produces: `PATCH /api/v1/usuarios/me/tema` — 200 `{ tema: "light" | "dark" }`; 400 `VALIDATION_ERROR` (`details.campo: "tema"`) si el valor no es `"light"`/`"dark"`; 401 `UNAUTHENTICATED` sin sesión. Consumido por la Task 5 (`InterruptorDeTema`).

- [ ] **Step 1: Escribir los tests, en rojo**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserFromTokenMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/getUserFromToken", () => ({
  getUserFromToken: (...args: unknown[]) => getUserFromTokenMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: (...args: unknown[]) => updateMock(...args) } },
}));

const { PATCH } = await import("@/app/api/v1/usuarios/me/tema/route");

function crearRequest(body: unknown) {
  return new Request("http://localhost/api/v1/usuarios/me/tema", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: "accesstoken=t" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/v1/usuarios/me/tema", () => {
  beforeEach(() => {
    getUserFromTokenMock.mockReset();
    updateMock.mockReset();
  });

  it("rechaza un valor que no sea light/dark", async () => {
    getUserFromTokenMock.mockResolvedValue({ userId: 7, userdb: {}, error: null });

    const response = await PATCH(crearRequest({ tema: "azul" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual({ campo: "tema" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("persiste el tema y responde 200", async () => {
    getUserFromTokenMock.mockResolvedValue({ userId: 7, userdb: {}, error: null });
    updateMock.mockResolvedValue({});

    const response = await PATCH(crearRequest({ tema: "dark" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ tema: "dark" });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { tema: "dark" },
    });
  });

  it("responde 401 sin sesión, sin tocar la base", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: null,
      userdb: null,
      error: { message: "No autenticado", status: 401 },
    });

    const response = await PATCH(crearRequest({ tema: "dark" }));

    expect(response.status).toBe(401);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
```

Run: `npx vitest run src/tests/app/api/v1/usuarios/me/tema/route.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/v1/usuarios/me/tema/route'`.

- [ ] **Step 2: Implementar el route handler**

```ts
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { prisma } from "@/lib/prisma";
import { ApiError, errorResponse, toErrorResponse } from "@/lib/errors";

export async function PATCH(request: Request) {
  const { userId, error } = await getUserFromToken(request);
  if (error || !userId) {
    return errorResponse(error?.status === 404 ? "NOT_FOUND" : "UNAUTHENTICATED", error?.message);
  }

  try {
    const { tema } = (await request.json()) as { tema?: unknown };

    if (tema !== "light" && tema !== "dark") {
      throw new ApiError("VALIDATION_ERROR", undefined, { campo: "tema" });
    }

    await prisma.user.update({ where: { id: userId }, data: { tema } });

    return NextResponse.json({ tema }, { status: 200 });
  } catch (causa) {
    return toErrorResponse(causa);
  }
}
```

- [ ] **Step 3: Verificar en verde**

Run: `npx vitest run src/tests/app/api/v1/usuarios/me/tema/route.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/usuarios/me/tema src/tests/app/api/v1/usuarios/me/tema
git commit -m "feat(api): agregar PATCH /usuarios/me/tema"
```

---

## Task 3: `PATCH /api/v1/usuarios/me/password`

**Files:**
- Create: `src/app/api/v1/usuarios/me/password/route.ts`
- Test: `src/tests/app/api/v1/usuarios/me/password/route.test.ts`

**Interfaces:**
- Consumes: `getUserFromToken`, `prisma.user.update`, `bcrypt.compare`/`bcrypt.hash` (`bcryptjs`, ya en `dependencies`), `errorResponse`/`ApiError`/`toErrorResponse`.
- Produces: `PATCH /api/v1/usuarios/me/password` — 200 `{ message: "Contraseña actualizada" }`; 400 `VALIDATION_ERROR` con `details.campo` en `"passwordNueva"` o `"passwordActual"` según el caso, o sin `details` si la cuenta es de Google. Consumido por la Task 11 (`Ajustes`).

- [ ] **Step 1: Escribir los tests, en rojo**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserFromTokenMock = vi.fn();
const updateMock = vi.fn();
const compareMock = vi.fn();
const hashMock = vi.fn();

vi.mock("@/lib/getUserFromToken", () => ({
  getUserFromToken: (...args: unknown[]) => getUserFromTokenMock(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: (...args: unknown[]) => updateMock(...args) } },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: (...args: unknown[]) => compareMock(...args),
    hash: (...args: unknown[]) => hashMock(...args),
  },
}));

const { PATCH } = await import("@/app/api/v1/usuarios/me/password/route");

function crearRequest(body: unknown) {
  return new Request("http://localhost/api/v1/usuarios/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: "accesstoken=t" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/v1/usuarios/me/password", () => {
  beforeEach(() => {
    getUserFromTokenMock.mockReset();
    updateMock.mockReset();
    compareMock.mockReset();
    hashMock.mockReset();
  });

  it("rechaza cuentas de Google", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: { metodoAutenticacion: "google", password: null },
      error: null,
    });

    const response = await PATCH(
      crearRequest({ passwordActual: "x", passwordNueva: "unaClave123" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe(
      "Tu cuenta usa Google, no tiene contraseña que cambiar.",
    );
    expect(compareMock).not.toHaveBeenCalled();
  });

  it("rechaza una contraseña nueva de menos de 8 caracteres", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: { metodoAutenticacion: "local", password: "hash" },
      error: null,
    });

    const response = await PATCH(
      crearRequest({ passwordActual: "x", passwordNueva: "corta" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details).toEqual({ campo: "passwordNueva" });
    expect(compareMock).not.toHaveBeenCalled();
  });

  it("rechaza la contraseña actual incorrecta", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: { metodoAutenticacion: "local", password: "hash" },
      error: null,
    });
    compareMock.mockResolvedValue(false);

    const response = await PATCH(
      crearRequest({ passwordActual: "mala", passwordNueva: "unaClave123" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.details).toEqual({ campo: "passwordActual" });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("actualiza el hash cuando la contraseña actual es correcta", async () => {
    getUserFromTokenMock.mockResolvedValue({
      userId: 7,
      userdb: { metodoAutenticacion: "local", password: "hash-viejo" },
      error: null,
    });
    compareMock.mockResolvedValue(true);
    hashMock.mockResolvedValue("hash-nuevo");
    updateMock.mockResolvedValue({});

    const response = await PATCH(
      crearRequest({ passwordActual: "buena", passwordNueva: "unaClave123" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ message: "Contraseña actualizada" });
    expect(hashMock).toHaveBeenCalledWith("unaClave123", 10);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { password: "hash-nuevo" },
    });
  });
});
```

Run: `npx vitest run src/tests/app/api/v1/usuarios/me/password/route.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 2: Implementar el route handler**

```ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { prisma } from "@/lib/prisma";
import { ApiError, errorResponse, toErrorResponse } from "@/lib/errors";

export async function PATCH(request: Request) {
  const { userId, userdb, error } = await getUserFromToken(request);
  if (error || !userId || !userdb) {
    return errorResponse(error?.status === 404 ? "NOT_FOUND" : "UNAUTHENTICATED", error?.message);
  }

  try {
    const { passwordActual, passwordNueva } = (await request.json()) as {
      passwordActual?: unknown;
      passwordNueva?: unknown;
    };

    if (userdb.metodoAutenticacion !== "local") {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Tu cuenta usa Google, no tiene contraseña que cambiar.",
      );
    }

    if (typeof passwordNueva !== "string" || passwordNueva.length < 8) {
      throw new ApiError("VALIDATION_ERROR", undefined, { campo: "passwordNueva" });
    }

    const actual = typeof passwordActual === "string" ? passwordActual : "";
    const coincide = userdb.password ? await bcrypt.compare(actual, userdb.password) : false;
    if (!coincide) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "La contraseña actual no es correcta.",
        { campo: "passwordActual" },
      );
    }

    const hash = await bcrypt.hash(passwordNueva, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hash } });

    return NextResponse.json({ message: "Contraseña actualizada" }, { status: 200 });
  } catch (causa) {
    return toErrorResponse(causa);
  }
}
```

- [ ] **Step 3: Verificar en verde**

Run: `npx vitest run src/tests/app/api/v1/usuarios/me/password/route.test.ts`
Expected: PASS (4 pruebas).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/usuarios/me/password src/tests/app/api/v1/usuarios/me/password
git commit -m "feat(api): agregar PATCH /usuarios/me/password"
```

---

## Task 4: `GET /auth/me` suma `tema` y `metodoAutenticacion`; tipo de sesión

**Files:**
- Modify: `src/app/api/v1/auth/me/route.ts`
- Modify: `src/lib/sesion/SesionProvider.tsx`

**Interfaces:**
- Produces: `UsuarioDeSesion` gana `tema: "light" | "dark" | null` y `metodoAutenticacion: "local" | "google"`, consumidos por la Task 6 (aplicar tema) y la Task 11 (`Ajustes`, para ocultar el formulario de contraseña en cuentas Google).

- [ ] **Step 1: Sumar los dos campos al payload de `GET /auth/me`**

En `src/app/api/v1/auth/me/route.ts`, dentro del `NextResponse.json` de éxito:

```ts
    return NextResponse.json(
      {
        id: userdb.id,
        username: userdb.username,
        email: userdb.email,
        rol: userdb.rol,
        fotoPerfilUrl: userdb.fotoPerfilUrl,
        creadoEn: userdb.creadoEn,
        tema: userdb.tema,
        metodoAutenticacion: userdb.metodoAutenticacion,
      },
      { status: 200 },
    );
```

- [ ] **Step 2: Sumar los campos al tipo `UsuarioDeSesion`**

En `src/lib/sesion/SesionProvider.tsx`, junto a `export type Rol = "musico" | "administrador";`:

```ts
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
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos (nada más construye un `UsuarioDeSesion` a mano fuera de `SesionProvider`; los tests que lo mockean como objeto literal en la Task 10 no pasan por el tipo).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/v1/auth/me/route.ts src/lib/sesion/SesionProvider.tsx
git commit -m "feat(api): sumar tema y metodoAutenticacion a GET /auth/me"
```

---

## Task 5: Núcleo de tema compartido (`src/lib/tema/tema.ts`) + `InterruptorDeTema` guarda en cuenta

**Files:**
- Create: `src/lib/tema/tema.ts`
- Modify: `src/components/tema/InterruptorDeTema.tsx`
- Test: `src/tests/components/tema/InterruptorDeTema.test.tsx`

**Interfaces:**
- Produces: `EVENTO_DE_TEMA: string`, `leerTema(): "light" | "dark"`, `aplicarTema(tema: "light" | "dark"): void`, `type Tema = "light" | "dark"`. Consumidos por la Task 6 (`SesionProvider`) y la Task 12 (`Preferencias`).
- Consumes: `useSesion()` → `{ estado, usarApi }` (`@/lib/sesion/SesionProvider`, ya con el tipo de la Task 4).

- [ ] **Step 1: Crear el módulo compartido**

```ts
/**
 * Núcleo de tema, compartido entre el interruptor del encabezado y
 * Preferencias (2026-09-05). El tema real no vive en React: vive en el
 * atributo `data-theme` del documento (lo pone el guion previo al pintado) y
 * en la preferencia del sistema.
 */
import { CLAVE_DE_TEMA } from "@/components/tema/guionDeTema";

export type Tema = "light" | "dark";

export const EVENTO_DE_TEMA = "pentcord:tema";

export function leerTema(): Tema {
  const marcado = document.documentElement.getAttribute("data-theme");
  if (marcado === "light" || marcado === "dark") return marcado;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Aplica el tema al documento y avisa a quien esté suscrito, solo si cambia. */
export function aplicarTema(tema: Tema) {
  if (leerTema() === tema) return;
  document.documentElement.setAttribute("data-theme", tema);
  try {
    localStorage.setItem(CLAVE_DE_TEMA, tema);
  } catch {
    // Modo privado o almacenamiento bloqueado: el tema dura esta sesión.
  }
  window.dispatchEvent(new Event(EVENTO_DE_TEMA));
}
```

Guarda esto en `src/lib/tema/tema.ts` (crea la carpeta).

- [ ] **Step 2: Escribir el test de `InterruptorDeTema`, en rojo**

```tsx
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterruptorDeTema } from "@/components/tema/InterruptorDeTema";

const usarApi = vi.fn().mockResolvedValue(undefined);
const usarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion/SesionProvider", () => ({ useSesion: usarSesion }));

window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  usarApi.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("InterruptorDeTema", () => {
  test("con sesión, alternar guarda el tema en la cuenta", async () => {
    usarSesion.mockReturnValue({ estado: "autenticado", usarApi });
    const user = userEvent.setup();
    render(<InterruptorDeTema />);

    await user.click(screen.getByRole("button"));

    expect(usarApi).toHaveBeenCalledWith("/usuarios/me/tema", {
      method: "PATCH",
      cuerpo: { tema: "dark" },
    });
  });

  test("sin sesión, alternar no llama a la API", async () => {
    usarSesion.mockReturnValue({ estado: "anonimo", usarApi });
    const user = userEvent.setup();
    render(<InterruptorDeTema />);

    await user.click(screen.getByRole("button"));

    expect(usarApi).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  test("un fallo de red al guardar no rompe el cambio local", async () => {
    usarApi.mockRejectedValueOnce(new Error("red caída"));
    usarSesion.mockReturnValue({ estado: "autenticado", usarApi });
    const user = userEvent.setup();
    render(<InterruptorDeTema />);

    await user.click(screen.getByRole("button"));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
```

Run: `npx vitest run src/tests/components/tema/InterruptorDeTema.test.tsx`
Expected: FAIL — `InterruptorDeTema` todavía no importa `useSesion` ni llama a `usarApi`, así que el primer test falla (`usarApi` no se llama).

- [ ] **Step 3: Refactorizar `InterruptorDeTema.tsx`**

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { EVENTO_DE_TEMA, aplicarTema, leerTema, type Tema } from "@/lib/tema/tema";

function suscribirse(alCambiar: () => void) {
  const consulta = window.matchMedia("(prefers-color-scheme: dark)");
  consulta.addEventListener("change", alCambiar);
  window.addEventListener(EVENTO_DE_TEMA, alCambiar);
  return () => {
    consulta.removeEventListener("change", alCambiar);
    window.removeEventListener(EVENTO_DE_TEMA, alCambiar);
  };
}

export function InterruptorDeTema({ className = "" }: { className?: string }) {
  // En el servidor no se sabe qué tema resolverá el navegador, así que el botón
  // se dibuja neutro hasta hidratar en vez de adivinar y corregirse después.
  const tema = useSyncExternalStore<Tema | null>(suscribirse, leerTema, () => null);
  const { estado, usarApi } = useSesion();

  function alternar() {
    const siguiente: Tema = leerTema() === "dark" ? "light" : "dark";
    aplicarTema(siguiente);
    if (estado === "autenticado") {
      usarApi("/usuarios/me/tema", { method: "PATCH", cuerpo: { tema: siguiente } }).catch(
        () => {},
      );
    }
  }

  const vaAOscuro = tema !== "dark";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={vaAOscuro ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      title={vaAOscuro ? "Modo oscuro" : "Modo claro"}
      className={`grid size-9 place-items-center rounded-full border border-pauta text-tinta-suave transition-colors hover:border-pauta-fuerte hover:text-tinta ${className}`}
    >
      {tema === null ? (
        <span
          aria-hidden="true"
          className="size-4 rounded-full border border-current opacity-40"
        />
      ) : vaAOscuro ? (
        <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
          <path
            d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Verificar en verde**

Run: `npx vitest run src/tests/components/tema/InterruptorDeTema.test.tsx`
Expected: PASS (3 pruebas). También correr `npx vitest run src/tests/components/nav/Encabezado.test.tsx` para confirmar que sigue en verde (ningún test de ese archivo hace click en el interruptor, así que el nuevo `useSesion()` que ahora también pide `usarApi` no debe romper nada).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tema/tema.ts src/components/tema/InterruptorDeTema.tsx src/tests/components/tema/InterruptorDeTema.test.tsx
git commit -m "feat(tema): guardar el tema en la cuenta al alternarlo con sesión"
```

---

## Task 6: `SesionProvider` aplica el tema de la cuenta al iniciar sesión

**Files:**
- Modify: `src/lib/sesion/SesionProvider.tsx`
- Test: `src/tests/lib/sesion/SesionProvider.test.tsx`

**Interfaces:**
- Consumes: `aplicarTema`, `leerTema` (`@/lib/tema/tema`, Task 5).

- [ ] **Step 1: Escribir el test, en rojo**

```tsx
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SesionProvider, useSesion } from "@/lib/sesion/SesionProvider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function respuestaFalsa(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function Sonda() {
  const { estado } = useSesion();
  return <span>{estado}</span>;
}

let fetchSimulado: ReturnType<typeof vi.fn>;

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  fetchSimulado = vi.fn();
  vi.stubGlobal("fetch", fetchSimulado);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("SesionProvider · tema de cuenta", () => {
  test("aplica el tema de la cuenta si difiere del local al resolver /auth/me", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    fetchSimulado.mockResolvedValue(
      respuestaFalsa({
        id: 1,
        username: "ana",
        email: "a@a.com",
        rol: "musico",
        fotoPerfilUrl: null,
        tema: "dark",
        metodoAutenticacion: "local",
      }),
    );

    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );

    await screen.findByText("autenticado");
    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark"),
    );
  });

  test("no toca el tema si la cuenta no tiene preferencia guardada", async () => {
    document.documentElement.setAttribute("data-theme", "light");
    fetchSimulado.mockResolvedValue(
      respuestaFalsa({
        id: 1,
        username: "ana",
        email: "a@a.com",
        rol: "musico",
        fotoPerfilUrl: null,
        tema: null,
        metodoAutenticacion: "local",
      }),
    );

    render(
      <SesionProvider>
        <Sonda />
      </SesionProvider>,
    );

    await screen.findByText("autenticado");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
```

Run: `npx vitest run src/tests/lib/sesion/SesionProvider.test.tsx`
Expected: FAIL — el primer test falla porque `consultar()` todavía no aplica `usuario.tema`.

- [ ] **Step 2: Aplicar el tema en `consultar()`**

En `src/lib/sesion/SesionProvider.tsx`, sumar el import y el efecto:

```ts
import { aplicarTema, leerTema } from "@/lib/tema/tema";
```

```ts
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
```

(el resto de la función, incluido el `catch`, no cambia).

- [ ] **Step 3: Verificar en verde**

Run: `npx vitest run src/tests/lib/sesion/SesionProvider.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 4: Commit**

```bash
git add src/lib/sesion/SesionProvider.tsx src/tests/lib/sesion/SesionProvider.test.tsx
git commit -m "feat(sesion): aplicar el tema guardado en la cuenta al iniciar sesión"
```

---

## Task 7: `colorDeAvatar` — color determinista por id

**Files:**
- Create: `src/lib/avatar/colorDeAvatar.ts`
- Test: `src/tests/lib/avatar/colorDeAvatar.test.ts`

**Interfaces:**
- Produces: `colorDeAvatar(id: number): string`. Consumido por la Task 8 (`Avatar`).

- [ ] **Step 1: Escribir el test, en rojo**

```ts
import { describe, expect, it } from "vitest";
import { colorDeAvatar } from "@/lib/avatar/colorDeAvatar";

describe("colorDeAvatar", () => {
  it("es determinista: el mismo id siempre da el mismo color", () => {
    expect(colorDeAvatar(42)).toBe(colorDeAvatar(42));
  });

  it.each([
    [0, "#2a4b8d"],
    [1, "#1f6f5c"],
    [8, "#2a4b8d"],
    [123, "#7a4419"],
  ])("id %i mapea al color %s de la paleta", (id, esperado) => {
    expect(colorDeAvatar(id)).toBe(esperado);
  });

  it("dos ids distintos pueden dar colores distintos (la paleta tiene 8 tonos)", () => {
    const colores = new Set(
      Array.from({ length: 8 }, (_, i) => colorDeAvatar(i)),
    );
    expect(colores.size).toBe(8);
  });

  it("devuelve siempre un color con contraste suficiente contra blanco (≥ 4.5:1)", () => {
    for (let id = 0; id < 16; id++) {
      const hex = colorDeAvatar(id);
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
```

Run: `npx vitest run src/tests/lib/avatar/colorDeAvatar.test.ts`
Expected: FAIL — módulo no existe.

- [ ] **Step 2: Implementar**

```ts
/**
 * Color determinista del avatar por `id` numérico de usuario (no `username`:
 * es estable aunque cambie de nombre). Los ocho tonos son "tinta sobre papel"
 * emparentados con `--color-acorde` pero de matiz distinto, todos con
 * contraste ≥ 4.5:1 contra blanco (la inicial se pinta en blanco encima).
 */
const PALETA_AVATAR: readonly string[] = [
  "#2a4b8d", // índigo
  "#1f6f5c", // verde azulado
  "#6b4fa0", // violeta
  "#a13d63", // vino
  "#9c3c1a", // óxido
  "#4a5568", // pizarra
  "#7a4419", // marrón
  "#2f6b3a", // verde bosque
];

export function colorDeAvatar(id: number): string {
  const suma = Math.abs(Math.trunc(id))
    .toString()
    .split("")
    .reduce((total, digito) => total + Number(digito), 0);
  return PALETA_AVATAR[suma % PALETA_AVATAR.length];
}
```

- [ ] **Step 3: Verificar en verde**

Run: `npx vitest run src/tests/lib/avatar/colorDeAvatar.test.ts`
Expected: PASS (4 pruebas). `123` → dígitos `1+2+3=6` → `6 % 8 = 6` → `PALETA_AVATAR[6]` = `"#7a4419"`, que es el valor ya usado en el test del Step 1.

- [ ] **Step 4: Commit**

```bash
git add src/lib/avatar/colorDeAvatar.ts src/tests/lib/avatar/colorDeAvatar.test.ts
git commit -m "feat(avatar): color determinista por id de usuario"
```

---

## Task 8: Componente `Avatar` + `Perfil` lo reutiliza

**Files:**
- Create: `src/components/perfil/Avatar.tsx`
- Modify: `src/components/perfil/Perfil.tsx`
- Test: `src/tests/components/perfil/Avatar.test.tsx`

**Interfaces:**
- Consumes: `colorDeAvatar` (`@/lib/avatar/colorDeAvatar`, Task 7).
- Produces: `<Avatar id username fotoPerfilUrl tamano?="sm"|"md"|"lg">`. Consumido por la Task 10 (`MenuDePerfil`) y por este mismo `Perfil.tsx`.

- [ ] **Step 1: Escribir el test, en rojo**

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/perfil/Avatar";

describe("Avatar", () => {
  test("con fotoPerfilUrl, muestra la imagen", () => {
    render(<Avatar id={1} username="ana" fotoPerfilUrl="https://x/foto.jpg" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://x/foto.jpg");
  });

  test("sin fotoPerfilUrl, muestra la inicial en mayúscula sobre un color", () => {
    render(<Avatar id={1} username="ana" fotoPerfilUrl={null} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/tests/components/perfil/Avatar.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 2: Implementar `Avatar.tsx`**

```tsx
import { colorDeAvatar } from "@/lib/avatar/colorDeAvatar";

type Tamano = "sm" | "md" | "lg";

const TAMANOS: Record<Tamano, string> = {
  sm: "size-8 text-sm",
  md: "size-11 text-base",
  lg: "size-20 text-2xl",
};

export function Avatar({
  id,
  username,
  fotoPerfilUrl,
  tamano = "md",
}: {
  id: number;
  username: string;
  fotoPerfilUrl: string | null;
  tamano?: Tamano;
}) {
  const base = `shrink-0 overflow-hidden rounded-full border border-pauta ${TAMANOS[tamano]}`;

  if (fotoPerfilUrl) {
    return (
      <div className={`${base} bg-hoja`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- viene de Cloudinary, no del build local. */}
        <img src={fotoPerfilUrl} alt="" className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`rotulo grid place-items-center text-papel ${base}`}
      style={{ backgroundColor: colorDeAvatar(id) }}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  );
}
```

- [ ] **Step 3: Verificar en verde**

Run: `npx vitest run src/tests/components/perfil/Avatar.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 4: `Perfil.tsx` usa `Avatar` en `FotoDePerfil`**

En `src/components/perfil/Perfil.tsx`, sumar el import:

```tsx
import { Avatar } from "@/components/perfil/Avatar";
```

Reemplazar la llamada a `FotoDePerfil` (dentro de `Perfil()`):

```tsx
      <FotoDePerfil
        id={usuario.id}
        username={usuario.username}
        fotoActual={usuario.fotoPerfilUrl}
        onSubida={(url) => establecerUsuario({ ...usuario, fotoPerfilUrl: url })}
        subir={(cuerpoCrudo) =>
          usarApi<{ url: string }>("/usuarios/me/foto", {
            method: "POST",
            cuerpoCrudo,
          })
        }
      />
```

Reemplazar la función `FotoDePerfil` entera por:

```tsx
function FotoDePerfil({
  id,
  username,
  fotoActual,
  onSubida,
  subir,
}: {
  id: number;
  username: string;
  fotoActual: string | null;
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
      <Avatar id={id} username={username} fotoPerfilUrl={fotoActual} tamano="lg" />
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
```

- [ ] **Step 5: Verificar que nada se rompió**

Run: `npx tsc --noEmit && npx vitest run`
Expected: sin errores de tipos; la suite sigue en el mismo verde de antes (no hay test de `Perfil.tsx` que dependiera del placeholder gris viejo).

- [ ] **Step 6: Commit**

```bash
git add src/components/perfil/Avatar.tsx src/components/perfil/Perfil.tsx src/tests/components/perfil/Avatar.test.tsx
git commit -m "feat(perfil): avatar con color determinista en vez del placeholder gris"
```

---

## Task 9: Iconos de navegación compartidos + `destinos.tsx` recortado

**Files:**
- Create: `src/components/nav/iconos.tsx`
- Modify: `src/components/nav/destinos.tsx`
- Modify: `src/tests/components/nav/destinos.test.ts`

**Interfaces:**
- Produces: `IconoBuscar`, `IconoFavoritos`, `IconoAportar`, `IconoPerfil`, `IconoAjustes`, `IconoPreferencias` (todas `(props: { className?: string }) => React.ReactElement`). `IconoFavoritos`, `IconoPerfil`, `IconoAjustes`, `IconoPreferencias` los consume la Task 10 (`MenuDePerfil`); `IconoBuscar`/`IconoAportar` los consume `destinos.tsx` en este mismo task.

- [ ] **Step 1: Crear `iconos.tsx`, moviendo los cuatro iconos existentes y sumando dos**

```tsx
/**
 * Iconos de navegación: los cuatro de siempre (Buscar/Favoritos/Aportar/
 * Perfil, C.2) más los dos nuevos del menú de perfil (Ajustes, Preferencias,
 * 2026-09-05). Centralizados aquí para que `destinos.tsx` y `MenuDePerfil.tsx`
 * compartan el mismo trazo.
 */

const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function IconoBuscar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="6.2" {...trazo} />
      <path d="m15.6 15.6 4 4" {...trazo} />
    </svg>
  );
}

export function IconoFavoritos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z"
        {...trazo}
      />
    </svg>
  );
}

export function IconoAportar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" {...trazo} />
    </svg>
  );
}

export function IconoPerfil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="8.6" r="3.5" {...trazo} />
      <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" {...trazo} />
    </svg>
  );
}

export function IconoAjustes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" {...trazo} />
      <path
        d="M12 3.5v2.3M12 18.2v2.3M20.5 12h-2.3M5.8 12H3.5M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3"
        {...trazo}
      />
    </svg>
  );
}

export function IconoPreferencias({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...trazo} />
      <circle cx="13" cy="7" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
```

- [ ] **Step 2: Recortar `destinos.tsx` a Buscar + Aportar**

Reemplazar el archivo entero por:

```tsx
/**
 * C.2 · Los destinos de la barra fija (Fase 7 §1), recortados el 2026-09-05:
 * Favoritos y Perfil se mudaron al menú del avatar (`MenuDePerfil.tsx`) y ya
 * no viven en el riel. Sus iconos se conservan en `iconos.tsx` para ese menú.
 *
 * El panel de administración NO está aquí a propósito: vive dentro de Perfil y
 * solo aparece si el rol es `administrador`.
 */
import { IconoAportar, IconoBuscar } from "./iconos";

export type Destino = {
  href: string;
  etiqueta: string;
  /** Redirige a login si no hay sesión, recordando a dónde iba. */
  exigeSesion: boolean;
  icono: (props: { className?: string }) => React.ReactElement;
};

export const DESTINOS: Destino[] = [
  { href: "/", etiqueta: "Buscar", exigeSesion: false, icono: IconoBuscar },
  { href: "/aportar", etiqueta: "Aportar", exigeSesion: true, icono: IconoAportar },
];

/** El destino activo es el de la ruta más específica que coincide. */
export function esDestinoActivo(href: string, ruta: string) {
  if (href === "/") {
    // Buscar también manda mientras se navega el catálogo público.
    return (
      ruta === "/" ||
      ruta.startsWith("/canciones") ||
      ruta.startsWith("/versiones")
    );
  }
  return ruta === href || ruta.startsWith(`${href}/`);
}
```

- [ ] **Step 3: Actualizar `destinos.test.ts` a los dos destinos nuevos**

Reemplazar el archivo entero por:

```ts
import { describe, expect, test } from "vitest";
import { DESTINOS, esDestinoActivo } from "@/components/nav/destinos";

describe("barra de navegación fija (C.2, recortada el 2026-09-05)", () => {
  test("tiene exactamente Buscar y Aportar; Favoritos y Perfil viven en el menú del avatar", () => {
    expect(DESTINOS.map((d) => d.etiqueta)).toEqual(["Buscar", "Aportar"]);
  });

  test("no incluye el panel de administración", () => {
    const etiquetas = DESTINOS.map((d) => d.etiqueta.toLowerCase()).join(" ");
    expect(etiquetas).not.toContain("admin");
  });

  test("solo Buscar es público; Aportar pide cuenta", () => {
    const publicos = DESTINOS.filter((d) => !d.exigeSesion);
    expect(publicos.map((d) => d.href)).toEqual(["/"]);
  });

  test("Buscar sigue activo mientras se navega el catálogo público", () => {
    expect(esDestinoActivo("/", "/canciones/12")).toBe(true);
    expect(esDestinoActivo("/", "/versiones/34")).toBe(true);
    expect(esDestinoActivo("/", "/perfil")).toBe(false);
  });

  test("un destino no se activa por un prefijo casual", () => {
    expect(esDestinoActivo("/aportar", "/aportares")).toBe(false);
    expect(esDestinoActivo("/aportar", "/aportar/algo")).toBe(true);
  });
});
```

Run: `npx vitest run src/tests/components/nav/destinos.test.ts`
Expected: antes del Step 2, este archivo actualizado FALLA contra el `destinos.tsx` viejo (4 destinos); después del Step 2, PASA.

- [ ] **Step 4: Verificar en verde**

Run: `npx vitest run src/tests/components/nav/destinos.test.ts`
Expected: PASS (5 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/components/nav/iconos.tsx src/components/nav/destinos.tsx src/tests/components/nav/destinos.test.ts
git commit -m "refactor(nav): mover Favoritos y Perfil del riel al menú de avatar"
```

---

## Task 10: `MenuDePerfil` + wiring en `Encabezado`

**Files:**
- Create: `src/components/nav/MenuDePerfil.tsx`
- Test: `src/tests/components/nav/MenuDePerfil.test.tsx`
- Modify: `src/components/nav/Encabezado.tsx`
- Modify: `src/tests/components/nav/Encabezado.test.tsx`

**Interfaces:**
- Consumes: `useSesion()` → `{ usuario }` (Task 4 le agregó campos, pero `MenuDePerfil` solo necesita `id`/`username`/`fotoPerfilUrl`, ya existentes); `Avatar` (Task 8); `IconoFavoritos`/`IconoPerfil`/`IconoAjustes`/`IconoPreferencias` (Task 9).
- Produces: `<MenuDePerfil />`, sin props. Lo consume `Encabezado.tsx` en este mismo task.

- [ ] **Step 1: Escribir el test de `MenuDePerfil`, en rojo**

```tsx
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuDePerfil } from "@/components/nav/MenuDePerfil";

let ruta = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => ruta,
}));

const usarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion/SesionProvider", () => ({ useSesion: usarSesion }));

beforeEach(() => {
  ruta = "/";
  usarSesion.mockReturnValue({
    usuario: { id: 3, username: "ana", fotoPerfilUrl: null },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("MenuDePerfil", () => {
  test("cerrado por defecto; abre al hacer click en el disparador", async () => {
    const user = userEvent.setup();
    render(<MenuDePerfil />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  test("los cuatro ítems apuntan a las rutas correctas", async () => {
    const user = userEvent.setup();
    render(<MenuDePerfil />);
    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));

    expect(screen.getByRole("menuitem", { name: "Favoritos" })).toHaveAttribute(
      "href",
      "/favoritos",
    );
    expect(screen.getByRole("menuitem", { name: "Perfil" })).toHaveAttribute(
      "href",
      "/perfil",
    );
    expect(screen.getByRole("menuitem", { name: "Ajustes" })).toHaveAttribute(
      "href",
      "/cuenta",
    );
    expect(screen.getByRole("menuitem", { name: "Preferencias" })).toHaveAttribute(
      "href",
      "/preferencias",
    );
  });

  test("cierra al hacer click fuera", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <MenuDePerfil />
        <button type="button">fuera</button>
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "fuera" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  test("cierra con Escape y devuelve el foco al disparador", async () => {
    const user = userEvent.setup();
    render(<MenuDePerfil />);
    const disparador = screen.getByRole("button", { name: "Menú de perfil" });
    await user.click(disparador);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(disparador).toHaveFocus();
  });

  test("el foco inicial va al primer ítem al abrir", async () => {
    const user = userEvent.setup();
    render(<MenuDePerfil />);
    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));

    expect(screen.getByRole("menuitem", { name: "Favoritos" })).toHaveFocus();
  });

  test("cierra al navegar", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MenuDePerfil />);
    await user.click(screen.getByRole("button", { name: "Menú de perfil" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    ruta = "/perfil";
    rerender(<MenuDePerfil />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  test("sin usuario, no se muestra nada", () => {
    usarSesion.mockReturnValue({ usuario: null });
    const { container } = render(<MenuDePerfil />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

Run: `npx vitest run src/tests/components/nav/MenuDePerfil.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 2: Implementar `MenuDePerfil.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSesion } from "@/lib/sesion/SesionProvider";
import { Avatar } from "@/components/perfil/Avatar";
import {
  IconoAjustes,
  IconoFavoritos,
  IconoPerfil,
  IconoPreferencias,
} from "./iconos";

const ITEMS = [
  { href: "/favoritos", etiqueta: "Favoritos", icono: IconoFavoritos },
  { href: "/perfil", etiqueta: "Perfil", icono: IconoPerfil },
] as const;

const ITEMS_CUENTA = [
  { href: "/cuenta", etiqueta: "Ajustes", icono: IconoAjustes },
  { href: "/preferencias", etiqueta: "Preferencias", icono: IconoPreferencias },
] as const;

/**
 * D · Menú de perfil (2026-09-05). Sustituye al ítem "Perfil" del riel: un
 * avatar que abre Favoritos/Perfil/Ajustes/Preferencias. Solo se monta con
 * sesión (`Encabezado` lo condiciona), pero además se protege sola por si se
 * usa en otro lado.
 */
export function MenuDePerfil() {
  const { usuario } = useSesion();
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const primerItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (abierto) primerItemRef.current?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function alClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function alEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAbierto(false);
        botonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", alEscape);
    return () => document.removeEventListener("keydown", alEscape);
  }, [abierto]);

  useEffect(() => {
    setAbierto(false);
    // Se quiere disparar solo cuando cambia la ruta, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta]);

  if (!usuario) return null;

  return (
    <div ref={contenedorRef} className="relative">
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de perfil"
        className="flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-hoja"
      >
        <Avatar
          id={usuario.id}
          username={usuario.username}
          fotoPerfilUrl={usuario.fotoPerfilUrl}
          tamano="sm"
        />
        <svg viewBox="0 0 24 24" className="size-3.5 text-tinta-suave" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {abierto ? (
        <div
          role="menu"
          aria-label="Menú de perfil"
          className="absolute right-0 top-full z-40 mt-2 w-52 rounded-xl border border-pauta bg-hoja-alta py-1.5 shadow-hoja"
        >
          {ITEMS.map(({ href, etiqueta, icono: Icono }, indice) => (
            <Link
              key={href}
              ref={indice === 0 ? primerItemRef : undefined}
              href={href}
              role="menuitem"
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-tinta transition-colors hover:bg-hoja"
            >
              <Icono className="size-4.5 text-tinta-suave" />
              {etiqueta}
            </Link>
          ))}
          <div className="my-1.5 border-t border-pauta" />
          {ITEMS_CUENTA.map(({ href, etiqueta, icono: Icono }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-tinta transition-colors hover:bg-hoja"
            >
              <Icono className="size-4.5 text-tinta-suave" />
              {etiqueta}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Verificar en verde**

Run: `npx vitest run src/tests/components/nav/MenuDePerfil.test.tsx`
Expected: PASS (7 pruebas).

- [ ] **Step 4: Conectar `MenuDePerfil` en `Encabezado.tsx`**

Sumar el import:

```tsx
import { MenuDePerfil } from "@/components/nav/MenuDePerfil";
```

En el contenedor final (a la derecha), agregar `<MenuDePerfil />` junto a `<InterruptorDeTema />`:

```tsx
          <InterruptorDeTema />
          {estado === "autenticado" ? <MenuDePerfil /> : null}
        </div>
```

(reemplaza el `<InterruptorDeTema />` suelto que ya estaba último dentro de ese `<div>`).

- [ ] **Step 5: Actualizar `Encabezado.test.tsx`**

Los dos tests que asumían "las cuatro secciones en el riel" ya no son ciertos: Favoritos y Perfil se mudaron al menú. Reemplazar el archivo entero por:

```tsx
import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Encabezado } from "@/components/nav/Encabezado";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const usarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion/SesionProvider", () => ({
  useSesion: usarSesion,
}));

// jsdom no implementa matchMedia; el interruptor de tema del encabezado lo
// necesita para saber el esquema de color del sistema.
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

test("sin sesión, el encabezado ofrece iniciar sesión y registrarse en vez del riel", () => {
  usarSesion.mockReturnValue({ estado: "anonimo" });
  render(<Encabezado />);

  expect(
    screen.getByRole("link", { name: "Iniciar sesión" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Registrarse" })).toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});

test("con sesión, el encabezado muestra el riel de Buscar y Aportar", () => {
  usarSesion.mockReturnValue({ estado: "autenticado" });
  render(<Encabezado />);

  expect(
    screen.getByRole("navigation", { name: "Secciones principales" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Registrarse" })).not.toBeInTheDocument();
});

test("mientras se confirma la sesión, no promete ninguno de los dos estados", () => {
  usarSesion.mockReturnValue({ estado: "cargando" });
  render(<Encabezado />);

  expect(screen.queryByRole("link", { name: "Registrarse" })).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});

// Desde el 2026-09-05, Favoritos y Perfil viven en el menú del avatar, no en
// el riel: en el riel solo quedan las dos secciones que no piden un menú.
test("con sesión hay un solo riel con Buscar y Aportar, más el menú del avatar", () => {
  usarSesion.mockReturnValue({
    estado: "autenticado",
    usuario: { id: 1, username: "ana", fotoPerfilUrl: null },
  });
  render(<Encabezado />);

  expect(screen.getAllByRole("navigation")).toHaveLength(1);
  for (const seccion of ["Buscar", "Aportar"]) {
    expect(screen.getByRole("link", { name: seccion })).toBeInTheDocument();
  }
  expect(screen.queryByRole("link", { name: "Favoritos" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Perfil" })).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Menú de perfil" }),
  ).toBeInTheDocument();
});

// Sin la barra inferior, si estos dos accesos se ocultaran en móvil no quedaría
// ninguna forma de entrar desde un teléfono.
test("iniciar sesión y registrarse se ven también en móvil", () => {
  usarSesion.mockReturnValue({ estado: "anonimo" });
  render(<Encabezado />);

  const acciones = screen
    .getByRole("link", { name: "Registrarse" })
    .closest("div");
  expect(acciones?.className).not.toMatch(/(^|\s)hidden(\s|$)/);
});
```

- [ ] **Step 6: Verificar en verde**

Run: `npx vitest run src/tests/components/nav/Encabezado.test.tsx`
Expected: PASS (5 pruebas).

- [ ] **Step 7: Commit**

```bash
git add src/components/nav/MenuDePerfil.tsx src/components/nav/Encabezado.tsx src/tests/components/nav/MenuDePerfil.test.tsx src/tests/components/nav/Encabezado.test.tsx
git commit -m "feat(nav): agregar el menú de perfil con avatar al encabezado"
```

---

## Task 11: `/cuenta` — `Ajustes` (contraseña, cerrar sesión, eliminar cuenta)

**Files:**
- Create: `src/app/cuenta/page.tsx`
- Create: `src/components/cuenta/Ajustes.tsx`
- Modify: `src/components/perfil/Perfil.tsx`
- Test: `src/tests/components/cuenta/Ajustes.test.tsx`

**Interfaces:**
- Consumes: `useSesion()` → `{ usuario, cerrarSesion, usarApi }`; `PATCH /usuarios/me/password` (Task 3); `CampoDeTexto`, `Aviso`, `Boton`, `Confirmacion` (`@/components/ui/*`); `mensajeDeCampo`, `mensajeDeError`, `type OpcionesDePeticion` (`@/lib/api/cliente`).

- [ ] **Step 1: Escribir el test de `Ajustes`, en rojo**

```tsx
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Ajustes } from "@/components/cuenta/Ajustes";

const cerrarSesion = vi.fn();
const usarApi = vi.fn();
const usarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sesion/SesionProvider", () => ({ useSesion: usarSesion }));

function usuarioLocal() {
  return {
    id: 1,
    username: "ana",
    email: "ana@pentcord.dev",
    rol: "musico" as const,
    fotoPerfilUrl: null,
    tema: null,
    metodoAutenticacion: "local" as const,
  };
}

beforeEach(() => {
  cerrarSesion.mockReset();
  usarApi.mockReset();
  usarSesion.mockReturnValue({ usuario: usuarioLocal(), cerrarSesion, usarApi });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Ajustes", () => {
  test("cuenta local: muestra el formulario de cambiar contraseña", () => {
    render(<Ajustes />);

    expect(screen.getByLabelText("Contraseña actual")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña nueva")).toBeInTheDocument();
  });

  test("cuenta de Google: oculta el formulario y explica por qué", () => {
    usarSesion.mockReturnValue({
      usuario: { ...usuarioLocal(), metodoAutenticacion: "google" },
      cerrarSesion,
      usarApi,
    });
    render(<Ajustes />);

    expect(screen.queryByLabelText("Contraseña actual")).not.toBeInTheDocument();
    expect(screen.getByText(/usa Google/i)).toBeInTheDocument();
  });

  test("valida longitud mínima y confirmación en el cliente, sin llamar a la API", async () => {
    const user = userEvent.setup();
    render(<Ajustes />);

    await user.type(screen.getByLabelText("Contraseña actual"), "actual123");
    await user.type(screen.getByLabelText("Contraseña nueva"), "corta");
    await user.type(screen.getByLabelText("Confirmar contraseña nueva"), "otra");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(
      screen.getByText("La contraseña nueva debe tener al menos 8 caracteres."),
    ).toBeInTheDocument();
    expect(screen.getByText("Las contraseñas nuevas no coinciden.")).toBeInTheDocument();
    expect(usarApi).not.toHaveBeenCalled();
  });

  test("muestra el error de passwordActual inválida junto al campo", async () => {
    const { ErrorDeApi } = await import("@/lib/api/cliente");
    usarApi.mockRejectedValue(
      new ErrorDeApi(
        "VALIDATION_ERROR",
        "La contraseña actual no es correcta.",
        400,
        { campo: "passwordActual" },
      ),
    );

    const user = userEvent.setup();
    render(<Ajustes />);

    await user.type(screen.getByLabelText("Contraseña actual"), "mala");
    await user.type(screen.getByLabelText("Contraseña nueva"), "unaClave123");
    await user.type(screen.getByLabelText("Confirmar contraseña nueva"), "unaClave123");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(
      await screen.findByText("La contraseña actual no es correcta."),
    ).toBeInTheDocument();
  });

  test("éxito limpia el formulario y avisa", async () => {
    usarApi.mockResolvedValue({ message: "Contraseña actualizada" });
    const user = userEvent.setup();
    render(<Ajustes />);

    await user.type(screen.getByLabelText("Contraseña actual"), "actual123");
    await user.type(screen.getByLabelText("Contraseña nueva"), "unaClave123");
    await user.type(screen.getByLabelText("Confirmar contraseña nueva"), "unaClave123");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(await screen.findByText("Contraseña actualizada.")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña actual")).toHaveValue("");
  });

  test("cerrar sesión llama a cerrarSesion()", async () => {
    const user = userEvent.setup();
    render(<Ajustes />);

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(cerrarSesion).toHaveBeenCalled();
  });
});
```

Run: `npx vitest run src/tests/components/cuenta/Ajustes.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 2: Implementar `Ajustes.tsx`**

```tsx
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
      <p className="directiva">{"{cuenta}"}</p>
      <h1 className="rotulo mt-3 text-[clamp(2rem,8vw,3.25rem)] text-tinta">
        Ajustes
      </h1>

      <section className="mt-6 border-t border-pauta pt-6">
        <p className="directiva">{"{cambiar contraseña}"}</p>
        {usuario.metodoAutenticacion === "google" ? (
          <div className="mt-3">
            <Aviso tono="neutro">
              Tu cuenta usa Google para entrar: no tiene una contraseña propia
              que cambiar aquí.
            </Aviso>
          </div>
        ) : (
          <FormularioDeContrasena usarApi={usarApi} />
        )}
      </section>

      <section className="mt-8 border-t border-pauta pt-6">
        <p className="directiva">{"{cuenta}"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
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
```

- [ ] **Step 3: Verificar en verde**

Run: `npx vitest run src/tests/components/cuenta/Ajustes.test.tsx`
Expected: PASS (6 pruebas).

- [ ] **Step 4: Crear la ruta `/cuenta`**

```tsx
import type { Metadata } from "next";
import { ExigeSesion } from "@/components/ui/ExigeSesion";
import { Ajustes } from "@/components/cuenta/Ajustes";

export const metadata: Metadata = { title: "Ajustes" };

export default function Page() {
  return (
    <ExigeSesion>
      <Ajustes />
    </ExigeSesion>
  );
}
```

Guardar en `src/app/cuenta/page.tsx`.

- [ ] **Step 5: `Perfil.tsx` pierde la sección "cuenta"**

En `src/components/perfil/Perfil.tsx`:

1. Quitar `cerrarSesion` de la desestructuración de `useSesion()`:

   ```tsx
   const { usuario, esAdministrador, establecerUsuario, usarApi } = useSesion();
   ```

2. Quitar del `return` de `Perfil()` la sección entera:

   ```tsx
       <section className="mt-8 border-t border-pauta pt-6">
         <p className="directiva">{"{cuenta}"}</p>
         <div className="mt-3 flex flex-wrap gap-2">
           <Boton variante="secundario" onClick={() => void cerrarSesion()}>
             Cerrar sesión
           </Boton>
           <EliminarCuenta onEliminar={() => usarApi("/usuarios", { method: "DELETE" })} />
         </div>
       </section>
   ```

   (queda `<MisAportes />` seguida directamente del bloque `esAdministrador ? ... : null`).

3. Quitar la función `EliminarCuenta` entera (se movió a `Ajustes.tsx`).

4. Quitar el import de `Boton` (ya no se usa en este archivo: `BotonEnlace` sigue haciendo falta en `MisAportes`, `Boton` no).

- [ ] **Step 6: Verificar que todo compila y la suite sigue en verde**

Run: `npx tsc --noEmit && npx vitest run`
Expected: sin errores de tipos ni de lint por imports sin usar; toda la suite pasa (no hay test de `Perfil.tsx` que dependiera de la sección movida).

- [ ] **Step 7: Commit**

```bash
git add src/app/cuenta src/components/cuenta src/components/perfil/Perfil.tsx src/tests/components/cuenta
git commit -m "feat(cuenta): agregar /cuenta con cambio de contraseña, cerrar sesión y eliminar cuenta"
```

---

## Task 12: `/preferencias` — cambio de tema

**Files:**
- Create: `src/app/preferencias/page.tsx`
- Create: `src/components/preferencias/Preferencias.tsx`
- Test: `src/tests/components/preferencias/Preferencias.test.tsx`

**Interfaces:**
- Consumes: `InterruptorDeTema` (`@/components/tema/InterruptorDeTema`, Task 5); `EVENTO_DE_TEMA`, `leerTema` (`@/lib/tema/tema`, Task 5).

- [ ] **Step 1: Escribir el test, en rojo**

```tsx
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preferencias } from "@/components/preferencias/Preferencias";

// `Preferencias` renderiza `InterruptorDeTema`, que desde la Task 5 llama a
// `useSesion()` para decidir si guarda el tema en la cuenta al alternarlo.
vi.mock("@/lib/sesion/SesionProvider", () => ({
  useSesion: () => ({ estado: "autenticado", usarApi: vi.fn().mockResolvedValue(undefined) }),
}));

window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

beforeEach(() => {
  document.documentElement.setAttribute("data-theme", "light");
});

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
});

describe("Preferencias", () => {
  test("muestra el título y el estado actual del tema", () => {
    render(<Preferencias />);

    expect(screen.getByRole("heading", { name: "Preferencias" })).toBeInTheDocument();
    expect(screen.getByText("Claro")).toBeInTheDocument();
  });

  test("alternar el interruptor actualiza la etiqueta de estado", async () => {
    const user = userEvent.setup();
    render(<Preferencias />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("Oscuro")).toBeInTheDocument();
  });
});
```

Run: `npx vitest run src/tests/components/preferencias/Preferencias.test.tsx`
Expected: FAIL — módulo no existe.

- [ ] **Step 2: Implementar `Preferencias.tsx`**

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { InterruptorDeTema } from "@/components/tema/InterruptorDeTema";
import { EVENTO_DE_TEMA, leerTema } from "@/lib/tema/tema";

function suscribirse(alCambiar: () => void) {
  const consulta = window.matchMedia("(prefers-color-scheme: dark)");
  consulta.addEventListener("change", alCambiar);
  window.addEventListener(EVENTO_DE_TEMA, alCambiar);
  return () => {
    consulta.removeEventListener("change", alCambiar);
    window.removeEventListener(EVENTO_DE_TEMA, alCambiar);
  };
}

export function Preferencias() {
  const tema = useSyncExternalStore(suscribirse, leerTema, () => "light" as const);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <p className="directiva">{"{preferencias}"}</p>
      <h1 className="rotulo mt-3 text-[clamp(2rem,8vw,3.25rem)] text-tinta">
        Preferencias
      </h1>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-pauta pt-6">
        <div>
          <p className="font-medium text-tinta">Tema</p>
          <p className="mt-0.5 text-sm text-tinta-suave">
            Se guarda en tu cuenta y te sigue a cualquier navegador donde
            inicies sesión.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-tinta-suave">
            {tema === "dark" ? "Oscuro" : "Claro"}
          </span>
          <InterruptorDeTema />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar en verde**

Run: `npx vitest run src/tests/components/preferencias/Preferencias.test.tsx`
Expected: PASS (2 pruebas).

- [ ] **Step 4: Crear la ruta `/preferencias`**

```tsx
import type { Metadata } from "next";
import { ExigeSesion } from "@/components/ui/ExigeSesion";
import { Preferencias } from "@/components/preferencias/Preferencias";

export const metadata: Metadata = { title: "Preferencias" };

export default function Page() {
  return (
    <ExigeSesion>
      <Preferencias />
    </ExigeSesion>
  );
}
```

Guardar en `src/app/preferencias/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/app/preferencias src/components/preferencias src/tests/components/preferencias
git commit -m "feat(preferencias): agregar /preferencias con el cambio de tema"
```

---

## Task 13: Verificación final y actualizar el plan del MVP

**Files:**
- Modify: `docs/plan-implementacion-mvp.md`

**Interfaces:** ninguna (documentación).

- [ ] **Step 1: Correr la suite completa y las verificaciones de tipos/build**

Run: `npx vitest run && npx tsc --noEmit && npm run build && npm run lint`
Expected: todo en verde; anotar el número de pruebas/archivos nuevos para la tabla "Cómo quedó".

- [ ] **Step 2: Probar a mano en el navegador (Playwright, si está disponible) o describir qué falta probar**

Verificar con sesión real: el avatar aparece en el encabezado con la inicial y un color estable; abrir el menú (click, Escape, click fuera); los cuatro destinos navegan bien; en `/cuenta` cambiar la contraseña de una cuenta local funciona y una cuenta Google ve el aviso en vez del formulario; en `/preferencias` alternar el tema lo persiste (recargar la página con sesión sigue en el tema elegido, incluso en otro navegador si se prueba). Si no hay forma de probarlo a mano en este entorno, decirlo explícitamente en la tabla de verificación en vez de omitirlo.

- [ ] **Step 3: Actualizar `docs/plan-implementacion-mvp.md`**

Agregar una entrada nueva (siguiendo el formato de las entradas "Cómo quedó ... (fecha)" ya existentes en el documento) que registre: los dos endpoints nuevos y la excepción de backend confirmada, el campo `tema` y la migración, el reparto de navegación (riel vs. menú del avatar), las dos rutas nuevas (`/cuenta`, `/preferencias`), y cualquier desviación encontrada durante la implementación (por ejemplo, si algún valor de la paleta de `colorDeAvatar` tuvo que ajustarse en el Task 7, o si `Preferencias.test.tsx` necesitó el mock de `SesionProvider` del Step 3 de la Task 12). Enlazar `docs/superpowers/specs/2026-09-05-menu-perfil-avatar-design.md` como el spec de origen.

- [ ] **Step 4: Commit**

```bash
git add docs/plan-implementacion-mvp.md
git commit -m "docs: registrar el menú de perfil, ajustes y preferencias en el plan del MVP"
```
