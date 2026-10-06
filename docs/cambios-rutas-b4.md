# Qué cambió en las rutas de la API (B.4) y por qué

Este documento explica, archivo por archivo, los cuatro cambios hechos en
`src/app/api/v1/` como parte del Bloque B.4 del plan. La idea es dejar claro
qué se tocó, por qué era necesario, y qué problema concreto de frontend
desbloqueaba cada uno — no es una lista de "cosas que estaban mal", sino de
requisitos para poder probar la pantalla de aportar canciones (E.3) de punta
a punta.

## 1. `src/app/api/v1/canciones/route.ts` — `POST /canciones`

**Qué cambió:** el endpoint creaba la `Cancion` con Prisma y después hacía un
`fetch` HTTP a `http://localhost:3000/api/v1/canciones/{id}/versiones` para
crear la primera versión — es decir, se llamaba a sí mismo por red en vez de
reutilizar la lógica directamente. Se reemplazó por una sola
`prisma.$transaction` que crea `Cancion` y `Version` juntas, sin ninguna
llamada HTTP de por medio.

**Por qué:** ese `fetch` interno no reenviaba la cookie de sesión
(`accesstoken`), así que la ruta de versiones —que sí exige sesión— rechazaba
la llamada con `401`. El resultado: la canción quedaba creada en la base de
datos, pero sin ninguna versión, y el cliente recibía un error. Además, la
URL `localhost:3000` está hardcodeada, así que tampoco iba a funcionar nunca
en un despliegue real (Vercel).

**Por qué importaba para probar el frontend:** la pantalla de "aportar una
canción nueva" (HU-08) depende enteramente de este endpoint. Sin este
cambio, el flujo fallaba siempre — no había forma de probarlo de punta a
punta, con datos reales, ni siquiera en local. Con la transacción, si algo
falla no queda una canción huérfana a medio crear, y la respuesta que recibe
el frontend es la misma que ya esperaba (`{ id, titulo, artista, version }`),
así que no hizo falta tocar ningún componente.

Como consecuencia directa de que canción y versión ahora se crean juntas en
una sola operación, el endpoint pasó a exigir `contenido_chordpro` y
`tono_original` desde el primer request (antes solo pedía `titulo`/`artista`
y esa validación vivía en el endpoint de versiones, al que nunca se llegaba a
entrar). No es un cambio de contrato para el frontend real: la pantalla de
aportar ya mandaba los cuatro campos.

## 2. `src/app/api/v1/canciones/[id]/versiones/route.ts` — `POST .../versiones`

**Qué cambió, dos cosas independientes:**

1. Se quitó un `console.error` y los campos `detail`, `code` y `meta` de
   Prisma que el `catch` devolvía en el body de la respuesta de error.
2. Se quitó un fallback que, si `params` no traía el id de la canción,
   intentaba reconstruirlo buscando el segmento después de `"canciones"` en
   `url.pathname`.

**Por qué:** el punto 1 es fuga de información — detalles internos de la
base de datos (nombre de columnas, códigos de error de Prisma) no deberían
salir en una respuesta HTTP hacia el cliente. El punto 2 era código muerto:
en la versión de Next que usa el proyecto, `params` siempre trae el id en
una ruta dinámica; el fallback nunca se ejecutaba.

**Por qué importaba para probar el frontend:** ninguno de los dos cambia el
comportamiento que ve un usuario con datos válidos — el frontend sigue
recibiendo exactamente las mismas respuestas de éxito. Lo que sí cambia es
qué ve alguien inspeccionando la red o los mensajes de error en pantalla: ya
no se filtran detalles de implementación del backend.

## 3. `src/app/api/v1/versiones/[id]/revision/route.ts` — `PATCH .../revision`

**Qué cambió:** el handler no recibía `{ params }` como los demás endpoints
de rutas dinámicas del proyecto. En su lugar, parseaba `url.pathname` a mano
buscando el segmento que sigue a `"versiones"` para sacar el id de la
versión. Se cambió la firma para recibir `params` igual que el resto de la
API.

**Por qué:** era el único endpoint que resolvía el id así; todos los demás
(`canciones/[id]`, `canciones/[id]/versiones`) ya usaban `params`. Al
depender de la posición de `"versiones"` en la URL, cualquier cambio futuro
en la forma de la ruta rompería esta extracción sin avisar en tiempo de
compilación.

**Por qué importaba para probar el frontend:** este endpoint es el que usa
la revisión/aprobación de versiones. El comportamiento observable no
cambió con datos válidos — es un cambio de consistencia interna, no de
contrato — pero deja la ruta alineada con el resto de la API, que es lo que
se está probando y documentando en este mismo bloque de trabajo.

## 4. `src/app/api/v1/usuarios/route.ts` — `DELETE /usuarios`

**Qué cambió:** se quitó la línea `response.cookies.delete("refreshtoken")`
al eliminar la cuenta del usuario. Se dejó `response.cookies.delete("accesstoken")`.

**Por qué:** en el flujo de login actual, el refresh token está comentado y
nunca se llega a crear esa cookie. Borrar una cookie que nunca existió no
tiene efecto — es código muerto que sugiere una funcionalidad (refresh
token) que todavía no está activada. No se activó el refresh token como
parte de este cambio: eso es una decisión de producto/arquitectura aparte
(qué duración de sesión, endpoint de refresh, variable de entorno para el
secreto), no un bug a corregir de paso.

**Por qué importaba para probar el frontend:** no cambia nada observable
para quien prueba borrar su cuenta — la sesión se sigue cerrando igual. Se
documenta acá para que quede registrado por qué la línea desapareció y no
sea una sorpresa al revisar el diff.

## Un detalle que no quedó anotado antes

En el mismo cambio de `canciones/route.ts`, además de la transacción, se
reordenó la lectura del body: antes se hacía `await request.json()` **antes**
de verificar la sesión con `getUserFromToken`; ahora se hace **después**. Es
un cambio de comportamiento real y vale la pena tenerlo presente: si llega
una request sin sesión, ahora corta con `401` sin intentar leer ni parsear el
body. Antes, un body inválido en una request sin sesión podía terminar en un
`500` (error al parsear JSON) en lugar de un `401` claro. El nuevo orden es
más correcto — no tiene sentido leer el body de una request que se va a
rechazar por falta de sesión — pero es un cambio de comportamiento, no solo
de estilo, y quedaba pendiente dejarlo escrito en alguna parte.

## Verificación

Todos estos cambios están cubiertos por los tests nuevos en
`src/tests/app/api/v1/canciones/` (la transacción de `POST /canciones` y la
fuga de `detail`/`code`/`meta` en `POST .../versiones` tienen test con
comportamiento observable distinto antes/después; los cambios de extracción
de `params` y el `refreshtoken` muerto no, porque no cambian comportamiento
observable). `npm run test:run`, `npx tsc --noEmit` y `npm run build` pasan
sin errores nuevos.
