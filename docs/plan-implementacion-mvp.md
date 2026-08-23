# Plan de implementación · MVP PentCord

*Basado en `Documentación PentCord.md` y en el estado real del código a 2026-08-23.*
*Solo listado de tareas pendientes. Las referencias `HU-xx` / `RN-xxx` / `Fase N` apuntan a la documentación.*

---

## Resumen de lo que falta

| Bloque | Estado | Peso |
| --- | --- | --- |
| Cimientos (arranque de la app + testing) | ✅ hecho (0.1–0.5) | chico |
| Dominio musical (ChordPro, transporte, grados, render) | ⏳ nada — **prioridad #1** | grande |
| Backend: cerrar gaps de reglas de negocio | 🚧 parcial — B.2 y la visibilidad de RN-015 en `GET /versiones/{id}` ya están | mediano |
| Frontend completo | 🚧 C, D, E.1, E.2 y E.4 hechos (salvo el motor del visor); faltan E.3 y E.5 (ambas bloqueadas por el Bloque A) y F | grande |
| Pruebas y accesibilidad | ⏳ nada | mediano |

**~~Bloqueante inmediato~~ — resuelto el 2026-08-22 (Bloque 0).** La app ya arranca. El siguiente cuello de botella real sigue siendo el **Bloque A** (dominio musical): sin él no se puede transportar de verdad, ni dar vista previa en Aportar (E.3), ni "renderizar" una versión pendiente en el panel de administración (E.5). Todo lo demás que dependía solo de datos de sesión y de la API ya está construido (2026-08-23).

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

> Módulo TypeScript **puro**: sin Next.js, sin Prisma, sin React. Se importa en cliente (vista previa y transporte sin red) y en servidor (revalidación al guardar). Hoy no existe ni una línea, pese a ser la prioridad declarada en Fase 0 y la mitigación del riesgo #1 de Fase 1.

- [ ] **A.1 · Notas y tonalidades** — clases de pitch (0–11), enarmónicas, lista de los 12 tonos del selector, y **ortografía dependiente de la tonalidad** (en Eb el semitono 1 es `Db`, en D es `C#`). Sin esto el transporte devuelve nombres incorrectos.
- [ ] **A.2 · Parser/formateador de acordes** — RN-005: mayor, menor, `7`, `maj7`, `m7`, `sus2`, `sus4`, más acordes con bajo (`C/E`). Todo lo demás devuelve "no reconocido".
- [ ] **A.3 · Parser de ChordPro** — RN-009. Documento con tokens de acorde y letra, y acumulación de errores con **línea y columna exactas** (corchete sin cerrar, corchete vacío, acorde no reconocido). Es lo que habilita RN-013.
- [ ] **A.4 · Transportador** — HU-05 / RN-003. Distancia en semitonos entre tono origen y destino, reescritura de cada acorde con la ortografía del destino, sin mutar el documento original. Transportar al mismo tono es identidad, no error.
- [ ] **A.5 · Conversor acorde ↔ grado (Nashville)** — HU-06 / RN-004. Siempre relativo al **tono activo en pantalla**, no a un tono fijo. Ida y vuelta sin pérdida. Definir y documentar la notación (`6m`, `57`, `4sus4`, `b7`, `1/3`).
- [ ] **A.6 · Renderizador** — RN-009b. Convierte el documento en líneas de acordes encima de la letra, devolviendo **segmentos posicionados** (no una cadena ya formateada) para que la UI pueda marcar los acordes no reconocidos. Manejar directivas `{coro}`, líneas vacías y solapamiento de acordes largos.
- [ ] **A.7 · Suite de precisión** — 12 tonos × 7 calidades × 12 grados, exhaustiva, contra tabla de teoría musical. Es el criterio No-Go de Fase 0 §8: si falla, no se avanza.
- [ ] **A.8 · Verificación del NFR de rendimiento** — medir con `performance.now()` sobre una canción de ~40 líneas, 20 corridas, promedio y p95 < 100 ms.

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
- [ ] **`POST /api/v1/auth/logout`** — no existe ninguna ruta que pueda borrar la cookie httpOnly desde el cliente, y E.4 ("cerrar sesión") la necesita. Se había agregado el 2026-08-23 pero se revirtió a pedido: el backend ya no lo toca este frontend. Mientras tanto, "Cerrar sesión" en Perfil solo limpia el estado local (`SesionProvider.cerrarSesion`); la cookie sigue siendo válida hasta que expire (15 min). Detalle en `docs/pendientes-backend-y-frontend.md`.

