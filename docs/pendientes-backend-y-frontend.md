# Pendientes para seguir — PentCord (2026-08-23)

Documento de traspaso. A partir de hoy el backend lo lleva otra persona: esto
resume (1) qué toqué de backend hoy y por qué, para que lo revise y lo adopte
como suyo, (2) qué le falta al backend para que el frontend pueda seguir
avanzando, y (3) qué le falta al frontend. El detalle completo de cada tarea
sigue en `docs/plan-implementacion-mvp.md` (`Bxx` / `Exx` ahí referenciados).

---

## 1 · Backend que toqué hoy (a revisar y adoptar)

No estaba en el alcance pedido — la instrucción era "completa el frontend con
las APIs nuevas" — pero dos huecos bloqueaban directamente eso, así que los
resolví en el momento. **No se revierten** (revertir el primero rompe algo que
ya estaba en producción para todo el mundo), pero de aquí en adelante este tipo
de cambio lo hace la persona de backend, no yo. Un tercer cambio (un endpoint
de logout) sí se revirtió — ver la sección 2.

| Archivo | Qué cambié | Por qué |
| --- | --- | --- |
| `src/app/api/v1/canciones/[id]/route.ts` | Quité el filtro `estado: "verificada"` sobre `Cancion` que agregó el commit `b5b20d2`. | **Regresión, no mejora.** Nada pone jamás ese campo en `verificada` (nace `pendiente`, no hay `PATCH` que lo cambie), así que la ruta devolvía 404 siempre — la pantalla de detalle de canción (ya construida antes de esta sesión) estaba completamente rota. |
| `src/app/api/v1/versiones/[id]/route.ts` | `GET`: ahora filtra por RN-015 (verificada para cualquiera, propia para su autor, cualquier estado si es administrador), devuelve `404` real (antes daba `400`), y el payload trae `id`, `estado`, `autorId`, `tonoOriginal`, `contenidoChordpro` y `cancion.{id,titulo,artista}` (antes solo `contenidoChordpro` + `tonoOriginal`). | Sin esto, un autor no podía ver su propia versión pendiente ni un administrador leer el contenido de una pendiente para revisarla — bloqueaba "Mis aportes" (E.4) y cualquier futuro panel de admin (E.5). Esto **sí** era trabajo de backend ya anotado en el plan (B.3/B.4/B.5), adelantado sin coordinar. |

**Qué necesito de la persona de backend respecto a esto:** que revise los dos
diffs (son pequeños, cada uno cabe en una pantalla) y decida si los deja como
están, los rehace a su manera, o los mueve a donde le convenga en su flujo de
trabajo. Mientras tanto el frontend ya depende de los dos.

---

## 2 · Backend que sigue faltando (bloquea o degrada al frontend)

### Falta un endpoint de logout

Había agregado `POST /api/v1/auth/logout` (borra `accesstoken`/`refreshtoken`)
porque no existe ninguna forma de cerrar sesión desde el cliente — la cookie
es httpOnly, el navegador no puede borrarla por su cuenta. **Se revirtió a
pedido**: eso lo construye la persona de backend cuando le toque.

Mientras tanto, "Cerrar sesión" en Perfil (`SesionProvider.cerrarSesion`, en
`src/lib/sesion/SesionProvider.tsx`) solo limpia el estado local de React y
redirige al inicio — la cookie sigue siendo válida hasta que expire (15 min).
No es un bug del frontend: es la limitación real de no tener el endpoint.
"Eliminar cuenta" no tiene este problema porque `DELETE /api/v1/usuarios` ya
existía y ya borra las cookies desde el servidor.

