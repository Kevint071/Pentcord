# Plan de implementación · MVP PentCord

*Basado en `Documentación PentCord.md` y en el estado real del código a 2026-08-22.*
*Solo listado de tareas pendientes. Las referencias `HU-xx` / `RN-xxx` / `Fase N` apuntan a la documentación.*

---

## Resumen de lo que falta

| Bloque | Estado | Peso |
| --- | --- | --- |
| Cimientos (arranque de la app + testing) | ⏳ nada | chico |
| Dominio musical (ChordPro, transporte, grados, render) | ⏳ nada — **prioridad #1** | grande |
| Backend: cerrar gaps de reglas de negocio | 🚧 parcial | mediano |
| Frontend completo | ⏳ nada (0 páginas) | grande |
| Pruebas y accesibilidad | ⏳ nada | mediano |

**Bloqueante inmediato:** hoy la app **no arranca**. `src/app/layout.tsx` importa `./globals.css`, que no existe, y `src/app/page.tsx` está vacío (0 bytes, sin export por defecto). Nada se puede verificar hasta arreglar eso.

---

## Bloque 0 · Cimientos

- [ ] **0.1** Crear `src/app/globals.css` con la importación de Tailwind v4 (`@import "tailwindcss"`).
- [ ] **0.2** Rellenar `src/app/page.tsx` (hoy vacío) y corregir la metadata "Create Next App" + `lang="en"` de `layout.tsx`.
- [ ] **0.3** Instalar y configurar Vitest (+ Testing Library, `vite-tsconfig-paths`) y añadir el script `test` a `package.json`.
- [ ] **0.4** Crear `.env.example` sin valores reales — casilla pendiente del gate de Fase 6.
- [ ] **0.5** Crear el catálogo único de errores (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `PAYLOAD_TOO_LARGE`, `INTERNAL_ERROR`) — Fase 5 §7. Hoy cada endpoint devuelve texto libre en `message` o `error`.
- [ ] **0.6** Decidir si `docs/` es el sitio del documento de planeación o se queda en la raíz.

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

### B.1 · Base de datos

- [ ] Índice único **parcial** en `users.email` (cuentas locales) — RN-007. Hoy solo se valida en código: dos registros simultáneos con el mismo correo pasan ambos.
- [ ] Índice único en `users.google_id` (necesario si se hace Google login).
- [ ] Índices de búsqueda pendientes de Fase 4 §2: `canciones(titulo, artista)`, `versiones(cancion_id)`, `versiones(estado)`, `versiones(autor_id)`. Hoy el schema no declara ningún `@@index`.
- [ ] Migración correspondiente + comprobar duplicados preexistentes antes de aplicarla.
- [ ] Base de datos de prueba separada (rama de Neon) para las pruebas de endpoint.

### B.2 · Sesión y permisos

- [ ] Helper central `requireAuth` / `requireAdmin`. Hoy la validación de rol está **copiada literalmente en 3 endpoints**.
- [ ] **`GET /api/v1/auth/me`** — no existe y el frontend lo necesita para saber quién es el usuario y si es administrador (decide si se muestra el panel de admin). Proyección segura: nunca `password` ni `googleId`.
- [ ] Bloquear el login de una cuenta con `eliminadoEn` (RN-018).

### B.3 · Reglas de negocio no enforced

- [ ] **RN-015 (gap de seguridad real):** `GET /canciones/{id}` y `GET /versiones/{id}` devuelven hoy **todas** las versiones no eliminadas sin filtrar por estado ni autor — cualquiera con el id lee una versión Pendiente o Rechazada ajena. Filtrar: verificadas para todos, más las propias. Devolver el mismo `404` para "no existe" y "no puedes verla".
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
- [ ] `GET /versiones/{id}` devuelve `400` en vez de `404` cuando no encuentra la versión.
- [ ] Limpiar la extracción manual del id desde `url.pathname` en `versiones/[id]/revision` y el fallback duplicado en `canciones/[id]/versiones`: en Next 16 `params` ya lo entrega.
- [ ] `DELETE /usuarios` borra una cookie `refreshtoken` que nunca llega a crearse (el refresh token está comentado). Decidir: activarlo o quitar el código muerto.

### B.5 · Payloads y listados