### B.3 · Reglas de negocio no enforced

- [x] **RN-015 en `GET /versiones/{id}`** — corregido el 2026-08-23: verificada para cualquiera, o propia, o cualquier estado si quien pregunta es administrador (lo necesita para revisar); todo lo demás, el mismo `404` que "no existe". De paso se amplió el payload (`id`, `estado`, `autorId`, `tonoOriginal`, `contenidoChordpro`, `cancion.{id,titulo,artista}` — cierra B.5 para este endpoint) y se corrigió el bug de B.4 (devolvía `400` en vez de `404`).
- [ ] **RN-015 en `GET /canciones/{id}`** — sigue sin filtrar: la lista de `versiones` que trae incluida no se filtra por estado ni autor, así que cualquiera con el id de la canción lee el ChordPro de una versión Pendiente o Rechazada ajena llamando a la API directamente (D.2 lo compensa ocultándolas en la interfaz, pero eso no es el arreglo). Filtrar igual que ya hace `GET /versiones/{id}`.
- [ ] **RN-009 / RN-013:** revalidar el ChordPro **en el servidor** con el mismo módulo del cliente y responder `400 VALIDATION_ERROR` con `linea`/`columna`. Hoy solo se comprueba que el campo no esté vacío: se acepta cualquier texto.
- [ ] **RN-002:** validar que `tono_original` sea una nota válida al crear la versión.
- [ ] **RN-014:** la versión aportada por un **administrador** nace `verificada`. Hoy toda versión nace `pendiente` sin importar el rol.
- [ ] **RN-017:** `PATCH /versiones/{id}/revision` debe responder `409 CONFLICT` si la versión ya no está `pendiente`. Hoy un segundo administrador puede revertir la decisión del primero sin error.
- [ ] Guardas de estado en el flujo de eliminación de versión: `409` si ya se solicitó la eliminación, y `409` en el `DELETE` si la versión no está en `pendienteEliminacion`.
- [ ] **Favoritos:** `POST /favoritos` no valida que la versión esté `verificada` — hoy se puede marcar como favorita una Pendiente o Rechazada. Mantener intacta la idempotencia de RN-006.
- [ ] **RN-019:** el listado de favoritos debe excluir las versiones que dejaron de ser visibles (eliminadas), sin avisar al usuario.
- [ ] **RN-010:** `POST /canciones` no emite ninguna advertencia de posible duplicado título+artista. Añadirla como advertencia no bloqueante.

### B.4 · Bugs y deuda que bloquean el despliegue

- [ ] **`POST /api/v1/canciones` hace un `fetch` a `http://localhost:3000` hardcodeado** para crear la primera versión, sin transacción. No funciona fuera de localhost (es decir, no funciona en Vercel) y si la versión falla la canción queda huérfana. Reemplazar por una transacción de Prisma.
- [ ] Quitar los `console.error` que devuelven `detail`, `code` y `meta` de Prisma al cliente en `canciones/[id]/versiones`.
- [x] `GET /versiones/{id}` devuelve `400` en vez de `404` cuando no encuentra la versión — corregido el 2026-08-23 junto con RN-015 (ver B.3).
- [x] **Regresión del 2026-08-23 (commit `b5b20d2`):** `GET /canciones/{id}` empezó a filtrar también por `estado: "verificada"` de la propia `Cancion`. Como nada pone jamás ese campo en `verificada`, la ruta devolvía **404 siempre**, rompiendo D.2 por completo. Se quitó el filtro el mismo día. La decisión abierta #2 (¿tiene Canción su propio ciclo de aprobación?) sigue sin resolver — hasta que se resuelva, no se debe volver a filtrar por este campo.
- [ ] Limpiar la extracción manual del id desde `url.pathname` en `versiones/[id]/revision` y el fallback duplicado en `canciones/[id]/versiones`: en Next 16 `params` ya lo entrega.
- [ ] `DELETE /usuarios` borra una cookie `refreshtoken` que nunca llega a crearse (el refresh token está comentado). Decidir: activarlo o quitar el código muerto.

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