**Lo que se necesita:** un `POST /api/v1/auth/logout` (o el nombre que la
persona de backend prefiera) que borre `accesstoken` (y `refreshtoken` si se
llega a activar, decisión abierta #4 del plan). No necesita sesión previa ni
falla si ya no había una. En cuanto exista, `cerrarSesion()` debe volver a
llamarlo antes de limpiar el estado local.

Orden por impacto en lo que el frontend puede hacer hoy, del resto de gaps:

### `POST /api/v1/canciones` responde `401` siempre — HU-08 no se puede completar

Es el punto de B.4 del plan («hace un `fetch` a `http://localhost:3000`
hardcodeado»), pero es más grave de lo que decía ahí: **tampoco funciona en
localhost**. Ese `fetch` interno no reenvía la cookie `accesstoken`, y
`POST /canciones/{id}/versiones` autentica con `getUserFromToken(request)`, así
que la llamada interna siempre da `401`; el endpoint devuelve `401 No
autenticado` al cliente **y la canción se queda creada sin ninguna versión**.

Comprobado el 2026-08-23 con una sesión real (los datos de prueba se borraron
después):

```bash
curl -c ck -X POST …/auth/register -d '{…}'          # 200
curl -b ck …/auth/me                                  # 200, usuario correcto
curl -b ck -X POST …/canciones -d '{"titulo":…}'      # 401 {"error":"No autenticado"}
curl …/canciones?titulo=Prueba%20E3                   # la canción existe, sin versiones
curl -b ck -X POST …/canciones/15/versiones -d '{…}'  # 201 {"data":{…}} ← este sí funciona
```

Con esto, **aportar una canción nueva (HU-08) no llega a completarse**, por
bien que esté el frontend. E.3 está construida entera contra el contrato
correcto y no esconde el fallo: explica que es del servidor, no del usuario, y
como la canción sí queda creada, ofrece guardar la versión sobre ella sin
perder lo escrito. En cuanto esto se arregle no hay que tocar la pantalla —
solo se puede borrar el mensaje de cortesía (`FalloAlCrearCancion` en
`src/components/aportar/Aportar.tsx`).

**Lo que se necesita:** que `POST /canciones` cree canción y primera versión en
una **transacción de Prisma**, sin llamarse a sí mismo por HTTP. Resuelve de
una vez la sesión, la atomicidad (hoy la canción queda huérfana si falla la
versión) y el despliegue (el `localhost:3000` hardcodeado no funciona en
Vercel).

### ~~Bloquea el Bloque A (dominio musical)~~ — resuelto el 2026-08-23

El módulo puro `src/domain/musica/` (notas, parser de acordes, parser de
ChordPro, transportador, conversor a grados, renderizador) ya existe, con la
suite de precisión de 1008 acordes en verde. No es "backend" en el sentido de
rutas HTTP y no necesita nada de la persona de backend. Lo que desbloqueó:

- **E.3 (Aportar)** — **construida el 2026-08-23.** Es el primer consumidor
  real del renderizador: vista previa en tiempo real (RN-011) y errores de
  sintaxis en el punto exacto (RN-013), con el mismo `<Cifrado>` del visor.
- **E.5 (panel de administración)** — ya no está bloqueada por nada: el
  renderizado que pide HU-11 se hace igual que en E.3. Sigue faltando resolver
  `autorId` → `username` si se quiere mostrar el nombre de quien aportó.
- **D.3 (el Visor)** — **sigue sobre datos de ejemplo**, y ya sin motivo:
  `src/lib/demo/cifradoDeMaqueta.ts` hay que borrarlo y leer la versión real
  de `GET /versiones/{id}`. El contrato es el mismo
  (`src/domain/musica/tipos.ts`); es cambiar de dónde salen los datos.

### Gaps de reglas de negocio (B.3 del plan, sin tocar)

- ~~**RN-015 en `GET /canciones/{id}`**~~ **Resuelto el 2026-08-23.** Se agregó
  `GET /canciones/{id}/versiones` con la misma regla que ya tenía
  `GET /versiones/{id}` (verificada para cualquiera, o propia, o cualquier
  estado si es admin), y se quitó el `versiones` sin filtrar del `include` de
  `GET /canciones/{id}` (ese endpoint solo trae `_count` ahora).
  `DetalleDeCancion` (D.2) se actualizó para pedir la lista al endpoint nuevo
  en vez de filtrarla en el cliente. Ver la tabla de "Cambios de backend
  hechos junto con el frontend" en el plan.
- **RN-017**: `PATCH /versiones/{id}/revision` no responde `409` si la versión
  ya no está `pendiente` — un segundo administrador puede revertir la
  decisión del primero sin error. Nunca lo vamos a ver en la interfaz mientras
  esto no exista (no hay 409 que manejar).
- **Favoritos**: `POST /favoritos` no valida que la versión esté `verificada`
  — se puede marcar como favorita una Pendiente o Rechazada ajena.
- **RN-014**: la versión aportada por un administrador debería nacer
  `verificada`, no `pendiente`.
- **RN-002**: no se valida que `tono_original` sea una nota válida al crear
  la versión (esto probablemente se resuelve solo con A.1, no hace falta
  duplicarlo en el endpoint).
- **RN-010**: sin advertencia de posible duplicado título+artista en
  `POST /canciones`. Mientras tanto la pantalla de aportar (E.3) avisa por su
  cuenta desde el cliente, buscando el título exacto en
  `GET /canciones?titulo=…` mientras se escribe. Es de mínimos (no detecta
  erratas ni títulos parecidos); cuando el aviso venga del servidor, el del
  cliente se queda solo como ayuda inmediata.

### Payloads y listados incompletos (B.5 del plan, sin tocar)

- **`GET /versiones/pendientes`** solo devuelve `{ id, autorId }`. Ni
  `cancionId` ni el nombre de la canción. Cuando se construya E.5 esto se
  puede compensar pidiendo `GET /versiones/{id}` por cada pendiente (ya trae
  `cancion.{titulo,artista}`, N+1 aceptable al tamaño de MVP), **pero sigue
  faltando resolver `autorId` → `username`**: no existe ningún endpoint para
  eso. Sin él, el panel de admin no puede decir quién aportó cada versión.
- **`GET /myContributions`** no trae los datos de la canción. El frontend ya
  lo compensa hoy (junta los `cancionId` únicos de la respuesta y pide
  `GET /canciones/{id}` una vez por cada uno) — quitar ese parche en cuanto
  esto se resuelva. Ver `src/components/perfil/Perfil.tsx`, función
  `MisAportes`.
- Sin paginación en `/versiones/pendientes`, `/myContributions` ni
  `/favoritos`. No es bloqueante todavía (catálogos chicos), pero al crecer
  sí.

### Catálogo de errores (B.0, sin tocar)

Los 13 route handlers siguen sin migrar a `errorResponse()` / `toErrorResponse()` de
`src/lib/errors.ts`. Conviven tres formas de error en la API: `{ message }`
en `auth/*`, `{ error: "texto" }` en el resto, y el catálogo real en ningún
lado todavía. El cliente (`src/lib/api/cliente.ts`, función
`interpretarError`) ya deduce el código a partir del status HTTP como
compatibilidad — se puede borrar esa deducción en cuanto B.0 se cierre.

Además, `GET /auth/me` tiene un bug propio de contrato: cuando no hay sesión
responde `{ message: { message: "No autenticado", status: 401 } }` — anida el
objeto de error completo de `getUserFromToken` en vez de su `.message`. No
bloquea nada (`SesionProvider` trata cualquier fallo de `/auth/me` como "sin
sesión" sin mirar el cuerpo), pero vale la pena arreglarlo cuando se toque ese
endpoint.

---

## 3 · Frontend que falta

- **D.3 · Enchufar el visor** — la pantalla está construida pero lee
  `src/lib/demo/cifradoDeMaqueta.ts` en vez de la versión real. Es lo más
  barato que queda por hacer y lo más visible: hoy cualquiera que abra una
  versión ve una canción de ejemplo.
- **E.5 · Panel de administración** (HU-11) — ya no está bloqueado por nada
  (ver arriba). El acceso a los datos está listo (`GET /versiones/pendientes` +
  `GET /versiones/{id}` por cada una) y el renderizado se hace igual que en
  E.3. Lo único que no se va a poder mostrar es el nombre de quien aportó,
  mientras no exista un endpoint que resuelva `autorId` → `username`.
- **Bloque F · Cierre de calidad** — nada empezado:
  - F.1 estados especiales (vacío / error / confirmación) en todas las
    pantallas — ya cubierto en C–E, falta auditarlo pantalla por pantalla.
  - F.2 accesibilidad mínima — igual, ya se sigue el patrón en lo construido
    (foco visible, error nunca solo por color), falta auditoría formal.
  - F.3 pruebas E2E (Playwright) de los 3 flujos críticos.
  - F.4 datos de prueba (Fase 8 §1).
  - F.5 validar el mapa de navegación con alguien externo.
- **Deuda menor ya anotada en el plan:**
  - El botón de favorito solo vive en el Visor, no en cada fila de
    `DetalleDeCancion` (para no disparar N peticiones a `/favoritos`). Si se
    pide ahí también, conviene subir el estado de favoritos a un contexto
    compartido en vez de repetir el patrón del botón.
  - "Mis aportes" hace N+1 contra `/canciones/{id}` (ver arriba, B.5).

---

## 4 · Cómo verificar que sigue todo en verde

```bash
npm run build     # 21 rutas: 13 de API + 8 de página
npm run lint      # 0 errores; quedan avisos preexistentes de variables sin usar en route handlers
npm run test:run  # 192 pruebas, 17 archivos
npx tsc --noEmit  # sin errores de tipos
```

El detalle de qué se construyó cada día, con las tablas "Cómo quedó" y las
desviaciones documentadas, está en `docs/plan-implementacion-mvp.md`.