- [ ] `GET /versiones/{id}` devuelve solo `contenidoChordpro` + `tonoOriginal`: falta `id`, `estado`, `autorId` y los datos de la canción. La pantalla del visor no puede pintar título, artista ni el botón de favorito.
- [ ] `GET /versiones/pendientes` devuelve solo `id` y `autorId`: el panel de admin no puede mostrar de qué canción se trata sin N peticiones extra.
- [ ] Paginación ausente en `/versiones/pendientes`, `/myContributions` y `/favoritos` (Fase 5 §8). Unificar el formato `{ data, pagination }` que ya usa `/canciones`.
- [ ] `/myContributions` debe incluir los datos de la canción para la vista "Mis aportes".
- [ ] Definir orden explícito por defecto en los listados que hoy no lo tienen.

### B.6 · Opcional, no bloquea el MVP

- [ ] **Login con Google** (HU-01) — hoy solo existen los campos `metodoAutenticacion: google` y `googleId`, sin endpoint ni lógica OAuth. Fase 1 §5 lo clasifica como *Importante*, no *Imprescindible*: se puede dejar para después de cerrar el resto del MVP.
- [ ] Logging con niveles y formato (Fase 6 §5) — hoy solo hay `console.error` sueltos en algunos `catch`.
- [ ] Fallo explícito al arranque si falta alguna variable de entorno obligatoria.

---

# FRONTEND

> **0% construido.** No existe ninguna página, ni carpeta `components/`. Todo esto es nuevo. Depende del Bloque A (visor y vista previa) y de `GET /auth/me` (B.2).

## Bloque C · Base

- [ ] **C.1 · Sistema visual mínimo** — tokens de color, tipografía monoespaciada para la letra+acordes (la alineación depende de ella), y layout responsivo móvil primero.
- [ ] **C.2 · Barra de navegación fija** — Buscar / Favoritos / Aportar / Perfil. Visible siempre, con o sin sesión (Fase 7 §1). El panel de admin **no** va aquí: solo dentro de Perfil y solo si `rol = administrador`.
- [ ] **C.3 · Contexto de sesión** — proveedor que consulta `GET /auth/me`, expone usuario y rol, y maneja el token expirado (15 min) sin dejar la UI en un estado inconsistente.
- [ ] **C.4 · Cliente de API** — envío de cookies, y traducción del catálogo de errores a comportamiento: `UNAUTHENTICATED` → redirigir a login guardando el contexto; `VALIDATION_ERROR` → mensaje inline.

## Bloque D · Flujo público (el camino crítico de 3 clics)

- [ ] **D.1 · Inicio / buscador** (HU-02) — búsqueda por título y artista, paginada, usando `autoresSugeridos` para el autocompletado. Estado vacío neutro ("sin resultados", no un error).
- [ ] **D.2 · Detalle de canción** (HU-03) — lista de versiones visibles, con etiqueta de estado en las propias del usuario.
- [ ] **D.3 · Visor de versión** (HU-04, HU-05, HU-06) — **la pantalla central del producto**:
  - [ ] Render de la letra con la línea de acordes encima; nunca mostrar el ChordPro crudo (RN-009b).
  - [ ] Selector de tono → transporte **en el cliente**, sin llamada de red, < 100 ms.
  - [ ] Conmutador notas ↔ grados, relativo al tono activo en pantalla.
  - [ ] Marca visual de los acordes no reconocidos, sin romper el resto de la canción.
  - [ ] Verificar el flujo `buscar → ver → transportar` en **máximo 3 clics**, en móvil y escritorio.

## Bloque E · Cuenta y contribución

- [ ] **E.1 · Login / Registro** (HU-01) — mensaje de error **genérico** en credenciales inválidas (sin decir qué campo falló); mensaje específico si el correo ya existe. Retorno al contexto exacto donde estaba el usuario tras autenticarse.
- [ ] **E.2 · Botón de favorito + página Favoritos** (HU-07) — marcar/desmarcar al instante, sin confirmación (no es destructivo). Sin sesión: redirigir a login sin perder la versión que se estaba viendo. Estado vacío que invite a explorar.
- [ ] **E.3 · Aportar canción / versión** (HU-08, HU-09, HU-10) —
  - [ ] Formulario: título, artista, tono original, textarea de ChordPro.
  - [ ] **Vista previa renderizada en tiempo real** (RN-011), al lado del textarea en pantalla ancha y debajo en móvil (RN-012).
  - [ ] Errores de sintaxis señalados **en el punto exacto**, sin romper ni congelar la vista previa (RN-013), y botón Guardar deshabilitado hasta corregirlos.
  - [ ] Advertencia no bloqueante de posible duplicado título+artista (RN-010).
  - [ ] Confirmación de que el aporte quedó "Pendiente de revisión".