No estaba en el alcance pedido ("mira las APIs nuevas y completa el frontend"), y a partir de ahora el backend lo lleva otra persona — pero dos huecos bloqueaban directamente lo que sí se pedía, así que se resolvieron aquí en vez de dejarlos anotados para después. Un tercer cambio (un endpoint de logout) se hizo y **se revirtió a pedido**; queda documentado como pendiente de backend en `docs/pendientes-backend-y-frontend.md`.

| Cambio | Por qué era necesario ahora | Archivo |
| --- | --- | --- |
| Quitar `estado: "verificada"` del filtro de `Cancion` en `GET /canciones/{id}` | Regresión de `b5b20d2`: sin esto, la ruta devolvía 404 siempre y ni D.2 ni la nueva vista "Mis aportes" (E.4) podían resolver título/artista de una canción. | `src/app/api/v1/canciones/[id]/route.ts` |
| RN-015 + payload completo en `GET /versiones/{id}` + `404` real | Sin esto, un autor no podía ver su propia versión pendiente y no había ninguna forma de que un administrador leyera el contenido de una versión para revisarla — bloqueaba E.4 y cualquier futuro E.5. | `src/app/api/v1/versiones/[id]/route.ts` |

Ninguno de los dos toca reglas de negocio nuevas: son huecos que ya estaban anotados en B.3/B.4/B.5, o una regresión que rompía algo ya construido. Lo que sigue en B.0/B.3/B.5 (catálogo de errores, RN-015 en `GET /canciones/{id}`, paginación, datos de canción en `/myContributions` y `/versiones/pendientes`, y el endpoint de logout) sigue pendiente igual — ver `docs/pendientes-backend-y-frontend.md` para el detalle completo dirigido a quien siga con el backend.

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
- [ ] **D.3 · Visor de versión** (HU-04, HU-05, HU-06) — **la pantalla central del producto**. *La pantalla está construida; lo que falta es el motor. Sigue sin marcar porque hoy funciona sobre datos de ejemplo, no sobre la versión real.*
  - [x] Render de la letra con la línea de acordes encima; nunca mostrar el ChordPro crudo (RN-009b). *(la pantalla; el ChordPro real lo traen A.3/A.6)*
  - [ ] Selector de tono → transporte **en el cliente**, sin llamada de red, < 100 ms. *(el selector existe y es instantáneo; el transporte correcto es A.1/A.4)*
  - [ ] Conmutador notas ↔ grados, relativo al tono activo en pantalla. *(el control existe; la conversión real es A.5)*
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
| D.3 | Pantalla completa: selector de tono con forma de octava de piano (las flechas se mueven de semitono en semitono, `Inicio` vuelve al original, tabulación itinerante), conmutador notas/grados, aviso de acordes no reconocidos y render del cifrado. **Funciona sobre datos de ejemplo**, no sobre la versión real. | `src/app/versiones/[id]/page.tsx`, `src/components/visor/*`, `src/lib/demo/cifradoDeMaqueta.ts` |

**Verificado:** `npm run build` ✅ (20 rutas: 14 de API + 6 de página), `npm run test:run` ✅ (43 pruebas, 6 archivos), `npm run lint` ✅ (0 errores; siguen los 12 avisos preexistentes de variables sin usar en los route handlers). Contraste comprobado número a número: **todos** los pares de texto y fondo pasan 4.5:1 en claro y en oscuro.

**Desviaciones y deuda que dejan estos bloques:**

