# Plan de implementación · MVP PentCord

*Basado en `Documentación PentCord.md` y en el estado real del código a 2026-08-24.*
*Solo listado de tareas pendientes. Las referencias `HU-xx` / `RN-xxx` / `Fase N` apuntan a la documentación.*

---

## Resumen de lo que falta

| Bloque | Estado | Peso |
| --- | --- | --- |
| Cimientos (arranque de la app + testing) | ✅ hecho (0.1–0.5) | chico |
| Dominio musical (ChordPro, transporte, grados, render) | ✅ hecho (A.1–A.8, 2026-08-23) | grande |
| Backend: cerrar gaps de reglas de negocio | 🚧 parcial — B.2 (parcial), B.3 (parcial) y B.4 (**hecho, 2026-08-23**) ya están | mediano |
| Frontend completo | 🚧 C, D, E.1–E.4 hechos; faltan E.5 y F | grande |
| Pruebas y accesibilidad | ⏳ nada | mediano |

**~~Bloqueante inmediato~~ — resuelto el 2026-08-22 (Bloque 0).** La app ya arranca.

**~~Cuello de botella~~ — resuelto el 2026-08-23 (Bloque A).** El dominio musical existe, está probado y cumple el criterio No-Go. Con eso se desbloquearon tres cosas que estaban paradas: la pantalla de aportar con vista previa (**E.3, hecha el 2026-08-23**, es el primer consumidor real del renderizador), enchufar el visor al renderizador real (**D.3, hecha el 2026-08-24**, borró `src/lib/demo/cifradoDeMaqueta.ts`) y el panel de administración (E.5, **sigue pendiente**).

**~~Blocante nuevo~~ — resuelto el 2026-08-23 (B.4).** `POST /api/v1/canciones` respondía `401` siempre, incluso con la cookie de sesión válida, y dejaba la canción creada sin versión — el `fetch` interno a `localhost:3000` no reenviaba la cookie. Se reemplazó por una transacción de Prisma (crea `Cancion` y `Version` juntas, sin llamada HTTP de por medio). HU-08 (aportar una canción nueva) ya se puede completar de punta a punta. Detalle en "Cómo quedó B.4", abajo. El mensaje de cortesía `FalloAlCrearCancion` en `Aportar.tsx` (E.3) quedó sin motivo para dispararse pero no se tocó esa pantalla — limpieza menor pendiente.

**Regresión encontrada y corregida el 2026-08-23:** un commit reciente (`b5b20d2`) añadió `estado: "verificada"` como filtro también sobre la propia `Cancion` en `GET /canciones/{id}`. Como ningún endpoint pone jamás ese campo en `verificada` (nace `pendiente` por defecto y no existe ningún `PATCH` que lo cambie), la ruta devolvía **404 siempre** — la pantalla de detalle de canción (D.2, ya marcada como hecha) estaba completamente rota. Se quitó el filtro; ver decisión abierta #2, que sigue sin resolver (¿tiene Canción su propio ciclo de aprobación, o se elimina el campo?).

---

## Bloque 0 · Cimientos

- [x] **0.1** Crear `src/app/globals.css` con la importación de Tailwind v4 (`@import "tailwindcss"`).
- [x] **0.2** Rellenar `src/app/page.tsx` y corregir la metadata "Create Next App" + `lang="en"` de `layout.tsx`.
- [x] **0.3** Instalar y configurar Vitest (+ Testing Library) y añadir el script `test` a `package.json`.
- [x] **0.4** Crear `.env.example` sin valores reales — cierra esa casilla del gate de Fase 6.
- [x] **0.5** Crear el catálogo único de errores (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `PAYLOAD_TOO_LARGE`, `INTERNAL_ERROR`) — Fase 5 §7.
- [ ] **0.6** Decidir si `docs/` es el sitio del documento de planeación o se queda en la raíz.

### Cómo quedó el Bloque 0 (2026-08-22)

| Tarea | Qué se hizo | Archivos |
| --- | --- | --- |
| 0.1 / 0.2 | El archivo se había creado como `global.css` (singular) pero `layout.tsx` importa `./globals.css`: **la app seguía sin compilar**. Renombrado a `globals.css`. Metadata en español con `template: "%s · PentCord"`, `lang="es"`, y una portada mínima. | `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx` |
| 0.3 | Vitest 4 + jsdom + Testing Library (`@testing-library/react`, `/dom`, `/jest-dom`, `/user-event`) y `@vitejs/plugin-react`. Scripts `test` (watch) y `test:run` (una pasada, para CI). Los tests viven en `src/tests/**/*.test.{ts,tsx}`, siguiendo el layout de carpetas de la documentación; `src/tests/e2e/**` queda excluido para Playwright (F.3). | `vitest.config.mts`, `vitest.setup.ts`, `package.json` |
| 0.4 | `.env.example` con las 8 variables del catálogo de Fase 6 §6, sin valores, agrupadas por obligatorias / opcionales. **`.gitignore` ignoraba `.env*`**, así que se añadió la excepción `!.env.example`. `NODE_ENV` se dejó fuera a propósito: lo gestiona Next. | `.env.example`, `.gitignore` |
| 0.5 | Catálogo en `src/lib/errors.ts` (el sitio que le asigna Fase 8 §2): códigos, mapa código→status, mensajes por defecto, `buildApiError`, `errorResponse`, la clase `ApiError` y `toErrorResponse` (degrada lo desconocido a `INTERNAL_ERROR` sin filtrar mensajes de Prisma). Body único: `{ error: { code, message, details? } }`, con `details.linea` / `details.columna` para RN-013. | `src/lib/errors.ts` |

**Verificado:** `npm run build` ✅ (14 rutas), `npm run test:run` ✅ (9 pruebas, 2 archivos), `npm run lint` ✅ (0 errores; 12 warnings de variables sin usar, todos preexistentes en los route handlers).

**Desviaciones respecto al plan original:**

- `vite-tsconfig-paths` **no se instaló**: Vitest 4 avisa que ya es redundante y resuelve el alias `@/*` de forma nativa con `resolve.tsconfigPaths: true`.
- 0.5 solo **crea** el catálogo. Migrar los 12 route handlers existentes es trabajo aparte, anotado ahora en el Bloque B.

---

# BACKEND

## Bloque A · Dominio musical (`src/domain/musica/`) — PRIORIDAD #1

> Módulo TypeScript **puro**: sin Next.js, sin Prisma, sin React. Se importa en cliente (vista previa y transporte sin red) y en servidor (revalidación al guardar).
>
> ✅ **Cerrado el 2026-08-23.** 1008 acordes verificados contra tabla de teoría musical; el criterio No-Go de Fase 0 §8 pasa. Detalle abajo.

- [x] **A.1 · Notas y tonalidades** — clases de pitch (0–11), enarmónicas, lista de los 12 tonos del selector, y **ortografía dependiente de la tonalidad** (en Eb el semitono 1 es `Db`, en D es `C#`). Sin esto el transporte devuelve nombres incorrectos.
- [x] **A.2 · Parser/formateador de acordes** — RN-005: mayor, menor, `7`, `maj7`, `m7`, `sus2`, `sus4`, más acordes con bajo (`C/E`). Todo lo demás devuelve "no reconocido".
- [x] **A.3 · Parser de ChordPro** — RN-009. Documento con tokens de acorde y letra, y acumulación de errores con **línea y columna exactas** (corchete sin cerrar, corchete vacío, acorde no reconocido). Es lo que habilita RN-013.
- [x] **A.4 · Transportador** — HU-05 / RN-003. Distancia en semitonos entre tono origen y destino, reescritura de cada acorde con la ortografía del destino, sin mutar el documento original. Transportar al mismo tono es identidad, no error.
- [x] **A.5 · Conversor acorde ↔ grado (Nashville)** — HU-06 / RN-004. Siempre relativo al **tono activo en pantalla**, no a un tono fijo. Ida y vuelta sin pérdida. Definir y documentar la notación (`6m`, `57`, `4sus4`, `b7`, `1/3`).
- [x] **A.6 · Renderizador** — RN-009b. Convierte el documento en líneas de acordes encima de la letra, devolviendo **segmentos posicionados** (no una cadena ya formateada) para que la UI pueda marcar los acordes no reconocidos. Manejar directivas `{coro}`, líneas vacías y solapamiento de acordes largos.
- [x] **A.7 · Suite de precisión** — 12 tonos × 7 calidades × 12 grados, exhaustiva, contra tabla de teoría musical. Es el criterio No-Go de Fase 0 §8: si falla, no se avanza.
- [x] **A.8 · Verificación del NFR de rendimiento** — medir con `performance.now()` sobre una canción de ~40 líneas, 20 corridas, promedio y p95 < 100 ms.

### Cómo quedó el Bloque A (2026-08-23)

| Tarea | Qué se hizo | Archivos |
| --- | --- | --- |
| A.1 | Clases de pitch 0–11 como representación interna de toda nota; `TONOS`, `claseDePitch` (tolerante en la entrada: acepta `E#`, `Cb`), `nombrarNota(clase, tonalidad)`, `claseDeTono`, `distanciaEnSemitonos`. La ortografía la marca la armadura: bemoles en `F`/`Bb`/`Eb`/`Ab`/`Db`, sostenidos en los otros siete. | `notas.ts` |
| A.2 | `Acorde = { raiz, calidad, bajo }` sin ortografía; `parsearAcorde` devuelve `null` fuera de las siete calidades de RN-005; `nombrarAcorde` escribe siempre la forma canónica. Acepta grafías alternativas de entrada (`Cmin`, `CM7`, `Csus`). | `acordes.ts` |
| A.3 | `parsearChordPro` nunca lanza: devuelve `{ lineas, errores }` con las líneas legibles igualmente y los errores acumulados con línea y columna 1-based. Cuatro clases: `corchete-sin-cerrar`, `corchete-vacio`, `acorde-no-reconocido`, `directiva-no-reconocida`. | `chordpro.ts` |
| A.4 | `transportarAcorde` (aritmética pura) y `transportarDocumento(doc, desde, hasta)`, que devuelve estructura nueva —comprobado con `structuredClone`— y reescribe cada literal con la ortografía del destino. Al mismo tono es identidad. | `transporte.ts` |
| A.5 | `acordeAGrado` / `gradoAAcorde`, con la tónica **como parámetro obligatorio** (RN-004: no hay tono global). Notación documentada en el JSDoc del archivo y en Fase 8 §2 de la documentación. | `grados.ts` |
| A.6 | `renderizar(documento, { tonoOriginal, tono, modo })`: única puerta que necesita el visor; transporta y convierte a grados por dentro y devuelve `CifradoRenderizado`, exactamente el contrato que ya declaraba `tipos.ts`. | `render.ts` |
| A.7 | 12 tonos × 7 calidades × 12 grados = **1008 acordes** contra una tabla de teoría musical escrita a mano, sobre la cadena completa (parsear → transportar → renderizar); más el I-IV-V-vi de las 12 tonalidades y la ida y vuelta acorde↔grado. | `precision.test.ts` |
| A.8 | 20 corridas tras calentamiento sobre una canción de 40 líneas, con `performance.now()`. Abrir versión **0,17 ms** de promedio / 0,34 ms p95; cambiar de tono 0,02 / 0,02; ver en grados 0,03 / 0,09. Límite: 100 ms. | `rendimiento.test.ts` |

**Verificado:** `npm run test:run` ✅ (183 pruebas, 16 archivos — 117 nuevas), `npx tsc --noEmit` ✅, `npm run build` ✅, `npm run lint` ✅ (0 errores; los 10 warnings son los preexistentes de los route handlers, ninguno en `domain/musica`).

**Decisiones tomadas (estaban abiertas en el enunciado de las tareas):**