- [ ] **E.4 · Perfil** (HU-12, HU-13, HU-14) —
  - [ ] Subir/cambiar foto de perfil, con rechazo claro de archivo no-imagen o > 10 MB sin tocar la foto anterior.
  - [ ] "Mis aportes" con la etiqueta de estado (Pendiente / Verificada / Rechazada) y su estado vacío.
  - [ ] Eliminar versión propia, con modal de confirmación explícito.
  - [ ] Eliminar cuenta, con modal que explique qué se conserva (versiones verificadas y favoritos) y qué se pierde.
  - [ ] Cerrar sesión.
- [ ] **E.5 · Panel de administración** (HU-11) — solo visible dentro de Perfil y solo con rol `administrador`. Lista de pendientes con canción y autor, detalle con la versión **renderizada** (no ChordPro crudo), acciones Aprobar / Rechazar, confirmación explícita al rechazar, y manejo del `409` si otro administrador ya la revisó.

## Bloque F · Cierre de calidad

- [ ] **F.1 · Estados especiales** (Fase 7 §3) — vacío, error de validación y confirmación de acciones destructivas, en todas las pantallas.
- [ ] **F.2 · Accesibilidad mínima** (Fase 7 §4) — navegable con teclado, foco visible, errores no comunicados solo por color, `alt` en imágenes.
- [ ] **F.3 · Pruebas E2E** (Playwright) de los 3 flujos críticos: buscar→ver→transportar, aportar con vista previa, y revisar versión pendiente.
- [ ] **F.4 · Datos de prueba** (Fase 8 §1): caso típico, canción larga, duplicado, ChordPro inválido, archivo inválido.
- [ ] **F.5 · Validar el mapa de navegación con alguien externo** — es el **único pendiente real** del checklist "Go para implementar" de Fase 8 §6.

---

## Decisiones abiertas (resolver antes o durante, no al final)

1. **Eliminación de versión propia (RN-019 / RN-019b).** Hoy es un flujo de **dos pasos** (el autor solicita → un administrador confirma), pero Fase 7 describe un borrado directo del dueño y la documentación lo marca como "no confirmado". Afecta a E.4 y a E.5. Sin decidir esto, la UI de "Mis aportes" no se puede escribir. *Sugerencia: mantener el flujo de dos pasos (ya está construido y funciona) y etiquetar el botón como "Solicitar eliminación".*
2. **Campo `estado` en `Canción`.** Existe en el schema con default `pendiente` pero ningún endpoint lo asigna ni lo lee. Decidir si Canción tendrá ciclo de aprobación propio o si el campo se elimina.
3. **`revisor_id`.** Fue eliminado deliberadamente del schema: hoy no se registra qué administrador aprobó o rechazó. Decidir si se reintroduce para auditoría.
4. **Refresh token.** El código existe comentado y `DELETE /usuarios` ya borra la cookie. Activarlo o retirar el código muerto y la variable `JWT_REFRESH_SECRET`.
5. **Arquitectura en capas.** Fase 8 §2 propone `domain/` + `application/` + `infrastructure/`. Este plan crea solo `domain/` (que es donde la separación se paga sola) y deja la lógica de aplicación en los Route Handlers. Confirmar que se acepta.
6. **JWT en cookie vs. header `Authorization`.** La implementación se desvió del diseño de Fase 6. Confirmar que fue intencional y actualizar la documentación.

## Fuera de este plan (Go a producción)

- [ ] Desplegar en Vercel + Neon (hoy todo es local). **Antes hay que arreglar B.4**, el `fetch` a localhost.
- [ ] Probar el procedimiento de restore al menos una vez con datos reales.
- [ ] Export manual semanal corriendo y verificado.
- [ ] Escáner de secretos (gitleaks) antes de cada release.
