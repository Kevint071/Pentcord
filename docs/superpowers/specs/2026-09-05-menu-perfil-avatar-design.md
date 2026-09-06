# Menú de perfil con avatar, Ajustes y Preferencias

*Diseño aprobado el 2026-09-05. Pedido explícito de producto, no una `HU-xx`/`RN-xxx` del enunciado original.*

## Contexto

Hoy, con sesión iniciada, el encabezado (`src/components/nav/Encabezado.tsx`) muestra un
riel con cuatro destinos de texto (Buscar / Favoritos / Aportar / Perfil), definidos en
`src/components/nav/destinos.tsx`. "Perfil" (`/perfil`, `src/components/perfil/Perfil.tsx`)
ya reúne foto, correo, rol, "mis aportes", cerrar sesión y eliminar cuenta en una sola
pantalla larga.

Se pide reemplazar el ítem "Perfil" del riel por un icono/avatar (foto o inicial con
color) que, al pulsarlo, abra un menú con **Favoritos, Perfil, Ajustes y Preferencias**.
Ajustes agrupa cambiar contraseña, eliminar cuenta y cerrar sesión. Preferencias aloja el
cambio de tema claro/oscuro, que a partir de ahora se guarda en la cuenta (no solo en el
navegador).

Esto obliga a tocar el backend (endpoint de contraseña, campo y endpoint de tema), algo
que el proyecto tiene marcado como "no tocar salvo pedido explícito"
([[feedback_no-tocar-backend]]). El usuario confirmó la excepción para esta tarea, igual
que se hizo puntualmente para el Bloque B.4.

## Decisiones ya tomadas (confirmadas con el usuario)

1. **Backend**: se implementa como excepción puntual (endpoint de contraseña + campo y
   endpoint de tema), no solo se documenta como pendiente.
2. **Favoritos** sale del riel de navegación por completo; vive solo dentro del menú del
   avatar.
3. **Rutas**: `Ajustes` vive en `/cuenta` (no `/ajustes`); `Preferencias` en `/preferencias`.
4. **Color del avatar**: determinista por usuario (hash de `username`/`id` sobre una
   paleta fija), no aleatorio en cada carga.
5. **Icono de tema del encabezado**: se queda donde está (visible siempre, con o sin
   sesión) y hace lo mismo que el control de Preferencias — no se elimina, se duplica el
   control sobre el mismo estado.

## Backend

### Migración de esquema

Añadir a `model User` en `prisma/schema.prisma`:

```prisma
tema String? @db.VarChar(10) @map("tema")
```

Valores: `"light"`, `"dark"` o `null` (sin preferencia de cuenta → sigue el sistema/local).
Migración nueva bajo `prisma/migrations/`.

### `PATCH /api/v1/usuarios/me/tema`

- Requiere sesión (`getUserFromToken`).
- Body: `{ tema: "light" | "dark" }`. Cualquier otro valor → `VALIDATION_ERROR`
  (`campo: "tema"`).
- `prisma.user.update({ where: { id: userId }, data: { tema } })`.
- Responde `{ tema }` con 200.
- Usa `errorResponse` / `ApiError` / `toErrorResponse` de `src/lib/errors.ts` (código
  nuevo, no el formato legado `{ error: "texto" }`).

### `PATCH /api/v1/usuarios/me/password`

- Requiere sesión.
- Body: `{ passwordActual: string, passwordNueva: string }`.
- Si `userdb.metodoAutenticacion !== "local"` → `VALIDATION_ERROR`
  ("Tu cuenta usa Google, no tiene contraseña que cambiar.").
- Si `passwordNueva.length < 8` → `VALIDATION_ERROR` (`campo: "passwordNueva"`).
- Verifica `bcrypt.compare(passwordActual, userdb.password)`; si no coincide →
  `VALIDATION_ERROR` (`campo: "passwordActual"`, "La contraseña actual no es correcta.").
- Si coincide, `bcrypt.hash(passwordNueva, 10)` y `prisma.user.update(...)`.
- Responde `{ message: "Contraseña actualizada" }` con 200.
- Mismo catálogo de errores que el endpoint anterior.

### `GET /api/v1/auth/me`

Sumar al payload existente: `tema: userdb.tema` y
`metodoAutenticacion: userdb.metodoAutenticacion`. Sin cambios en los campos que ya
devuelve. `UsuarioDeSesion` (en `SesionProvider.tsx`) gana esos dos campos.