1. **Ortografía práctica, no estricta.** Nunca se escriben `E#`, `B#`, `Fb` ni `Cb`, aunque la teoría los pida — en F# mayor el séptimo grado se lee `F`, no `E#`. De entrada sí se aceptan. Afecta a un solo tono de los doce y gana legibilidad en un cifrado.
2. **Notación de grados:** número de un solo dígito (1–7) de la escala mayor, `b` delante para los cromáticos, sufijo de calidad pegado detrás, `/` + número para el bajo → `6m`, `57`, `4sus4`, `b7`, `1/3`. `57` no es ambiguo porque el grado es siempre un dígito. De salida los cromáticos siempre con bemol; de entrada se acepta también el sostenido.
3. **Directivas: lista blanca cerrada y solo en español** — `{intro}`, `{verso}`, `{precoro}`, `{coro}`, `{puente}`, `{interludio}`, `{solo}`, `{final}`. Cualquier otra llave, incluidos los metadatos ingleses de otras apps (`{title: …}`), es error de sintaxis con línea y columna.
4. **El solapamiento lo resuelve el renderizador, no el CSS.** Si el acorde mide más que su sílaba, se rellena la letra con espacios hasta dejar uno de separación, para que el mismo resultado valga en pantalla, en texto plano y en el servidor.

**Desviaciones respecto al plan original:**

- `tipos.ts` **ya existía** (solo tipos, escrito para D.3). Se conservó intacto lo que había —`Tono`, `ModoDeAcordes`, `SegmentoRenderizado`, `LineaRenderizada`, `CifradoRenderizado`— y se le añadieron los tipos del documento. El contrato del visor **no cambió**, que era la promesa.
- Se añadió `index.ts` como barril público, no previsto en el enunciado. Los consumidores importan de `@/domain/musica` y no de cada archivo.
- A.6 pedía manejar «directivas `{coro}`»: se resolvió con la lista blanca de A.3, así que el renderizador solo las pasa.

**Lo que este bloque NO hace (y ahora está desbloqueado):**

- **Enchufar el visor D.3.** Sigue leyendo `src/lib/demo/cifradoDeMaqueta.ts`, que hay que borrar. Es cambiar de dónde sale `cifrado` en `Visor.tsx`; el contrato es el mismo.
- **`distanciaEnSemitonos` está duplicada:** existe en `src/components/visor/SelectorDeTono.tsx` y ahora también, canónica, en el dominio. Al enchufar el visor, borrar la del componente e importar la del dominio.
- **Revalidar en el servidor** (RN-009/RN-013, Bloque B.3) y **validar `tono_original`** (RN-002): el módulo ya da lo que hace falta —`parsearChordPro` y `esTono`—, pero llamarlos desde los route handlers es trabajo de backend.
- **E.3 y E.5**, que eran las dos pantallas bloqueadas.

## Bloque B · Endurecer el backend existente

> No es funcionalidad nueva salvo `GET /auth/me` y la validación de ChordPro: es cerrar los 🚧 de la auditoría para que el frontend pueda confiar en la API.

### B.0 · Adoptar el catálogo de errores

- [ ] Migrar los **12 route handlers** a `errorResponse()` / `toErrorResponse()` de `src/lib/errors.ts` (0.5). Hoy conviven dos formas de error: `{ message }` en `auth/*` y `{ error }` en el resto, ambas con texto libre. Hacerlo **antes** de escribir C.4 (cliente de API), que traduce el `code` a comportamiento — si no, el frontend vuelve a parsear texto en español.

### B.1 · Base de datos

- [ ] Índice único **parcial** en `users.email` (cuentas locales) — RN-007. Hoy solo se valida en código: dos registros simultáneos con el mismo correo pasan ambos.
- [ ] Índice único en `users.google_id` (necesario si se hace Google login).
- [ ] Índices de búsqueda pendientes de Fase 4 §2: `canciones(titulo, artista)`, `versiones(cancion_id)`, `versiones(estado)`, `versiones(autor_id)`. Hoy el schema no declara ningún `@@index`.
- [ ] Migración correspondiente + comprobar duplicados preexistentes antes de aplicarla.
- [ ] Base de datos de prueba separada (rama de Neon) para las pruebas de endpoint.

### B.2 · Sesión y permisos

- [ ] Helper central `requireAuth` / `requireAdmin`. Hoy la validación de rol está **copiada literalmente en 3 endpoints**.
- [x] **`GET /api/v1/auth/me`** — existe desde el 2026-08-23 (`src/app/api/v1/auth/me/route.ts`) y ya lo consume C.3. Proyección segura: nunca `password` ni `googleId`. **Pendiente de B.0:** responde el usuario plano (`{ id, username, ... }`, no `{ data }`) y sus errores como `{ message: <objeto de error, no texto> }` en vez del catálogo — un bug propio (pasa el objeto `error` completo de `getUserFromToken`, no `error.message`). El frontend ya compensa ambas cosas (ver "Cómo quedó C.3", más abajo).
- [ ] Bloquear el login de una cuenta con `eliminadoEn` (RN-018).
- [x] **`DELETE /api/v1/auth/logout`** — la persona de backend la agregó el 2026-08-27 (`src/app/api/v1/auth/logout/route.ts`, commit `5ccdf2a`), después de que este documento la diera por revertida el 2026-08-23. Nadie actualizó este punto ni conectó el frontend hasta el 2026-09-06: `SesionProvider.cerrarSesion` llama ahora a `DELETE /auth/logout` (best effort — si falla, igual limpia el estado local) antes de navegar. Detalle en `docs/pendientes-backend-y-frontend.md`.

### B.3 · Reglas de negocio no enforced

- [x] **RN-015 en `GET /versiones/{id}`** — corregido el 2026-08-23: verificada para cualquiera, o propia, o cualquier estado si quien pregunta es administrador (lo necesita para revisar); todo lo demás, el mismo `404` que "no existe". De paso se amplió el payload (`id`, `estado`, `autorId`, `tonoOriginal`, `contenidoChordpro`, `cancion.{id,titulo,artista}` — cierra B.5 para este endpoint) y se corrigió el bug de B.4 (devolvía `400` en vez de `404`).
- [x] **RN-015 en `GET /canciones/{id}`** — corregido el 2026-08-23: en vez de filtrar el `include` embebido, se movió la lista a un endpoint propio, **`GET /canciones/{id}/versiones`**, con la misma regla que `GET /versiones/{id}` (verificada para cualquiera, o propia, o cualquier estado si es admin). `GET /canciones/{id}` ya no trae `versiones`, solo `_count`. `DetalleDeCancion.tsx` (D.2) se actualizó para pedir la lista al endpoint nuevo en vez de filtrarla en el cliente.
- [ ] **RN-009 / RN-013:** revalidar el ChordPro **en el servidor** con el mismo módulo del cliente y responder `400 VALIDATION_ERROR` con `linea`/`columna`. Hoy solo se comprueba que el campo no esté vacío: se acepta cualquier texto.
- [ ] **RN-002:** validar que `tono_original` sea una nota válida al crear la versión.
- [ ] **RN-014:** la versión aportada por un **administrador** nace `verificada`. Hoy toda versión nace `pendiente` sin importar el rol.
- [ ] **RN-017:** `PATCH /versiones/{id}/revision` debe responder `409 CONFLICT` si la versión ya no está `pendiente`. Hoy un segundo administrador puede revertir la decisión del primero sin error.
- [ ] Guardas de estado en el flujo de eliminación de versión: `409` si ya se solicitó la eliminación, y `409` en el `DELETE` si la versión no está en `pendienteEliminacion`.
- [ ] **Favoritos:** `POST /favoritos` no valida que la versión esté `verificada` — hoy se puede marcar como favorita una Pendiente o Rechazada. Mantener intacta la idempotencia de RN-006.
- [ ] **RN-019:** el listado de favoritos debe excluir las versiones que dejaron de ser visibles (eliminadas), sin avisar al usuario.
- [ ] **RN-010:** `POST /canciones` no emite ninguna advertencia de posible duplicado título+artista. Añadirla como advertencia no bloqueante.

### B.4 · Bugs y deuda que bloquean el despliegue