1. **D.3 es una maqueta.** Se decidió no adelantar el Bloque A. `src/lib/demo/cifradoDeMaqueta.ts` es un sustituto tosco y **hay que borrarlo**: trocea los acordes a mano en vez de parsear ChordPro, y transporta con una única tabla cromática de sostenidos, así que escribe `C#` donde en Eb corresponde `Db` — justo el error que A.1 existe para evitar. El contrato al que se conectará A.6 ya está declarado en `src/domain/musica/tipos.ts` (**solo tipos, sin lógica**), así que cuando aterrice el Bloque A solo cambia de dónde saca los datos el visor. *(sigue así al 2026-08-23: agregarle el botón de favorito no tocó el motor.)*
2. ~~`GET /auth/me` (B.2) es ahora el bloqueo real de C.3.~~ **Resuelto el 2026-08-23** — B.2 existe. Quedó un bug de contrato en el propio endpoint (no envuelve en `{ data }`, y sus errores anidan mal el objeto de `getUserFromToken` en vez de su `.message`); `SesionProvider` ya está escrito contra la forma real, no la del catálogo. Ver "Cambios de backend hechos junto con el frontend" arriba y B.2.
3. **El filtro de visibilidad de D.2 no arregla RN-015 del todo.** `GET /versiones/{id}` ya filtra correctamente (arreglado el 2026-08-23), pero `GET /canciones/{id}` sigue devolviendo todas las versiones sin filtrar en el arreglo `versiones` que trae incluido. La pantalla las sigue ocultando en la interfaz; el arreglo real sigue pendiente en B.3.
4. **B.0 sigue pendiente y el cliente lo compensa.** `pedirApi` deduce el código a partir del status para las dos formas heredadas de error (`{ message }` en `auth/*`, `{ error: "texto" }` en el resto). Ese código de compatibilidad se puede borrar en cuanto los 12 route handlers usen `errorResponse()`.
5. **Pantallas de relleno, para que la barra fija tenga a dónde llevar.** `/aportar` sigue así: dice con todas las letras que depende del Bloque A. `/favoritos` y `/perfil` ya no son de relleno (E.2 y E.4, 2026-08-23). `/login` ya conserva el parámetro `volverA` (la parte que sí es del Bloque C); el formulario es E.1.
6. **Aviso del build:** `next/font` no encuentra métricas de sustitución para Big Shoulders y no genera una fuente de respaldo ajustada. Hay pila de respaldo declarada (`Arial Narrow`, `system-ui`), pero puede haber un pequeño salto de maquetación en los rótulos mientras carga la fuente.
7. **Los 3 clics se cumplen:** buscar → tocar la canción (1) → tocar la versión (2) → tocar el tono (3).

## Bloque E · Cuenta y contribución

- [x] **E.1 · Login / Registro** (HU-01) — mensaje de error **genérico** en credenciales inválidas (sin decir qué campo falló); mensaje específico si el correo ya existe. Retorno al contexto exacto donde estaba el usuario tras autenticarse.
- [x] **E.2 · Botón de favorito + página Favoritos** (HU-07) — marcar/desmarcar al instante, sin confirmación (no es destructivo). Sin sesión: redirigir a login sin perder la versión que se estaba viendo. Estado vacío que invite a explorar.
- [ ] **E.3 · Aportar canción / versión** (HU-08, HU-09, HU-10) — **bloqueada por el Bloque A.** La vista previa en tiempo real (RN-011) y el señalar errores de sintaxis en el punto exacto (RN-013) necesitan el parser de ChordPro real; `src/lib/demo/cifradoDeMaqueta.ts` no sirve porque no es un parser genérico, es una canción de ejemplo troceada a mano (ver nota 1 de Bloques C/D). Construirla ahora sin eso sería otra maqueta más, y ya hay una (D.3); se prefirió no duplicar deuda.
  - [ ] Formulario: título, artista, tono original, textarea de ChordPro.
  - [ ] **Vista previa renderizada en tiempo real** (RN-011), al lado del textarea en pantalla ancha y debajo en móvil (RN-012).
  - [ ] Errores de sintaxis señalados **en el punto exacto**, sin romper ni congelar la vista previa (RN-013), y botón Guardar deshabilitado hasta corregirlos.
  - [ ] Advertencia no bloqueante de posible duplicado título+artista (RN-010).
  - [ ] Confirmación de que el aporte quedó "Pendiente de revisión".