## Frontend

### Sincronía de tema (refactor de lo existente)

`src/components/tema/InterruptorDeTema.tsx` hoy define `EVENTO` y `leerTema` como
privados. Se extraen a un módulo compartido nuevo:

`src/lib/tema/tema.ts`
- `EVENTO_DE_TEMA` (string del evento custom).
- `leerTema(): "light" | "dark"` (igual que hoy).
- `aplicarTema(tema: "light" | "dark")`: setea `data-theme`, intenta `localStorage`
  (try/catch como hoy) y despacha `EVENTO_DE_TEMA` — solo si el tema pedido es distinto
  del actual, para no generar renders/despachos de más.

`InterruptorDeTema.tsx` pasa a importar de `src/lib/tema/tema.ts` en vez de definir sus
propios `EVENTO`/`leerTema`. Su `alternar()` gana un paso: si `useSesion().estado ===
"autenticado"`, además de aplicar el cambio local, llama
`usarApi("/usuarios/me/tema", { method: "PATCH", cuerpo: { tema: siguiente } })` sin
esperar la respuesta ni bloquear el botón — un fallo de red no debe impedir cambiar el
tema localmente; se ignora el error (`.catch(() => {})`), no es una operación crítica.

`SesionProvider.tsx`, dentro de `consultar()`, tras `setUsuario(usuario)`: si
`usuario.tema` es `"light"` o `"dark"` y difiere del tema actual (`leerTema()`), llama
`aplicarTema(usuario.tema)`. Así el tema guardado en la cuenta gana al iniciar sesión en
un navegador donde el `localStorage` decía otra cosa (o no decía nada).

`guionDeTema.ts` (el script pre-pintado) no cambia: sigue leyendo solo `localStorage`,
que ya queda sincronizado por `aplicarTema` en cuanto se resuelve la sesión.

### Avatar y color determinista

`src/lib/avatar/colorDeAvatar.ts`
- Paleta fija de 8 colores (hex), tonos tinta-sobre-papel emparentados con
  `--color-acorde` pero de matices distintos, todos con contraste ≥ 4.5:1 contra blanco.
- `colorDeAvatar(id: number): string` — la semilla es el `id` numérico del usuario (no
  el `username`): es estable aunque el usuario cambie de nombre. Hash determinista =
  suma de los dígitos/código de `id` reducida módulo 8 → índice de la paleta. Mismo
  `id`, siempre el mismo color.
- Función pura, sin dependencias de React ni del DOM: testeable con un `it.each`.

`src/components/perfil/Avatar.tsx`
- Props: `{ id: number, username: string, fotoPerfilUrl: string | null, tamano?: "sm" | "md" | "lg" }`.
- Si `fotoPerfilUrl`, `<img>` (igual que hoy en `FotoDePerfil`). Si no, círculo con
  `background-color: colorDeAvatar(id)` y la inicial mayúscula (`username.charAt(0)`) en
  blanco.
- `FotoDePerfil` (dentro de `Perfil.tsx`) se actualiza para usar `<Avatar>` en la rama sin
  foto en vez de su placeholder gris actual — mismo comportamiento de subida, solo cambia
  el relleno visual cuando no hay foto, por consistencia con el nuevo avatar del
  encabezado.

### Navegación

`src/components/nav/iconos.tsx` (nuevo) — se mudan aquí los componentes de icono que hoy
viven inline en `destinos.tsx` (Buscar, Favoritos, Aportar, Perfil) como exports
nombrados, y se suman los de Ajustes (engranaje) y Preferencias (control deslizante /
sol-luna). `destinos.tsx` importa de aquí los que sigue usando.

`destinos.tsx`: `DESTINOS` queda solo con Buscar y Aportar. Favoritos y Perfil se quitan
del arreglo (sus iconos se conservan en `iconos.tsx` para reusarlos en el menú).

`src/components/nav/MenuDePerfil.tsx` (nuevo, client component)
- Recibe el usuario de `useSesion()` (solo se monta cuando `estado === "autenticado"`).
- Botón disparador: `<Avatar tamano="sm">` + chevron pequeño, `aria-haspopup="menu"`,
  `aria-expanded`.