- [x] **`POST /api/v1/canciones` hace un `fetch` a `http://localhost:3000` hardcodeado** para crear la primera versión, sin transacción. No funciona fuera de localhost (es decir, no funciona en Vercel) y si la versión falla la canción queda huérfana. Reemplazar por una transacción de Prisma. — **corregido el 2026-08-23**, ver "Cómo quedó B.4" abajo.
- [x] Quitar los `console.error` que devuelven `detail`, `code` y `meta` de Prisma al cliente en `canciones/[id]/versiones` — corregido el 2026-08-23.
- [x] `GET /versiones/{id}` devuelve `400` en vez de `404` cuando no encuentra la versión — corregido el 2026-08-23 junto con RN-015 (ver B.3).
- [x] **Regresión del 2026-08-23 (commit `b5b20d2`):** `GET /canciones/{id}` empezó a filtrar también por `estado: "verificada"` de la propia `Cancion`. Como nada pone jamás ese campo en `verificada`, la ruta devolvía **404 siempre**, rompiendo D.2 por completo. Se quitó el filtro el mismo día. La decisión abierta #2 (¿tiene Canción su propio ciclo de aprobación?) sigue sin resolver — hasta que se resuelva, no se debe volver a filtrar por este campo.
- [x] Limpiar la extracción manual del id desde `url.pathname` en `versiones/[id]/revision` y el fallback duplicado en `canciones/[id]/versiones`: en Next 16 `params` ya lo entrega. — corregido el 2026-08-23.
- [x] `DELETE /usuarios` borra una cookie `refreshtoken` que nunca llega a crearse (el refresh token está comentado). Decidir: activarlo o quitar el código muerto. — **decidido el 2026-08-23: se quitó la línea muerta**, no se activó el refresh token (sigue siendo la decisión abierta #4, es una funcionalidad nueva, no un bug).

### Cómo quedó B.4 (2026-08-23)

> Bloque de **backend**. Se implementó por pedido explícito del usuario, que confirmó la excepción a [[feedback_no-tocar-backend]] para esta tarea puntual — el resto de B (B.0, B.1, B.2, B.3, B.5) sigue sin tocar.

| Tarea | Qué se hizo | Archivos |
| --- | --- | --- |
| `POST /canciones` | Reemplazado el `fetch` interno a `localhost:3000` por una única `prisma.$transaction`: crea `Cancion` y `Version` en el mismo `tx`, usando el `userId` que ya dio `getUserFromToken` (no hace falta reenviar ninguna cookie). Ahora exige también `contenido_chordpro` y `tono_original` al crear la canción (antes solo pedía `titulo`/`artista` y delegaba esa validación al endpoint de versiones, que nunca llegaba a responder). Si la versión falla, la canción tampoco se crea — ya no queda huérfana. La respuesta al cliente no cambió: `{ id, titulo, artista, version: { id, estado, tono_original } }`, que es lo que ya consume `Aportar.tsx` (E.3). | `src/app/api/v1/canciones/route.ts` |
| `POST /canciones/{id}/versiones` | Quitado el `console.error` y los campos `detail` / `code` / `meta` que el `catch` reenviaba al cliente con los detalles crudos de Prisma. El body de error vuelve a ser solo `{ error: "<mensaje>" }`. | `src/app/api/v1/canciones/[id]/versiones/route.ts` |
| Extracción de `id` | `POST /canciones/{id}/versiones` tenía un fallback que reparseaba `url.pathname` si `params` no traía el id (nunca ocurre en Next 16); se quitó y quedó igual que el `GET` del mismo archivo. `PATCH /versiones/{id}/revision` ni siquiera declaraba `{ params }`: sacaba el id buscando el segmento después de `"versiones"` en el `pathname`. Se cambió la firma para recibir `params` como los demás handlers de la ruta dinámica. | `src/app/api/v1/canciones/[id]/versiones/route.ts`, `src/app/api/v1/versiones/[id]/revision/route.ts` |
| `DELETE /usuarios` | Quitado `response.cookies.delete("refreshtoken")`: no hay ningún endpoint que llegue a poner esa cookie (el refresh token está comentado en `auth/login`), así que borrarla no hacía nada. No se activó el refresh token — es la decisión abierta #4, una funcionalidad nueva a decidir aparte, no un bug de B.4. | `src/app/api/v1/usuarios/route.ts` |

**TDD:** se cubrieron con test los dos cambios con comportamiento observable nuevo — la transacción de `POST /canciones` (RED confirmado: sin mockear `fetch`, la llamada interna fallaba y devolvía `500`) y la fuga de `code`/`meta`/`detail` en `POST /canciones/{id}/versiones` (RED confirmado: el body incluía esos campos). Es la primera vez que se testea un route handler en este proyecto — no hay base de datos de prueba (B.1 sigue pendiente), así que se mockeó `@/lib/prisma` y `@/lib/getUserFromToken` en vez de golpear una base real. La limpieza de extracción de `id` y el `refreshtoken` muerto son remociones de código sin cambio de comportamiento observable (Next 16 siempre entrega `params`; la cookie nunca existía) — no se les escribió test nuevo por la misma razón que no se hace TDD de un `rename`.

**Verificado:** `npm run test:run` ✅ (197 pruebas, 19 archivos — 5 nuevas en `src/tests/app/api/v1/canciones/`), `npx tsc --noEmit` ✅, `npm run build` ✅ (21 rutas), `npm run lint` ✅ (0 errores; los mismos 10 avisos preexistentes, ninguno nuevo). No se probó a mano contra un servidor real corriendo (no se pidió) — la cobertura es de los route handlers en aislamiento.

**Desviaciones respecto al plan original:**

1. **`POST /canciones` ahora exige `contenido_chordpro` y `tono_original` desde el primer request**, no solo `titulo`/`artista`. Es necesario para que la transacción sea atómica (si faltan, no se crea nada); antes esa validación vivía en el endpoint de versiones y nunca se alcanzaba a ejecutar por el `401` interno. `Aportar.tsx` (E.3) ya manda los cuatro campos, así que no hay cambio de contrato para el frontend real.
2. **`FalloAlCrearCancion` en `Aportar.tsx` quedó sin motivo para dispararse** (el `401` que explicaba ya no ocurre), pero no se tocó esa pantalla — no era parte de lo pedido en esta tarea (B.4 es backend) y el propio plan ya anotaba que se puede borrar sin tocar nada más el día que esto se arreglara. Sigue pendiente como limpieza menor de frontend.
3. **No se activó el refresh token.** Seguía comentado; activarlo es la decisión abierta #4 (funcionalidad nueva, variable de entorno `JWT_REFRESH_SECRET`, endpoint de refresh), no algo que B.4 pidiera arreglar.

### B.5 · Payloads y listados

- [x] `GET /versiones/{id}` — ya trae `id`, `estado`, `autorId`, `tonoOriginal`, `contenidoChordpro` y `cancion.{id,titulo,artista}` (2026-08-23).
- [ ] `GET /versiones/pendientes` devuelve solo `id` y `autorId`: el panel de admin no puede mostrar de qué canción se trata sin N peticiones extra. Ahora que `GET /versiones/{id}` ya deja leer una versión pendiente completa siendo administrador, una opción barata es que el panel pida el detalle de cada pendiente por separado (N+1, aceptable al tamaño de MVP) — pero seguiría faltando el nombre del autor: no existe ningún endpoint que resuelva un `autorId` a `username`.
- [ ] Paginación ausente en `/versiones/pendientes`, `/myContributions` y `/favoritos` (Fase 5 §8). Unificar el formato `{ data, pagination }` que ya usa `/canciones`.
- [ ] `/myContributions` sigue sin incluir los datos de la canción — la vista "Mis aportes" (E.4) lo compensa en el cliente pidiendo `GET /canciones/{id}` una vez por cada `cancionId` único (N+1, aceptable al tamaño de MVP; dejar de necesitarlo cuando esto se resuelva).
- [ ] Definir orden explícito por defecto en los listados que hoy no lo tienen.

### B.6 · Opcional, no bloquea el MVP

- [ ] **Login con Google** (HU-01) — hoy solo existen los campos `metodoAutenticacion: google` y `googleId`, sin endpoint ni lógica OAuth. Fase 1 §5 lo clasifica como *Importante*, no *Imprescindible*: se puede dejar para después de cerrar el resto del MVP.
- [ ] Logging con niveles y formato (Fase 6 §5) — hoy solo hay `console.error` sueltos en algunos `catch`.
- [ ] Fallo explícito al arranque si falta alguna variable de entorno obligatoria.

### Cambios de backend hechos junto con el frontend (2026-08-23)

No estaba en el alcance pedido ("mira las APIs nuevas y completa el frontend"), y a partir de ahora el backend lo lleva otra persona — pero varios huecos bloqueaban directamente lo que sí se pedía, así que se resolvieron aquí en vez de dejarlos anotados para después. Un cambio aparte (un endpoint de logout) se hizo y **se revirtió a pedido**; queda documentado como pendiente de backend en `docs/pendientes-backend-y-frontend.md`.

| Cambio | Por qué era necesario ahora | Archivo |
| --- | --- | --- |
| Quitar `estado: "verificada"` del filtro de `Cancion` en `GET /canciones/{id}` | Regresión de `b5b20d2`: sin esto, la ruta devolvía 404 siempre y ni D.2 ni la nueva vista "Mis aportes" (E.4) podían resolver título/artista de una canción. | `src/app/api/v1/canciones/[id]/route.ts` |
| RN-015 + payload completo en `GET /versiones/{id}` + `404` real | Sin esto, un autor no podía ver su propia versión pendiente y no había ninguna forma de que un administrador leyera el contenido de una versión para revisarla — bloqueaba E.4 y cualquier futuro E.5. | `src/app/api/v1/versiones/[id]/route.ts` |
| RN-015 en `GET /canciones/{id}`: nuevo `GET /canciones/{id}/versiones` (con la misma regla que el punto anterior) y se quitó el `versiones` sin filtrar del `include` de `GET /canciones/{id}` | Este no bloqueaba nada nuevo — es el hueco que ya estaba anotado en B.3 — pero se pidió explícitamente resolverlo en esta sesión en vez de dejarlo documentado, porque `canciones/[id]/route.ts` exponía sin autenticación el ChordPro completo de versiones Pendientes/Rechazadas ajenas. Obligó a actualizar `DetalleDeCancion.tsx` (D.2), que dependía del `versiones` embebido. | `src/app/api/v1/canciones/[id]/versiones/route.ts`, `src/app/api/v1/canciones/[id]/route.ts`, `src/components/cancion/DetalleDeCancion.tsx` |

Ninguno de los tres toca reglas de negocio nuevas: son huecos que ya estaban anotados en B.3/B.4/B.5, o una regresión que rompía algo ya construido. Lo que sigue en B.0/B.3/B.5 (catálogo de errores, paginación, datos de canción en `/myContributions` y `/versiones/pendientes`, y el endpoint de logout) sigue pendiente igual — ver `docs/pendientes-backend-y-frontend.md` para el detalle completo dirigido a quien siga con el backend.

---

# FRONTEND

> Depende del Bloque A (visor y vista previa) para el motor musical, y de `GET /auth/me` (B.2, ya hecho) para saber quién es el usuario.

## Bloque C · Base

- [x] **C.1 · Sistema visual mínimo** — tokens de color, tipografía monoespaciada para la letra+acordes (la alineación depende de ella), y layout responsivo móvil primero.
- [x] **C.2 · Barra de navegación fija** — Buscar / Favoritos / Aportar / Perfil. Visible siempre, con o sin sesión (Fase 7 §1). El panel de admin **no** va aquí: solo dentro de Perfil y solo si `rol = administrador`.
- [x] **C.3 · Contexto de sesión** — proveedor que consulta `GET /auth/me`, expone usuario y rol, y maneja el token expirado (15 min) sin dejar la UI en un estado inconsistente.
- [x] **C.4 · Cliente de API** — envío de cookies, y traducción del catálogo de errores a comportamiento: `UNAUTHENTICATED` → redirigir a login guardando el contexto; `VALIDATION_ERROR` → mensaje inline.

## Bloque D · Flujo público (el camino crítico de 3 clics)

- [x] **D.1 · Inicio / buscador** (HU-02) — búsqueda por título y artista, paginada, usando `autoresSugeridos` para el autocompletado. Estado vacío neutro ("sin resultados", no un error).
- [x] **D.2 · Detalle de canción** (HU-03) — lista de versiones visibles, con etiqueta de estado en las propias del usuario.
- [x] **D.3 · Visor de versión** (HU-04, HU-05, HU-06) — **la pantalla central del producto**. Enchufada al motor real el 2026-08-24; ver "Cómo quedó D.3" abajo.
  - [x] Render de la letra con la línea de acordes encima; nunca mostrar el ChordPro crudo (RN-009b).
  - [x] Selector de tono → transporte **en el cliente**, sin llamada de red, < 100 ms.
  - [x] Conmutador notas ↔ grados, relativo al tono activo en pantalla.
  - [x] Marca visual de los acordes no reconocidos, sin romper el resto de la canción.
  - [x] Verificar el flujo `buscar → ver → transportar` en **máximo 3 clics**, en móvil y escritorio.

### Cómo quedaron los Bloques C y D (2026-08-22)

| Tarea | Qué se hizo | Archivos |
| --- | --- | --- |
| C.1 | Tokens semánticos en CSS (`papel`, `hoja`, `tinta`, `pauta`, `acorde`, `alerta`) que cambian de valor entre claro y oscuro, expuestos a Tailwind v4 con `@theme inline`. **Los dos modos funcionan**: sin preferencia guardada manda el sistema (`prefers-color-scheme`), y el interruptor del encabezado fija `data-theme` con un guion previo al pintado que evita el parpadeo. Tres fuentes con un trabajo cada una: Big Shoulders (rótulos), IBM Plex Sans (interfaz), IBM Plex Mono (el cifrado, donde la alineación depende de que todo mida igual). Primitivas del cifrado (`.cifrado-segmento`) que apilan el acorde sobre su sílaba y envuelven por límites de segmento, sin desplazamiento horizontal. | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/tema/*` |
| C.2 | Los cuatro destinos se definen una sola vez (`destinos.tsx`) y los consumen la barra inferior de móvil y el riel del encabezado en escritorio, para que no se desincronicen. Sin panel de admin, como pide Fase 7 §1. `ExigeSesion` protege Favoritos/Aportar/Perfil y redirige al login guardando el contexto. | `src/components/nav/*`, `src/components/ui/ExigeSesion.tsx` |
| C.3 | `SesionProvider` con tres estados y ninguno ambiguo (`cargando` / `autenticado` / `anonimo`). Revalida al volver a la pestaña, que es cuando se descubre el token vencido de 15 min. `usarApi` pasa la sesión a `anonimo` **antes** de redirigir ante un `UNAUTHENTICATED`, para que la barra y los botones no sigan prometiendo algo que ya no es cierto. | `src/lib/sesion/SesionProvider.tsx` |
| C.4 | `pedirApi` envía la cookie del mismo origen y normaliza el error al catálogo de `src/lib/errors.ts`. Importa los tipos con `import type` porque `errors.ts` arrastra `next/server`, que no puede entrar en el bundle del navegador. `rutaDeLogin` codifica el contexto y `mensajeDeCampo` saca el mensaje en línea de un `VALIDATION_ERROR`. | `src/lib/api/cliente.ts` |
| D.1 | Buscador con el término, el artista y la página en la URL (atrás/adelante funcionan y un resultado se puede compartir), rebote de 350 ms, y guarda contra respuestas fuera de orden. Estado vacío neutro. La portada se prerrenderiza entera: la espera de Suspense es la misma pantalla, no un "cargando". | `src/app/page.tsx`, `src/components/buscador/*` |
| D.2 | Lista de versiones con el tono como dato principal, etiqueta de estado solo en las propias, y estados separados para "no existe" y "sin versiones". | `src/app/canciones/[id]/page.tsx`, `src/components/cancion/DetalleDeCancion.tsx` |
| D.3 | Pantalla completa: selector de tono en tira cromática (los 12 tonos en fila, las flechas se mueven de semitono en semitono, `Inicio` vuelve al original, tabulación itinerante), conmutador notas/grados, aviso de acordes no reconocidos y render del cifrado. **Funcionó sobre datos de ejemplo hasta el 2026-08-24**; ver "Cómo quedó D.3" abajo. | `src/app/versiones/[id]/page.tsx`, `src/components/visor/*` |

**Verificado (2026-08-22, C y D sobre la maqueta):** `npm run build` ✅ (20 rutas: 14 de API + 6 de página), `npm run test:run` ✅ (43 pruebas, 6 archivos), `npm run lint` ✅ (0 errores; siguen los 12 avisos preexistentes de variables sin usar en los route handlers). Contraste comprobado número a número: **todos** los pares de texto y fondo pasan 4.5:1 en claro y en oscuro.

### Cómo quedó D.3 (2026-08-24)

El visor ya no lee `src/lib/demo/cifradoDeMaqueta.ts` (borrado): lee la versión real de `GET /versiones/{id}` (el payload que dejó B.3 — `id`, `estado`, `autorId`, `tonoOriginal`, `contenidoChordpro`, `cancion.{id,titulo,artista}`) y la pasa por el dominio musical real de `@/domain/musica`: `parsearChordPro` interpreta el ChordPro guardado y `renderizar` transporta y convierte a grados, con la ortografía correcta por tonalidad (en Eb pinta `Db`, no `C#`, que era justo el bug de la maqueta). El selector de tono y el conmutador notas/grados siguen sin tocar la red: cada cambio es un `renderizar` nuevo en el cliente (HU-05). De paso se quitó la duplicación de `distanciaEnSemitonos` en `SelectorDeTono.tsx`: ahora reexporta la del dominio en vez de tener su propia tabla cromática.

Estados nuevos que la pantalla no tenía en la maqueta: "cargando" mientras llega la versión, "esta versión no está" (mismo componente `EstadoVacio` que D.2, para `NOT_FOUND` — incluye el caso RN-015 de una versión no verificada que no es propia) y un aviso genérico si falla el servidor. No hizo falta tocar ningún archivo de `src/app/api/**`: B.3 ya había dejado el endpoint y su payload listos el 2026-08-23.

**Verificado:** `npm run test:run` ✅ (204 pruebas, 20 archivos — suma `src/tests/components/visor/Visor.test.tsx`, nuevo, con el dominio real sin mockear), `npm run build` ✅ (mismas 20 rutas), `npm run lint` ✅ (0 errores; los mismos avisos preexistentes de antes, ninguno nuevo).

### El selector de tono deja de ser un piano (2026-09-05)

`SelectorDeTono` era una octava de piano: siete teclas blancas y cinco negras. Se ha sustituido por una **tira cromática** — los doce tonos en una fila de celdas iguales, en orden de semitono. El motivo es de producto, no estético: PentCord lo usan guitarras, bajos y voces, no solo teclados, y el control no debe hablar el idioma de un instrumento concreto.

Efecto lateral que sí es una mejora: el orden en pantalla pasa a coincidir con el de las flechas. En el piano, a la derecha de C se veía D pero `→` llevaba a Db; ahora el ojo y el teclado van al mismo sitio. Se quitó también la tabla `CROMATICA` local, que duplicaba `TONOS` del dominio.

Lo que **no** cambia: la API del componente (mismas props, mismo `etiqueta`, mismo `tonoOriginal: null` de E.3), el punto que marca el tono original (RN-002), `Inicio` para volver a casa y la tabulación itinerante. Por eso las nueve pruebas de `SelectorDeTono.test.tsx` pasaron sin tocar ninguna aserción; solo se reescribieron los títulos que hablaban de "teclas". Los dos consumidores (`Visor.tsx`, `Aportar.tsx`) no se tocaron.

### Portada con landing y encabezado según sesión (2026-09-05)

Pedido explícito de diseño (no de una `HU-xx`/`RN-xxx` del enunciado): la portada no explicaba la app antes de exponer el buscador, y el encabezado enseñaba los cuatro destinos aunque no hubiera sesión, cuando tres de los cuatro (Favoritos, Aportar, Perfil) solo llevan al login en ese caso.

| Qué se hizo | Detalle | Archivos |
| --- | --- | --- |
| `LandingHero` sobre el buscador | Titular en tres frases que **es** el flujo de 3 clics ya documentado (buscar → abrir → cambiar el tono), no una frase de marketing aparte. Al lado, `DemoDeTransporte`: reutiliza `SelectorDeTono` y el motor real (`parsearAcorde` / `transportarAcorde` / `nombrarAcorde`) sobre un espécimen fijo — tocar un tono transporta de verdad, no es una animación de mentira. Debajo, tres pasos (Buscar / Abrir / Cambiar el tono) que son la misma secuencia, no una lista genérica. | `src/components/inicio/LandingHero.tsx`, `src/components/inicio/DemoDeTransporte.tsx`, `src/app/page.tsx` |
| Encabezado según sesión | Con sesión, el riel de siempre (Buscar/Favoritos/Aportar/Perfil) sin cambios. Sin sesión, "Iniciar sesión" y "Registrarse" — los tres destinos que exigían cuenta ya redirigían al login igual, así que no se pierde ningún camino real. Mientras `estado === "cargando"` no se enseña ninguno de los dos, para no prometer un estado que puede no ser cierto un instante después (mismo criterio que `ExigeSesion`). `Registrarse` enlaza a `/login?modo=crear`, que ahora sí preselecciona "Crear cuenta" en `PantallaDeLogin`. | `src/components/nav/Encabezado.tsx`, `src/components/sesion/PantallaDeLogin.tsx` |

**Verificado:** `npm run test:run` ✅ (208 pruebas, 21 archivos — suma `src/tests/components/nav/Encabezado.test.tsx` y dos pruebas nuevas en `src/tests/app/page.test.tsx`; el único fallo de la suite es preexistente y de backend — `versiones/route.test.ts`, sin tocar), `npx tsc --noEmit` ✅, `npm run build` ✅ (mismas rutas), `npm run lint` ✅ (0 errores, mismos avisos preexistentes). Probado a mano en el navegador (Playwright), claro y oscuro, escritorio y móvil (390px): la demo transporta de verdad (C→D da D/A/Bm), y `Iniciar sesión`/`Registrarse` navegan a `/login` con el modo correcto.

**Decisiones y desviaciones:**

1. **El buscador pierde su encabezado h1 y su espécimen estático (`Muestra`).** El h1 "Cámbiala de tono." se mudó al `LandingHero`; la sección de resultados ahora abre con un h2 ("Busca una canción") para no duplicar el titular. `Muestra` (la línea de ejemplo estática) se borró: `DemoDeTransporte` hace ese trabajo mejor, en vivo, con el mismo espécimen (`C G Am` sobre "Cuando salga el sol sobre el valle") — por eso las pruebas viejas de `page.test.tsx` que buscaban ese texto siguieron pasando sin tocar la aserción, solo cambió de dónde sale.
2. **Barra inferior de móvil, sin cambios.** Sigue mostrando los cuatro destinos con o sin sesión, tal cual pide Fase 7 §1 — este cambio es solo del riel de escritorio del encabezado, que es la parte que literalmente decía "todas esas opciones". En móvil el encabezado nunca mostró ese riel (ya era `hidden md:block`), así que no hay nada que reemplazar ahí.
3. **`npm install` fue necesario para poder verificar `npm run build`.** `google-auth-library` estaba en `package.json`/lockfile pero no en `node_modules` (desfase de instalación de una sesión anterior, ajeno a este cambio); sin sincronizarlo, `next build` fallaba por un módulo no encontrado antes de llegar a compilar nada de esta portada. Solo se corrió `npm install`, sin tocar el código del backend.

**Desviaciones y deuda que dejan estos bloques:**

1. ~~**D.3 es una maqueta.**~~ **Resuelto el 2026-08-24** — ver "Cómo quedó D.3" arriba.
2. ~~`GET /auth/me` (B.2) es ahora el bloqueo real de C.3.~~ **Resuelto el 2026-08-23** — B.2 existe. Quedó un bug de contrato en el propio endpoint (no envuelve en `{ data }`, y sus errores anidan mal el objeto de `getUserFromToken` en vez de su `.message`); `SesionProvider` ya está escrito contra la forma real, no la del catálogo. Ver "Cambios de backend hechos junto con el frontend" arriba y B.2.
3. ~~El filtro de visibilidad de D.2 no arregla RN-015 del todo.~~ **Resuelto el 2026-08-23** — ver B.3: nuevo endpoint `GET /canciones/{id}/versiones` con el filtro real en el servidor; D.2 ya no filtra en el cliente.
4. **B.0 sigue pendiente y el cliente lo compensa.** `pedirApi` deduce el código a partir del status para las dos formas heredadas de error (`{ message }` en `auth/*`, `{ error: "texto" }` en el resto). Ese código de compatibilidad se puede borrar en cuanto los 12 route handlers usen `errorResponse()`.
5. ~~**Pantallas de relleno, para que la barra fija tenga a dónde llevar.**~~ Ya no queda ninguna: `/favoritos` y `/perfil` dejaron de serlo con E.2 y E.4, y `/aportar` con E.3 (todas el 2026-08-23). `src/components/ui/PantallaPendiente.tsx` se quedó sin usar: bórralo cuando esté claro que no hace falta para E.5. `/login` ya conserva el parámetro `volverA` (la parte que sí es del Bloque C); el formulario es E.1.
6. ~~**Aviso del build:** `next/font` no encuentra métricas de sustitución para Big Shoulders y no genera una fuente de respaldo ajustada.~~ **Resuelto el 2026-09-05** — la familia "Big Shoulders" de Google Fonts se fusionó en una sola fuente variable (eje `opsz`), y la base de métricas que trae Next (`capsize-font-metrics.json`) solo tiene entradas para los nombres viejos separados (`bigShouldersDisplay`, `bigShouldersText`, etc.), no para el nombre fusionado; por eso ninguna variante de Big Shoulders puede generar fuente de respaldo ajustada hoy. Se cambió el rótulo a **Oswald** (misma voz condensada, mismos pesos 600/700), que sí tiene métricas registradas. `src/app/layout.tsx` y la pila de respaldo en `globals.css` (`--font-rotulo`) no necesitaron más cambios.
7. **Los 3 clics se cumplen:** buscar → tocar la canción (1) → tocar la versión (2) → tocar el tono (3).

### La portada vuelve a ser solo el buscador (2026-09-05)

Pedido explícito de diseño, en la misma sesión que el cambio anterior: `LandingHero` volvía a poner algo delante del buscador — justo lo que ese cambio decía resolver. Se revierte el enfoque: nada explica la app antes de dejarla usar. El buscador **es** la portada.

Se borran `src/components/inicio/LandingHero.tsx` y `DemoDeTransporte.tsx` enteros (sin reemplazo: no queda ningún resumen del flujo de 3 clics en la portada). En su lugar, `piezas.tsx` gana `Portada`, que envuelve el propio formulario de búsqueda: la etiqueta `{buscar}`, un `h1` moderado ("Busca una canción", ya no la frase de marketing "Cámbiala de tono") y el campo, centrados en el alto libre bajo el encabezado (`min-h-[56svh]`/`62svh`) para que el buscador sea lo primero que se ve al entrar, sin necesidad de bajar. Detrás, de fondo: un pentagrama de cinco líneas fijas (nueva utilidad `pauta-pentagrama` en `globals.css`, con el propio token `--color-pauta` — la pauta de una hoja de cifrado en blanco) y un resplandor azul-tinta (`bg-acorde-suave` desenfocado) centrado tras el campo, como si el buscador fuera el título que se apunta arriba de la primera pauta. Es la única licencia visual del cambio; todo lo demás se mantiene en los tonos neutros ya existentes.

La lista de resultados deja las tarjetas con borde redondeado y sombra por un listado con separadores finos (`divide-y divide-pauta`) y resalte de fondo al pasar el cursor — menos "tarjetas", más lista.

| Qué se hizo | Detalle | Archivos |
| --- | --- | --- |
| Portada = buscador | `Encabezamiento` se sustituye por `Portada` (misma pieza estática, sin `useSearchParams`, apta para el HTML prerrenderizado). `Buscador.tsx` y el `PortadaEnEspera` de `page.tsx` la usan igual. | `src/components/buscador/piezas.tsx`, `src/components/buscador/Buscador.tsx`, `src/app/page.tsx` |
| Fondo de pentagrama | Utilidad `pauta-pentagrama` (cinco líneas fijas vía `background-image` en capas, sin repetir) + resplandor con `blur-3xl`. Reactivo a claro/oscuro porque usa los tokens semánticos existentes, no colores nuevos. | `src/app/globals.css` |
| Resultados sin tarjetas | `rounded-xl border ... shadow` → `divide-y divide-pauta` con `hover:bg-hoja`. | `src/components/buscador/Buscador.tsx` |

**Verificado:** `npm run test:run` ✅ (206 pruebas, 21 archivos — reescritas las dos pruebas de `page.test.tsx` que dependían de `LandingHero`/`DemoDeTransporte`; el único fallo sigue siendo el mismo preexistente de backend, `versiones/route.test.ts`, sin tocar), `npx tsc --noEmit` ✅, `npm run build` ✅ (mismas rutas), `npm run lint` ✅ (0 errores, mismos avisos preexistentes). Probado a mano en el navegador (Playwright): claro y oscuro, escritorio (1280px) y móvil (390px) — el buscador es visible sin desplazar en los cuatro casos, y una búsqueda real (`?q=a`) sigue devolviendo canciones, fichas de artista y paginación con el estilo nuevo.

**Decisión:** el rediseño se acotó a la portada (`piezas.tsx`, `Buscador.tsx`, `page.tsx`) y al fondo global (`globals.css`); el encabezado, `PantallaDeLogin` y `SelectorDeTono` no se tocaron en este cambio — ya habían tenido su propio rediseño el mismo día (ver arriba) y el pedido apuntaba explícitamente a "la portada".

### La portada gana contenido debajo, y el encabezado se queda con toda la navegación (2026-09-05)

Tercer pedido de diseño de la misma sesión, en dos partes: la portada «estaba muy sola» —pero **debajo** del buscador, no encima (eso ya se decidió dos veces)— y en móvil la barra fija de iconos sobraba, con "Iniciar sesión" y "Registrarse" a la vista en el encabezado.

| Qué se hizo | Detalle | Archivos |
| --- | --- | --- |
| Tres franjas bajo el buscador | Solo cuando **no** hay búsqueda; en cuanto se busca, los resultados ocupan ese sitio. (1) *Abre una canción*: canciones reales del catálogo y fichas de artista que enlazan a `/?autor=…`, la respuesta a «no sé qué escribir». (2) *Prueba el transporte*: el visor en pequeño, con el motor de verdad. (3) *¿Falta la canción que tocas?*: la puerta a `/aportar`, diciendo que hace falta cuenta. Se separan con línea fina, no con tarjetas: la única caja de la página es la del cifrado, que sí representa un papel. | `src/components/inicio/Inicio.tsx`, `Catalogo.tsx`, `DemoDeTransporte.tsx` |
| El encabezado es la única navegación | Se borra `BarraNavegacion` (la barra fija inferior de móvil) y con ella el `pb-24` que le reservaba sitio. Un solo `<nav>` sirve a los dos anchos y cambia de forma con CSS: pastillas con icono a la derecha de la marca en escritorio; en móvil salta a una segunda línea del propio encabezado y se convierte en **pestañas de texto** a lo ancho, sin iconos, con la sección actual subrayada en azul de acorde (la misma "marca de traste" de antes, ahora bajo la etiqueta). | `src/components/nav/Encabezado.tsx`, `src/app/layout.tsx` |
| Entrar y registrarse, también en móvil | Dejan de ser `hidden md:flex`. Para que quepan junto a la marca en 360 px: enlace escueto + un solo botón sólido, marca a `text-lg` en móvil y `Boton`/`BotonEnlace` con `tamano="compacto"` (prop nueva; `normal` es lo de siempre, así que ningún otro consumidor cambia). Medido en el navegador: entra en una línea desde 360 px; por debajo salta de línea sin desbordar. | `src/components/nav/Encabezado.tsx`, `src/components/ui/Boton.tsx` |
| Fila de canción compartida | El resultado de búsqueda y la canción del catálogo son la misma pieza (`FilaDeCancion` en `piezas.tsx`): una canción se ve igual se haya llegado a ella buscando o mirando. | `src/components/buscador/piezas.tsx`, `Buscador.tsx` |

**Verificado:** `npm run test:run` ✅ (212 pruebas, 21 archivos — `page.test.tsx` suma catálogo, demo que transporta de verdad y el caso de catálogo caído; `Encabezado.test.tsx` suma riel único y accesos visibles en móvil; el único fallo sigue siendo el preexistente de backend, `versiones/route.test.ts`, sin tocar), `npx tsc --noEmit` ✅, `npm run build` ✅ (mismas rutas, `/` sigue estática), `npm run lint` ✅ (0 errores; los 12 avisos preexistentes). Probado a mano en el navegador (Playwright) contra la base real, claro y oscuro, en 360 / 390 / 1280 px: el catálogo trae las 4 canciones y los 3 artistas de la base, C→E devuelve E/B/C#m/A/E con "+4 semitonos", y no hay desbordamiento horizontal en ningún ancho.

**Decisiones y desviaciones:**

1. **La barra fija inferior era de Fase 7 §1.** Se quita a pedido explícito. Lo que se pierde es alcance con el pulgar (el teléfono en un atril, una mano libre); lo que se gana es una sola superficie de navegación, sin iconos que descifrar, y ~90 px de alto libre en el visor, que es la pantalla donde el sitio importa. La barra vivía en `layout.tsx`, así que el cambio vale para toda la app, no solo para la portada.
2. **`DemoDeTransporte` vuelve, pero debajo.** Lo que se revirtió el 2026-09-05 no era la demo sino su sitio: explicaba la app antes de dejar usarla. Ahora está reescrita sobre `parsearChordPro` + `renderizar` + `<Cifrado>` (antes mapeaba los acordes a mano), así que es literalmente el visor en miniatura y no una copia del comportamiento.
3. **El catálogo no promete "recientes" ni "populares".** `GET /canciones` ordena por título ascendente y no hay ningún campo de fecha ni de uso en la respuesta, así que la sección se llama "Abre una canción" y enseña las 5 primeras. Si algún día el backend ordena por fecha de alta, es cambiar el parámetro, no la pantalla. **No se tocó ningún endpoint.**
4. **`autoresSugeridos` no está paginado** (lo devuelve entero `GET /canciones` cuando no se filtra por autor). Con el catálogo de hoy son 3 nombres; con miles de canciones esa lista crece sin tope en cada respuesta. La portada solo pinta los 8 primeros, pero el arreglo real es del lado del servidor — anotado en `docs/pendientes-backend-y-frontend.md` como pendiente de backend, no implementado aquí.
5. **Si el catálogo falla, la sección desaparece** (mismo criterio que el chequeo de duplicados de E.3: si la red falla, se calla). La portada nunca depende de la red para ser usable: el buscador ya está arriba.

### Se quita «Abre una canción» y se ajusta el espaciado móvil de la portada (2026-09-06)

Pedido explícito: la franja de catálogo sobraba en la portada, y en móvil el hueco entre el campo de búsqueda y «Prueba el transporte» se veía demasiado separado.

| Qué se hizo | Detalle | Archivos |
| --- | --- | --- |
| Fuera «Abre una canción» | Se borra `Catalogo.tsx` entero (sin reemplazo) y su uso en `Inicio.tsx`, que ahora abre directo con «Prueba el transporte». | `src/components/inicio/Catalogo.tsx` (borrado), `src/components/inicio/Inicio.tsx` |
| Menos alto forzado en `Portada` en móvil | `min-h-[44svh]` centraba el título y el campo dentro de una franja fija, que en un teléfono alto dejaba mucho vacío arriba y abajo del buscador antes de llegar al contenido. Se quita el `min-h` de base (el alto lo da el contenido + `py-8`) y el `min-h-[48svh]` original queda solo desde `sm:` — el escritorio conserva la portada espaciosa. | `src/components/buscador/piezas.tsx` |
| Primera franja con menos relleno arriba en móvil | `border-t border-pauta py-10` → `pt-8 pb-10 sm:pt-10` en la sección de «Prueba el transporte», ahora la primera bajo el buscador. | `src/components/inicio/Inicio.tsx` |
| Pruebas del catálogo, fuera | `page.test.tsx` pierde las dos pruebas atadas a `Catalogo` (la de las canciones listadas y la del catálogo caído) y el mock de `pedirApi`/`beforeEach` que solo existían para ellas. | `src/tests/app/page.test.tsx` |

**Verificado:** `npm run test:run` ✅ (250 pruebas, 29 archivos — el único fallo es el mismo preexistente de backend, `versiones/route.test.ts`, sin tocar), `npx tsc --noEmit` ✅, `npm run build` ✅ (una ruta menos que consultar: `/` ya no depende del catálogo). Probado a mano en el navegador (Playwright) en 390 px y 1280 px: en móvil el buscador y «Prueba el transporte» quedan a un espaciado normal de sección, sin franja vacía de por medio; en escritorio la portada no cambió.

**Decisión:** no se tocó ningún endpoint ni la sección «¿Falta la canción que tocas?». `autoresSugeridos` (deviación 4 de más arriba) deja de aplicar: ya no se pinta en la portada.

### El inicio deja de ser el buscador: dos puertas y `/buscar` (2026-09-11)

Pedido explícito: sacar el buscador del inicio y dejar allí dos botones, «Buscar canciones» y «Aportar», con el de aportar llevando al login si no hay sesión.

**Concepto:** el inicio pasa a ser la bifurcación entre los dos verbos del cancionero — leer una canción o escribirla. No son dos botones iguales: buscar se usará muchas más veces que aportar, así que se lleva la variante sólida (`primario`, `grande`, `min-w-56`) y aportar se queda en `secundario` con menos ancho (`min-w-44`). La asimetría es la jerarquía; dos pastillas idénticas centradas no dirían nada sobre qué hacer primero. Se reutiliza el armazón de `Portada` (pauta + halo) en vez de inventar lenguaje visual nuevo, y nada va dentro de una tarjeta: la única caja de la app sigue siendo la del cifrado.

| Qué se hizo | Detalle | Archivos |
| --- | --- | --- |
| Buscar se muda a `/buscar` | La página nueva es literalmente lo que había en `/`: el `Suspense` con la portada en espera y el `<Buscador>`. `Buscador` escribe ahora la URL sobre `/buscar` y ya no pinta `<Inicio>` cuando no hay término. | `src/app/buscar/page.tsx` (nuevo), `src/components/buscador/Buscador.tsx` |
| El inicio, dos puertas | `Inicio.tsx` se reescribe: deja de ser «lo que va debajo del buscador» y pasa a ser la pantalla entera. Se elimina la sección «¿Falta la canción que tocas?» — el botón «Aportar» ya la cubre y dos llamadas al mismo sitio en una pantalla diluyen la jerarquía. La demo del transporte se conserva, debajo de la pauta fina. | `src/components/inicio/Inicio.tsx`, `src/app/page.tsx` |
| `Portada` recibe el rótulo | El armazón lo comparten las dos pantallas, así que el `<h1>` viene por prop (`titulo`) en vez de estar escrito dentro. De paso, `max-w-[22ch]` + `text-balance` para que el título nuevo, más largo, no parta mal. | `src/components/buscador/piezas.tsx` |
| Aportar avisa antes del clic | El botón es un `<Link href="/aportar">` normal: el gating lo sigue haciendo `ExigeSesion`, que manda a `/login?volverA=%2Faportar`. Debajo, atado con `aria-describedby`, «Necesitas una cuenta.» — decirlo antes es más honesto que descubrirlo después del redirect. No se añadió ningún mecanismo de sesión nuevo. | `src/components/inicio/Inicio.tsx` |
| Enlaces viejos al buscador | Todos los «← Buscar» / «Volver a buscar» / «Buscar canciones» apuntaban a `/` y ahora apuntan a `/buscar`. | `src/components/cancion/DetalleDeCancion.tsx`, `src/components/visor/Visor.tsx`, `src/components/favoritos/Favoritos.tsx`, `src/components/aportar/Aportar.tsx` |
| Riel de navegación | El destino «Buscar» pasa a `/buscar`, y `esDestinoActivo` deja de tratar `/` como buscar: en el inicio no se subraya ninguna pestaña. | `src/components/nav/destinos.tsx` |
| URLs de búsqueda ya compartidas | `/?q=…&autor=…&page=…` hace `redirect()` a `/buscar?…` con los mismos parámetros, para que un enlace que alguien pasó por ahí no aterrice en una portada que ignora lo que pedía. | `src/app/page.tsx` |
| Pruebas | `page.test.tsx` se reescribe alrededor del inicio nuevo (las dos puertas, el aviso de cuenta, que ya no hay `searchbox`, el redirect y su ausencia) y se añade `src/tests/app/buscar/page.test.tsx` (el campo, que no arrastra la portada del inicio, y que el término se escribe sobre `/buscar`). `destinos.test.ts` se ajusta a la ruta nueva y gana una prueba de que el inicio no activa ninguna sección. | `src/tests/app/page.test.tsx`, `src/tests/app/buscar/page.test.tsx` (nuevo), `src/tests/components/nav/destinos.test.ts` |

**Verificado:** `npm run test:run` ✅ (257 pruebas, 31 archivos; 3 fallos, **ninguno de este cambio** — 2 salen del trabajo sin commitear en `PantallaDeLogin.tsx`/`Campo.tsx` y 1 es el preexistente de backend en `versiones/route.test.ts`; comprobado con `git stash` que los tres fallan igual sin estos cambios). `npx tsc --noEmit` ✅ sin salida. `npm run lint` ✅ sin hallazgos nuevos en los archivos tocados (los 2 errores y 15 avisos son todos preexistentes o del trabajo en curso de login). `npm run build` ✅, 29 rutas. **No se probó a mano en el navegador**: no hay Playwright instalado (F.3 sigue pendiente) y las reglas del proyecto piden no usarlo sin pedido explícito.

**Desviaciones y deuda:**

1. **`/` pasa de estática a dinámica (`ƒ`)** porque lee `searchParams` para el redirect de compatibilidad. Es el precio de no romper los enlaces `/?q=…` ya compartidos. Cuando se dé por amortizado ese redirect, borrarlo devuelve `/` a prerenderizado estático.
2. **`/buscar` sin término queda vacía debajo del campo.** Ese hueco lo llenaba `Inicio`, que ahora es su propia pantalla. Se deja vacío a propósito: la `Portada` ocupa 48svh y el campo centrado es la pantalla. Lo natural ahí sería «recién aportadas», pero no hay endpoint que lo sirva (`GET /canciones` no ordena por fecha de alta); queda anotado como hueco de backend, no implementado.
3. **El copy del `<h1>` del inicio** («Canciones con acordes, en el tono que tú tocas.») es una propuesta, no un texto validado con nadie. Vive en un solo sitio, `Inicio.tsx`.
4. **Sin sesión, el riel del encabezado sigue oculto** (`Encabezado` solo lo pinta con `estado === "autenticado"`). No se tocó: quien entra anónimo navega desde el inicio y desde los «← Buscar» de cada pantalla.

### Retoque visual del inicio: dos botones en fila (2026-09-11)

Pedido explícito: el inicio «se ve horrible, sobre todo ese toggle de añadir canción y buscar» → «hazlo como 2 botones uno al lado del otro». Hubo un intento intermedio con dos puertas apiladas a todo el ancho, y se descartó con el pedido de dejarlas en fila.

**Concepto:** el marco partido en dos mitades (`bg-tinta` | papel, mismo borde) se leía como un interruptor —dos estados de una misma cosa— y no como dos destinos. Ahora son dos botones sueltos con `gap-3` entre ellos. La jerarquía la siguen dando los rellenos de `Boton` (`primario` en tinta para buscar, `secundario` en papel con borde para aportar).

| Qué se hizo | Detalle | Archivos |
| --- | --- | --- |
| Dos botones sueltos en fila | Pastillas `rounded-full` con icono, en `flex flex-wrap gap-3`. Se estilan con las mismas clases de color que `primario`/`secundario`, pero no con `BotonEnlace`: su tamaño `grande` (px-6, text-base) no deja los dos en una fila a 360 px, y sobrescribir el relleno por `className` choca con sus propias clases. En móvil llevan `px-4 py-3 text-[0.9375rem]` y desde `sm:` `px-6 py-3.5 text-base`. Por debajo de ~360 px `flex-wrap` baja «Aportar» a otra línea en vez de desbordar. | `src/components/inicio/Inicio.tsx` |
| Encabezado propio, alineado a la izquierda | El inicio deja de usar `Portada`: rótulo a la izquierda y más grande (`clamp(2.25rem,9vw,3.5rem)`, `max-w-[16ch]`), posado sobre el mismo `pauta-pentagrama`, y sin el halo difuminado. `/buscar` sigue con `Portada` tal cual. | `src/components/inicio/Inicio.tsx` |
| Aviso de cuenta | Se queda «Aportar necesita una cuenta.» debajo de la fila, atado con `aria-describedby`, ahora alineado a la izquierda con los botones. | `src/components/inicio/Inicio.tsx` |
| La demo, sobre una hoja | El fragmento va dentro de un `<figure>` en `bg-hoja-alta` con borde y `shadow-hoja` (la única caja de la app es la del cifrado). La distancia al original («Tono original», «+2 semitonos») sube a la cabecera de la hoja, junto a los acordes que cambian. Se quita el espaciador vacío `h-9` que había encima. | `src/components/inicio/DemoDeTransporte.tsx` |
| Pruebas | El aviso de cuenta se comprueba como descripción accesible del enlace «Aportar», y la prueba del marco compartido pasa a «las dos puertas van en la misma fila». | `src/tests/app/page.test.tsx` |

**Verificado:** `npx vitest run src/tests/app/page.test.tsx` ✅ (7 pruebas). `npx tsc --noEmit` ✅. `npx eslint` sobre los archivos tocados ✅. Los 2 fallos de `PantallaDeLogin.test.tsx` que salen al correr `src/tests/components` son del trabajo sin commitear en login, no de este cambio. **No se probó en el navegador** (sin Playwright, por regla del proyecto). Los anchos a 360 px están calculados a mano, no medidos.

**Segunda ronda, mismo día** (pedido: título centrado, uno de los dos botones solo texto, los dos centrados, y el ejemplo sin caja, sin fondo y sin la palabra «Ejemplo»). Esto reemplaza parte de la tabla de arriba:

- **Rótulo y acciones centrados.** Fila `justify-center` con `gap-x-6`. Aviso de cuenta centrado debajo.
- **Aportar pasa a enlace de texto** («Aportar una canción», subrayado fino en `pauta-fuerte` que se oscurece a `tinta` al pasar el ratón). Buscar queda como la única pastilla sólida. La jerarquía ya no es solo de color: es de forma. Como ya no hay dos pastillas, desaparecen las constantes `BOTON`/`PRINCIPAL`/`SECUNDARIO` y el problema de ancho a 360 px: el enlace de texto no lleva relleno lateral.
- **La demo, suelta.** Fuera el `<figure>` con fondo, borde y sombra, y fuera el «Ejemplo». La distancia al original vuelve debajo del selector, centrada, como en el visor.
- **Pruebas:** el enlace se busca como «Aportar una canción».

**Tercera ronda (2026-10-05)** — pedido: título nuevo «más animado», sin que la tilde de la «Ú» estorbe; después, **quitar los botones** del inicio y que se vea bien en móvil. Esto reemplaza lo de las dos rondas anteriores sobre botones y aviso de cuenta:

| Qué se hizo | Detalle | Archivos |
| --- | --- | --- |
| Cabecera animada, «la hoja que se reescribe» | Componente de cliente nuevo: pentagrama que se traza, título escrito palabra a palabra, círculo a boli sobre «tú» y una hoja de cifrado que cambia de tono sola (usa `renderizar` real). Alineado a la izquierda en dos columnas desde `lg:`. | `src/components/inicio/HeroInicio.tsx` (nuevo), `src/app/globals.css` |
| La tilde | `line-height` del título de `1.08` a `1.16` y entrada solo con opacidad/desplazamiento, sin máscara que recorte la tilde. | `HeroInicio.tsx` |
| Sin botones ni aviso de cuenta | Fuera «Buscar canciones», «Aportar una canción» y «Aportar necesita una cuenta.»: la barra ya ofrece Buscar/Aportar en todas las pantallas. Se añade un subtítulo de una línea. **Desviación:** el pedido original (secc. anterior) era tener esos dos accesos en el inicio; ahora la portada no tiene ninguna acción propia. | `HeroInicio.tsx`, `Inicio.tsx` |
| Fuera «Prueba el transporte» | Se borra `DemoDeTransporte.tsx` (a pedido: la cabecera ya enseña el mismo cambio de tono). Pasó antes por una versión intermedia en dos columnas con la demo sobre una hoja. | `DemoDeTransporte.tsx` (borrado), `Inicio.tsx` |
| Dos bloques nuevos bajo la cabecera | `Funciones.tsx`: (1) «Escribe el acorde donde cae», con el ChordPro escribiéndose solo y su vista previa real encima de la letra (RN-011); (2) «Notas o grados, como prefieras», que alterna C/G y notas/grados para que se vea que los grados no cambian con el tono (RN-004). Dos columnas desde `lg:`, el segundo bloque invertido; entrada al hacer scroll (`animation-timeline: view()` solo donde el navegador lo soporta). Las demos son decorativas y arrancan al entrar en pantalla (`IntersectionObserver`); sin esa API quedan en su estado final. | `src/components/inicio/Funciones.tsx` (nuevo), `Inicio.tsx`, `globals.css` |
| Móvil | Se parte de lo que gustó en escritorio (pentagrama, acordes flotando, título con aire) y se traduce a una columna. Título `clamp(2.6rem,12vw,4.75rem)`, que se parte como en escritorio y sin ninguna línea detrás. Cuatro acordes flotantes puestos en los huecos de las líneas cortas y alrededor de la hoja. La hoja de la cabecera entra desde abajo. | `HeroInicio.tsx`, `globals.css` |
| Pentagrama sin cruzar el título | Las pautas pasaban por detrás de las letras (escritorio) y, por un bug, salían también en móvil: la regla `.hero-pauta { display: flex }` sin capa pisaba el `hidden` de Tailwind, y se sumaban a unas pautas que yo había puesto bajo cada renglón del título (`hero-reglado`, **eliminado**). Ahora el pentagrama va dentro de la columna de la hoja (`lg:` en adelante): sale de detrás de la tarjeta hacia el borde derecho y se desvanece por la izquierda antes de llegar al título. En una columna (móvil y tableta) no hay pentagrama. El `display` y la dirección pasan al marcado para no repetir el choque con las utilidades. | `HeroInicio.tsx`, `globals.css` |
| Movimiento con «reducir animaciones» | Windows activa `prefers-reduced-motion` a menudo sin que se note, y la regla global de `@layer base` más la versión inicial de la cabecera dejaban la portada sin ninguna animación. Ahora, con esa preferencia, la cabecera y la demo (`[data-suave]`, exentas de la regla global) conservan fundidos, el trazo del círculo y el cambio de color de los acordes, y pierden solo lo que desplaza, inclina, desenfoca o flota (se cambia `animation-name`, no los tiempos). El tono gira también con la preferencia activa. **Desviación:** la regla del proyecto era apagar todo con movimiento reducido; aquí se relaja a propósito, solo en estas dos secciones. | `src/app/globals.css`, `HeroInicio.tsx`, `Inicio.tsx` |
| Destello de acordes | El destello era un fondo azul que salía como un bloque ancho; ahora el acorde pasa de `tinta` a `acorde`. El círculo de «tú» lleva `mx-[0.22em]` para no rozar «QUE» ni «TOCAS». | `globals.css`, `HeroInicio.tsx` |
| `aria-label` en el `<h1>` | Con cada palabra en su `inline-block` el nombre accesible perdía los espacios. | `HeroInicio.tsx` |
| Pruebas | Se quitan las de los dos enlaces, el aviso y la fila; también la de la demo del transporte, que ya no existe. Entran «se presenta con su título», «no lleva botones de buscar ni de aportar», «explica cómo se escribe y cómo se lee» y «las demos arrancan completas, no vacías». El temporizador no gira sin `matchMedia` (jsdom). | `src/tests/app/page.test.tsx` |

**Verificado:** vitest de `page.test.tsx` ✅ (6), `tsc` ✅, `eslint` ✅. Revisado en capturas de Edge headless emulando 360 y 390 px, con y sin `prefers-reduced-motion` (CDP directo, sin Playwright). La suite completa tiene 3 fallos fuera de la home (`PantallaDeLogin.test.tsx` ×2 y la ruta `versiones`), sin relación con este cambio.

## Bloque E · Cuenta y contribución

- [x] **E.1 · Login / Registro** (HU-01) — mensaje de error **genérico** en credenciales inválidas (sin decir qué campo falló); mensaje específico si el correo ya existe. Retorno al contexto exacto donde estaba el usuario tras autenticarse.
- [x] **E.2 · Botón de favorito + página Favoritos** (HU-07) — marcar/desmarcar al instante, sin confirmación (no es destructivo). Sin sesión: redirigir a login sin perder la versión que se estaba viendo. Estado vacío que invite a explorar.
- [x] **E.3 · Aportar canción / versión** (HU-08, HU-09, HU-10) — hecha el 2026-08-23 sobre el renderizador real del Bloque A. *El único punto que no se puede probar de punta a punta es el guardado de una canción **nueva**, por el `401` de `POST /canciones` (B.4, backend).*
  - [x] Formulario: título, artista, tono original, textarea de ChordPro.
  - [x] **Vista previa renderizada en tiempo real** (RN-011), al lado del textarea en pantalla ancha y debajo en móvil (RN-012).
  - [x] Errores de sintaxis señalados **en el punto exacto**, sin romper ni congelar la vista previa (RN-013), y botón Guardar deshabilitado hasta corregirlos.
  - [x] Advertencia no bloqueante de posible duplicado título+artista (RN-010).
  - [x] Confirmación de que el aporte quedó "Pendiente de revisión".
- [x] **E.4 · Perfil** (HU-12, HU-13, HU-14) —
  - [x] Subir/cambiar foto de perfil, con rechazo claro de archivo no-imagen o > 10 MB sin tocar la foto anterior.
  - [x] "Mis aportes" con la etiqueta de estado (Pendiente / Verificada / Rechazada) y su estado vacío.
  - [x] Eliminar versión propia, con modal de confirmación explícito.
  - [x] Eliminar cuenta, con modal que explique qué se conserva (versiones verificadas) y qué se pierde.
  - [x] Cerrar sesión.
- [ ] **E.5 · Panel de administración** (HU-11) — solo visible dentro de Perfil y solo con rol `administrador`. Lista de pendientes con canción y autor, detalle con la versión **renderizada** (no ChordPro crudo), acciones Aprobar / Rechazar, confirmación explícita al rechazar, y manejo del `409` si otro administrador ya la revisó. **Ya no está bloqueada por nada:** el acceso a los datos se arregló el 2026-08-23 (RN-015 y el payload de `GET /versiones/{id}`, ver Bloque B) y el renderizador que pide HU-11 existe desde el Bloque A — E.3 ya lo usa en producción de la misma forma que lo necesita este panel (`parsearChordPro` + `renderizar` + `<Cifrado>`). Lo único que seguirá faltando es el nombre del autor: no hay endpoint que resuelva `autorId` → `username` (B.5).

### Cómo quedó E.1 (2026-08-22)

| Qué se hizo | Archivos |
| --- | --- |
| `PantallaDeLogin` dejó de ser un `PantallaPendiente` y llama de verdad a `POST /auth/login` y `/auth/register`, que ya existían. Un conmutador (mismo patrón accesible que `ConmutadorDeModo`) cambia entre "Entrar" y "Crear cuenta" sin navegar a otra ruta. Campos con subrayado en vez de caja (`CampoDeTexto`, nuevo primitivo en `ui/`, junto a `Boton` y `Aviso`) — el renglón remite a la hoja pautada de C.1 en vez del control genérico de cualquier formulario — con mostrar/ocultar en la contraseña. Validación de campos vacíos en el cliente, que se limpia campo a campo al volver a escribir. Error de la API en un `Aviso` genérico (`mensajeDeError`); `volverA` (Bloque C) se conserva y al autenticarse hace `router.replace` de vuelta ahí. | `src/components/sesion/PantallaDeLogin.tsx`, `src/components/ui/Campo.tsx` |

**Verificado:** `npm run build` ✅, `npm run test:run` ✅ (49 pruebas, 8 archivos — suma `src/tests/components/sesion/PantallaDeLogin.test.tsx`), `npm run lint` ✅ (0 errores). Probado a mano en el navegador (Playwright headless) en modo claro y oscuro, `Entrar` y `Crear cuenta`, validación, y mostrar/ocultar contraseña.

**Desviaciones:**

1. ~~`user` que devuelven `/auth/login` y `/auth/register` no trae `rol` ni `fotoPerfilUrl`...~~ **Resuelto el 2026-08-23:** ahora que `GET /auth/me` (B.2) existe, `PantallaDeLogin` llama a `refrescar()` (pide `/auth/me`) antes de navegar en vez de adivinar `rol: "musico"`. Un administrador se reconoce como tal desde el primer clic.
2. **El 409 de registro no distingue correo de nombre de usuario duplicado** ("El correo o el nombre de usuario ya están en uso"): es el mensaje que ya da el backend hoy, y separarlo es cambio de API (B.0/B.2), no de esta pantalla.
3. **Sin verificación de correo ni límite de intentos** — no estaba en el alcance de HU-01 ni lo pide RN alguna del backend actual.

### Cómo quedaron E.2 y E.4 (2026-08-23)

| Tarea | Qué se hizo | Archivos |
| --- | --- | --- |
| E.2 | `BotonDeFavorito`: sin sesión, redirige a `/login?volverA=<página actual>` sin llamar a la API; con sesión, pide `GET /favoritos` una sola vez al montar para saber si ya es favorita, y alterna con `POST`/`DELETE` de forma optimista (revierte y muestra el error si la llamada falla). Se colocó en el encabezado del Visor — es donde un músico decide si le sirvió la versión — no en cada fila de `DetalleDeCancion`, para no disparar N peticiones de "¿es favorita?" por cada versión de una lista. La página de Favoritos lista título/artista/tono (con el join que trae `GET /favoritos` de fábrica) y excluye en silencio las versiones eliminadas (RN-019). | `src/components/favoritos/BotonDeFavorito.tsx`, `src/components/favoritos/Favoritos.tsx`, `src/app/favoritos/page.tsx` |
| E.4 · foto | `POST /usuarios/me/foto` con `FormData`; se rechaza en el cliente un archivo que no sea imagen o que pese más de 10 MB **antes** de subir nada, así que la foto anterior nunca se toca si la nueva es inválida. | `src/components/perfil/Perfil.tsx` |
| E.4 · Mis aportes | `GET /myContributions` no trae título ni artista (B.5 sigue abierto), así que el cliente junta los `cancionId` únicos y pide `GET /canciones/{id}` una vez por cada uno (N+1 aceptable al tamaño de MVP) para completar la fila. Etiqueta de estado reutilizada de D.2/D.3. "Solicitar eliminación" llama al mismo `PATCH /versiones/{id}` de dos pasos que ya existía (decisión abierta #1: se mantuvo el flujo de dos pasos, con el botón etiquetado tal cual se sugería), detrás de un modal de confirmación nuevo (`Confirmacion`). | `src/components/perfil/Perfil.tsx`, `src/components/ui/Confirmacion.tsx` |
| E.4 · cuenta | "Cerrar sesión" limpia el estado local y vuelve al inicio (`SesionProvider.cerrarSesion`). En 2026-08-23 no había `POST /auth/logout` para borrar la cookie httpOnly desde el servidor; desde el 2026-09-06 sí lo llama — ver "Se arregla el logout" más abajo. "Eliminar cuenta" pide confirmación explicando qué se conserva (las versiones verificadas siguen visibles para los demás) y qué no (el resto de la cuenta, incluidos los favoritos, deja de ser accesible), luego llama a `DELETE /usuarios` (ya existía, y ese sí borra las cookies del lado del servidor) y limpia la sesión. | `src/components/perfil/Perfil.tsx`, `src/lib/sesion/SesionProvider.tsx` |
| C.3 (retocado) | `SesionProvider` ya no espera `{ data: usuario }`: `GET /auth/me` devuelve el usuario plano. Se agregó `cerrarSesion()` al contexto. | `src/lib/sesion/SesionProvider.tsx` |

**Verificado:** `npm run build` ✅ (20 rutas: 14 de API + 6 de página), `npm run test:run` ✅ (52 pruebas, 8 archivos — suma `src/tests/components/favoritos/BotonDeFavorito.test.tsx` y ajusta `PantallaDeLogin.test.tsx` al nuevo flujo de `refrescar()`), `npm run lint` ✅ (0 errores; siguen los avisos preexistentes de variables sin usar en los route handlers). Probado a mano con `curl` de punta a punta: registro → `GET /auth/me` → marcar favorito → listar favoritos.

**Desviaciones y deuda que dejan E.2/E.4:**

1. **El botón de favorito no está en `DetalleDeCancion`**, solo en el Visor. Se decidió así para no multiplicar la llamada a `GET /favoritos` por cada fila de la lista de versiones; si se pide más adelante, conviene subir el estado de favoritos a un contexto compartido en vez de repetir el patrón del botón.
2. **"Mis aportes" hace N+1 contra `/canciones/{id}`** por la falta de datos de canción en `/myContributions` (B.5). Aceptable al tamaño actual del catálogo; hay que quitarlo en cuanto B.5 se cierre.
3. **El panel de admin no muestra el nombre de quien aportó**, solo podrá mostrar `autorId` cuando se construya E.5: no existe ningún endpoint que resuelva un id de usuario a `username`.
4. **`GET /auth/me` sigue sin usar el catálogo de errores** (responde `{ message: <objeto>, }` con un bug propio: anida el objeto de error en vez de su texto). No bloqueó nada porque `SesionProvider` trata cualquier fallo de `/auth/me` como "sin sesión" sin mirar el cuerpo del error; queda anotado en B.0/B.2 para cuando se unifiquen los doce route handlers.

### Se arregla el logout (2026-09-06)

Reporte de usuario: "Cerrar sesión" en `/cuenta` a veces mandaba a
`/login?volverA=%2Fcuenta` en vez de al inicio, y tras recargar (o volver con
el botón atrás del navegador) la sesión seguía activa como si nunca se
hubiera cerrado, de forma repetible siempre.

Dos causas independientes, ambas en el frontend salvo la primera línea:

1. **La cookie httpOnly nunca se invalidaba.** `DELETE /api/v1/auth/logout`
   existe desde el 2026-08-27 (lo agregó la persona de backend, commit
   `5ccdf2a`) pero nadie lo conectó ni actualizó los documentos que decían
   que no existía — ver `docs/pendientes-backend-y-frontend.md`. `cerrarSesion()`
   ahora lo llama (best effort) antes de navegar.
2. **Carrera entre `cerrarSesion` y `ExigeSesion`.** Al cerrar sesión desde
   una pantalla protegida (`/cuenta`), `estado` pasaba a `"anonimo"` antes de
   que el `router.push("/")` de `cerrarSesion` terminara de navegar.
   `ExigeSesion`, que sigue montado sobre `/cuenta` en ese instante, veía el
   mismo cambio de `estado` y disparaba su propio `router.replace` al login —
   y esa segunda navegación le ganaba la carrera a la primera. Se agregó
   `saliendo` al contexto de sesión (`true` mientras `cerrarSesion` está en
   vuelo, se apaga solo cuando el pathname cambia de verdad); `ExigeSesion`
   no redirige a login mientras esté encendido.

**Verificado:** `npm run test:run` ✅ (252 pruebas — dos nuevas en
`SesionProvider.test.tsx` para el llamado a `DELETE /auth/logout`; el único
fallo sigue siendo el mismo preexistente de backend, sin tocar),
`npx tsc --noEmit` ✅. Probado a mano en el navegador (Playwright): registrar
cuenta → `/cuenta` → "Cerrar sesión" aterriza en `/` (no en `/login`); volver
atrás o recargar `/cuenta` después manda a `/login?volverA=%2Fcuenta` en vez
de mostrar la cuenta como si la sesión siguiera activa.

De paso, se agregó `allowedDevOrigins: ["127.0.0.1"]` a `next.config.ts`: el
aviso de Next.js sobre orígenes cruzados en dev aparecía por acceder al
servidor de desarrollo vía `127.0.0.1` en vez de `localhost`, sin relación
con el bug de logout.

**Ampliación, mismo día:** pedido explícito de "la mejor práctica para
cerrar sesión". Con la cookie ya invalidándose, quedaba un hueco de
experiencia: con PentCord abierto en dos pestañas, cerrar sesión en una
dejaba la otra actuando como autenticada hasta su próxima revalidación
(cambio de foco/visibilidad). Se agregó sincronización entre pestañas con
`BroadcastChannel` (`"pentcord:sesion"`): `cerrarSesion()` emite `"cerrada"`
tras invalidar la cookie, y cada `SesionProvider` suscrito reacciona al
instante limpiando su estado local (no vuelve a llamar a `DELETE
/auth/logout`, ya lo hizo la pestaña que inició el cierre). Si la pestaña
que recibe el aviso está en una pantalla protegida, `ExigeSesion` la manda
sola a `/login` en cuanto ve `estado === "anonimo"` — mismo mecanismo que ya
usa para una sesión caducada, sin código nuevo ahí. Navegadores sin
`BroadcastChannel` simplemente se quedan con el comportamiento de antes
(esperan a la próxima revalidación). Tercera prueba nueva en
`SesionProvider.test.tsx` (253 pruebas en total). `src/lib/sesion/SesionProvider.tsx`.

### Cómo quedó E.3 (2026-08-23)

| Tarea | Qué se hizo | Archivos |
| --- | --- | --- |
| Una pantalla, dos destinos | `/aportar` sin parámetros aporta una **canción nueva**; `/aportar?cancion=<id>` aporta una **versión** a una que ya existe (es el enlace que ya emitía `DetalleDeCancion`). El parámetro se lee en el servidor, así que el componente no necesita ir detrás de un `Suspense` como el buscador. Cambiar de destino **no navega**: es solo estado, para que quien acaba de escribir una canción entera no la pierda justo cuando descubre que ya estaba en el catálogo. | `src/app/aportar/page.tsx`, `src/components/aportar/Aportar.tsx` |
| Vista previa (RN-011, RN-012) | Primer consumidor real del Bloque A: `parsearChordPro` en cada tecleo y `renderizar` con el tono elegido, reutilizando el mismo `<Cifrado>` del visor — lo que se ve aquí es literalmente lo que verá quien la toque. En pantalla ancha va al lado del textarea y se queda pegada al desplazarse; en móvil, debajo. El tono elegido manda en la ortografía: en Eb un `[C#]` se pinta `Db`. | `src/components/aportar/VistaPrevia.tsx` |
| Errores en el punto exacto (RN-013) | El parser no lanza nunca, así que la vista previa no se rompe ni se congela mientras se escribe un acorde a medias. La línea con error se marca en su sitio (`data-linea-error`, borde y fondo de alerta) y debajo va la lista `línea:columna` + mensaje; **cada error es un botón que lleva el cursor a ese punto del textarea**. Guardar se deshabilita mientras haya errores bloqueantes, y al lado del botón se dice por qué. | `src/components/aportar/VistaPrevia.tsx`, `src/components/aportar/errores.ts`, `src/app/globals.css` |
| Duplicado (RN-010) | El backend no avisa (B.3 sigue abierto), así que lo hace el cliente: con 3+ caracteres de título, rebote de 400 ms contra `GET /canciones?titulo=…` y se quedan solo las coincidencias de título **exacto** (sin distinguir mayúsculas ni tildes, con `localeCompare`). El aviso no bloquea nada — dice que se puede seguir y crear la canción igual — y cada coincidencia trae un botón «Aportar mi versión aquí» que cambia el destino sin perder lo escrito. Si la búsqueda falla, se calla. | `src/components/aportar/Aportar.tsx` |
| Tono original (RN-002) | Se reutiliza la tira cromática de D.3 en vez de un desplegable: elegir tono es un toque y solo se puede elegir uno de los 12 válidos, así que la regla se cumple por construcción. `SelectorDeTono` acepta ahora `tonoOriginal: null` (aquí no hay "casa" anterior que marcar) y una etiqueta propia para el lector de pantalla. | `src/components/visor/SelectorDeTono.tsx` |
| Confirmación | Tras guardar, la pantalla se sustituye por el acuse: canción, `EtiquetaDeEstado` con el estado **que devolvió la API** (no un "pendiente" escrito a mano — el día que RN-014 exista, un administrador verá "Verificada" sin tocar esto), qué pasa ahora, y tres salidas: ver la versión, ir a la canción, aportar otra. | `src/components/aportar/Aportar.tsx` |
| Ayuda | Un `<details>` con la sintaxis: acorde entre corchetes pegado a su sílaba, las ocho secciones entre llaves, y los siete tipos de acorde que PentCord sabe transportar. | `src/components/aportar/Aportar.tsx` |

**Verificado:** `npm run test:run` ✅ (192 pruebas, 17 archivos — 9 nuevas en `src/tests/components/aportar/Aportar.test.tsx`), `npx tsc --noEmit` ✅, `npm run build` ✅ (21 rutas), `npm run lint` ✅ (0 errores; siguen los 10 avisos preexistentes de los route handlers). Contra el servidor de verdad, con `curl` y una sesión real: `POST /canciones/{id}/versiones` → `201 { data: { id, estado: "pendiente", tono_original } }`, que es exactamente lo que consume la pantalla; `POST /canciones` → `401` (ver B.4). Los datos de prueba que se crearon para comprobarlo se borraron después. **No se probó a mano en el navegador**: no hay Playwright instalado en el proyecto (F.3 sigue pendiente) y no se instaló para esto.

**Decisiones tomadas:**

1. **No todo error del parser bloquea el guardado.** Bloquean los que impiden interpretar el texto —corchete sin cerrar, corchetes vacíos, llave que no es una de las ocho secciones—; **no bloquea el acorde fuera de RN-005** (`Cadd9`, `Cdim`, `C9`…). Bloquearlo dejaría fuera media canción real y además contradiría a RN-005, que dice explícitamente que un acorde no reconocido se guarda y se muestra tal y como lo escribió quien aportó la versión — si no se pudiera guardar, todo ese camino del visor sería código muerto. Se avisa aparte, en tono neutro y diciendo que no se va a poder transportar. La separación vive en `src/components/aportar/errores.ts`, con el porqué escrito al lado.
2. **La vista previa no ofrece transportar ni ver en grados.** Aquí se decide en qué tono está escrita la canción (RN-002), no en cuál se quiere leer; el transporte es del visor. El selector de tono, por tanto, cambia el tono **original** del aporte, no una vista.
3. **Un `401` al guardar no cierra la sesión sin más.** Como `POST /canciones` responde `401` con la sesión intacta (B.4), la pantalla vuelve a preguntar `GET /auth/me`: si la sesión sigue viva es el fallo del servidor y se explica; si no, ahí sí se expira la sesión y se va al login. Sin esto, aportar una canción nueva echaría al usuario al login estando perfectamente autenticado.

**Desviaciones y deuda que deja E.3:**

1. **HU-08 no se puede completar hoy** por el `401` de `POST /canciones` (B.4, backend). La pantalla no lo esconde: explica que el fallo es del servidor y no del usuario, y como la canción sí queda creada, vuelve a lanzar la búsqueda de duplicados para que aparezca ahí mismo y se pueda guardar la versión sobre ella sin perder lo escrito. En cuanto B.4 se arregle, no hay que tocar nada de esta pantalla; el mensaje y ese reintento se pueden borrar (`FalloAlCrearCancion` en `Aportar.tsx`).
2. **`<Cifrado>` acepta ahora `lineasConError`** (opcional). El visor no lo pasa y se comporta igual que antes; solo la vista previa marca líneas.
3. **La detección de duplicados es del cliente y es de mínimos:** solo mira coincidencia exacta de título (hasta 5 resultados) sobre `GET /canciones?titulo=…`, que hace `contains`. No detecta erratas ni títulos parecidos. Cuando RN-010 se implemente en `POST /canciones` (B.3), lo suyo es que el aviso venga del servidor y esto se quede solo como ayuda mientras se escribe.
4. **Sin borrador local.** Si se recarga la pestaña a mitad de escribir una canción, se pierde. No lo pide ninguna HU; si aparece, `localStorage` con la clave del destino es un parche de media hora.
5. **El textarea no numera las líneas.** El error dice `línea:columna` y el clic lleva el cursor al punto exacto, que resuelve el caso de uso; un margen numerado sincronizado con el desplazamiento es bastante más código y no lo pide RN-013.

## Bloque F · Cierre de calidad

- [ ] **F.1 · Estados especiales** (Fase 7 §3) — vacío, error de validación y confirmación de acciones destructivas, en todas las pantallas.
- [ ] **F.2 · Accesibilidad mínima** (Fase 7 §4) — navegable con teclado, foco visible, errores no comunicados solo por color, `alt` en imágenes.
- [ ] **F.3 · Pruebas E2E** (Playwright) de los 3 flujos críticos: buscar→ver→transportar, aportar con vista previa, y revisar versión pendiente.
- [ ] **F.4 · Datos de prueba** (Fase 8 §1): caso típico, canción larga, duplicado, ChordPro inválido, archivo inválido.
- [ ] **F.5 · Validar el mapa de navegación con alguien externo** — es el **único pendiente real** del checklist "Go para implementar" de Fase 8 §6.

---

## Decisiones abiertas (resolver antes o durante, no al final)

1. **Eliminación de versión propia (RN-019 / RN-019b).** Hoy es un flujo de **dos pasos** (el autor solicita → un administrador confirma), pero Fase 7 describe un borrado directo del dueño y la documentación lo marca como "no confirmado". Afecta a E.4 y a E.5. **Aplicada la sugerencia** en "Mis aportes" (2026-08-23): se mantuvo el flujo de dos pasos y el botón dice "Solicitar eliminación". Sigue siendo una decisión de producto pendiente de confirmar formalmente, no solo de implementación.
2. **Campo `estado` en `Canción`.** Existe en el schema con default `pendiente` pero ningún endpoint lo asigna ni lo lee. Decidir si Canción tendrá ciclo de aprobación propio o si el campo se elimina.
3. **`revisor_id`.** Fue eliminado deliberadamente del schema: hoy no se registra qué administrador aprobó o rechazó. Decidir si se reintroduce para auditoría.
4. **Refresh token.** El código existe comentado y `DELETE /usuarios` ya borra la cookie. Activarlo o retirar el código muerto y la variable `JWT_REFRESH_SECRET` (queda comentada en `.env.example` a la espera de esta decisión).
5. **Arquitectura en capas.** Fase 8 §2 propone `domain/` + `application/` + `infrastructure/`. Este plan crea solo `domain/` (que es donde la separación se paga sola) y deja la lógica de aplicación en los Route Handlers. Confirmar que se acepta.
6. **JWT en cookie vs. header `Authorization`.** La implementación se desvió del diseño de Fase 6. Confirmar que fue intencional y actualizar la documentación.

## Fuera de este plan (Go a producción)

- [ ] Desplegar en Vercel + Neon (hoy todo es local). **Antes hay que arreglar B.4**, el `fetch` a localhost.
- [ ] Probar el procedimiento de restore al menos una vez con datos reales.
- [ ] Export manual semanal corriendo y verificado.
- [ ] Escáner de secretos (gitleaks) antes de cada release.