- [x] **E.4 · Perfil** (HU-12, HU-13, HU-14) —
  - [x] Subir/cambiar foto de perfil, con rechazo claro de archivo no-imagen o > 10 MB sin tocar la foto anterior.
  - [x] "Mis aportes" con la etiqueta de estado (Pendiente / Verificada / Rechazada) y su estado vacío.
  - [x] Eliminar versión propia, con modal de confirmación explícito.
  - [x] Eliminar cuenta, con modal que explique qué se conserva (versiones verificadas) y qué se pierde.
  - [x] Cerrar sesión.
- [ ] **E.5 · Panel de administración** (HU-11) — solo visible dentro de Perfil y solo con rol `administrador`. Lista de pendientes con canción y autor, detalle con la versión **renderizada** (no ChordPro crudo), acciones Aprobar / Rechazar, confirmación explícita al rechazar, y manejo del `409` si otro administrador ya la revisó. **Ya no está bloqueada por falta de acceso a los datos** (RN-015 y el payload de `GET /versiones/{id}` se arreglaron el 2026-08-23, ver Bloque B): sigue bloqueada por el Bloque A, porque HU-11 pide la versión "renderizada" y RN-009b prohíbe mostrar el ChordPro crudo — no hay un tercer camino honesto sin el renderizador real.

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
| E.4 · cuenta | "Cerrar sesión" limpia el estado local y vuelve al inicio (`SesionProvider.cerrarSesion`) — no hay `POST /auth/logout` que borre la cookie httpOnly desde el servidor (se había agregado y se revirtió a pedido, ver arriba), así que la cookie sigue viva hasta que expire (15 min). "Eliminar cuenta" pide confirmación explicando qué se conserva (las versiones verificadas siguen visibles para los demás) y qué no (el resto de la cuenta, incluidos los favoritos, deja de ser accesible), luego llama a `DELETE /usuarios` (ya existía, y ese sí borra las cookies del lado del servidor) y limpia la sesión. | `src/components/perfil/Perfil.tsx`, `src/lib/sesion/SesionProvider.tsx` |
| C.3 (retocado) | `SesionProvider` ya no espera `{ data: usuario }`: `GET /auth/me` devuelve el usuario plano. Se agregó `cerrarSesion()` al contexto. | `src/lib/sesion/SesionProvider.tsx` |

**Verificado:** `npm run build` ✅ (20 rutas: 14 de API + 6 de página), `npm run test:run` ✅ (52 pruebas, 8 archivos — suma `src/tests/components/favoritos/BotonDeFavorito.test.tsx` y ajusta `PantallaDeLogin.test.tsx` al nuevo flujo de `refrescar()`), `npm run lint` ✅ (0 errores; siguen los avisos preexistentes de variables sin usar en los route handlers). Probado a mano con `curl` de punta a punta: registro → `GET /auth/me` → marcar favorito → listar favoritos.

**Desviaciones y deuda que dejan E.2/E.4:**

1. **El botón de favorito no está en `DetalleDeCancion`**, solo en el Visor. Se decidió así para no multiplicar la llamada a `GET /favoritos` por cada fila de la lista de versiones; si se pide más adelante, conviene subir el estado de favoritos a un contexto compartido en vez de repetir el patrón del botón.
2. **"Mis aportes" hace N+1 contra `/canciones/{id}`** por la falta de datos de canción en `/myContributions` (B.5). Aceptable al tamaño actual del catálogo; hay que quitarlo en cuanto B.5 se cierre.
3. **El panel de admin no muestra el nombre de quien aportó**, solo podrá mostrar `autorId` cuando se construya E.5: no existe ningún endpoint que resuelva un id de usuario a `username`.
4. **`GET /auth/me` sigue sin usar el catálogo de errores** (responde `{ message: <objeto>, }` con un bug propio: anida el objeto de error en vez de su texto). No bloqueó nada porque `SesionProvider` trata cualquier fallo de `/auth/me` como "sin sesión" sin mirar el cuerpo del error; queda anotado en B.0/B.2 para cuando se unifiquen los doce route handlers.

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