- Panel `role="menu"` (posición absoluta, alineado a la derecha del botón, por debajo):
  - Favoritos → `/favoritos`
  - Perfil → `/perfil`
  - separador
  - Ajustes → `/cuenta`
  - Preferencias → `/preferencias`
  - Cada ítem es `role="menuitem"`, un `<Link>`.
- Cierra: click fuera del panel (listener en `document`, se retira al desmontar/cerrar),
  tecla `Escape` (devuelve el foco al botón disparador), y al navegar (efecto sobre
  `usePathname()`).
- Al abrir, foco inicial en el primer ítem del menú.

`Encabezado.tsx`: en el bloque `estado === "autenticado"`, se agrega `<MenuDePerfil />`
junto a `<InterruptorDeTema />` en el contenedor final (a la derecha). El riel de
`DESTINOS` sigue igual de posición, solo con dos ítems en vez de cuatro.

### `/cuenta` (Ajustes)

`src/app/cuenta/page.tsx` — mismo patrón que `src/app/perfil/page.tsx`:
`<ExigeSesion><Ajustes /></ExigeSesion>`.

`src/components/cuenta/Ajustes.tsx`
- `<p className="directiva">{"{cuenta}"}</p>` + título (mismo texto/directiva que ya
  usaba la sección homónima dentro de `Perfil.tsx`).
- Sección "Cambiar contraseña":
  - Si `usuario.metodoAutenticacion === "google"`: `<Aviso tono="neutro">` explicando que
    la cuenta usa Google y no tiene contraseña propia. Sin formulario.
  - Si es `"local"`: formulario con `CampoDeTexto` (contraseña actual, nueva, confirmar
    — la confirmación se valida en cliente, no viaja al servidor), usando el mismo patrón
    de `erroresDeCampo`/`mensajeDeCampo`/`mensajeDeError` que `PantallaDeLogin.tsx`.
    Envía `usarApi("/usuarios/me/password", { method: "PATCH", cuerpo: {...} })`.
    Éxito → limpia los campos y muestra `<Aviso tono="neutro">Contraseña
    actualizada.</Aviso>` unos segundos.
- Sección "Cuenta" (movida tal cual desde `Perfil.tsx`, mismo marcado): botón "Cerrar
  sesión" (`cerrarSesion()`) y `<EliminarCuenta>` (el mismo componente, se mueve de
  archivo).

`Perfil.tsx` pierde esa sección; conserva foto, correo/rol, "mis aportes" y el aviso de
administrador.

### `/preferencias`

`src/app/preferencias/page.tsx` — `<ExigeSesion><Preferencias /></ExigeSesion>`.

`src/components/preferencias/Preferencias.tsx`
- `<p className="directiva">{"{preferencias}"}</p>` + título.
- Fila con rótulo "Tema" + descripción corta + `<InterruptorDeTema />` (el mismo
  componente del encabezado, mismo estado, mismo efecto de guardado en cuenta) + texto
  del estado actual ("Claro" / "Oscuro").

## Pruebas

Mismo patrón que ya usa el repo (Vitest + Testing Library en frontend, mocks de
`@/lib/prisma` y `@/lib/getUserFromToken` en route handlers, sin BD de prueba real —
B.1 sigue pendiente):

- `colorDeAvatar`: determinismo (misma semilla → mismo color) y cobertura básica de la
  paleta.
- `Avatar`: imagen cuando hay `fotoPerfilUrl`, inicial+color cuando no.
- `MenuDePerfil`: abre al click, cierra con click afuera/Escape/navegación, los cuatro
  ítems apuntan a las rutas correctas.
- `Ajustes`: oculta el formulario de contraseña en cuentas Google; valida longitud
  mínima y confirmación en cliente; muestra el error de `passwordActual` inválida.
- `PATCH /usuarios/me/password`: rechaza cuenta Google, rechaza contraseña actual
  incorrecta, éxito actualiza el hash.
- `PATCH /usuarios/me/tema`: rechaza valor inválido, éxito persiste.
- `SesionProvider`: aplica `usuario.tema` al resolver `/auth/me` si difiere del local.

## Fuera de alcance

- No se toca el endpoint de logout (sigue sin existir; "Cerrar sesión" sigue limpiando
  solo el estado local, como documenta `docs/pendientes-backend-y-frontend.md`).
- No se agrega recuperación de contraseña por correo (fuera de lo pedido).
- No se cambia el resto del catálogo de errores (B.0) más allá de los dos endpoints
  nuevos, que sí nacen usándolo.
