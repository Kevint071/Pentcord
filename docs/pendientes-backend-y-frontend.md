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

### Bloquea el Bloque A (dominio musical) — el cuello de botella real

Nada de esto es "backend" en el sentido de rutas HTTP: es el módulo puro
`src/domain/musica/` (notas, parser de acordes, parser de ChordPro,
transportador, conversor a grados, renderizador). Hoy no existe ni una línea.
Mientras no exista:

- **E.3 (Aportar)** no se puede construir de verdad: RN-011 (vista previa en
  tiempo real) y RN-013 (errores de sintaxis en el punto exacto) necesitan el
  parser real. No hay atajo honesto — ya existe una maqueta de un solo uso
  (`src/lib/demo/cifradoDeMaqueta.ts`, una canción fija troceada a mano, no un
  parser genérico) y construir otra maqueta para Aportar sería duplicar deuda.
- **E.5 (panel de administración)** tampoco: HU-11 pide la versión
  "renderizada" y RN-009b prohíbe mostrar el ChordPro crudo. El acceso a los
  datos ya no es el problema (ver arriba, `GET /versiones/{id}` ya deja leer
  una pendiente completa siendo admin) — falta el renderizador.
- **D.3 (el Visor)** sigue sobre datos de ejemplo por el mismo motivo. Ya tiene
  el contrato declarado en `src/domain/musica/tipos.ts` (solo tipos, sin
  lógica) para conectarse el día que el Bloque A aterrice.

### Gaps de reglas de negocio (B.3 del plan, sin tocar)

- **RN-015 en `GET /canciones/{id}`**: el arreglo de hoy fue solo en
  `GET /versiones/{id}`. `GET /canciones/{id}` sigue devolviendo *todas* las
  versiones no eliminadas en el arreglo `versiones` que trae incluido, sin
  filtrar por estado ni autor — cualquiera con el id de la canción lee el
  ChordPro de una Pendiente o Rechazada ajena llamando a la API directamente.
  El frontend (`DetalleDeCancion`) las oculta en la interfaz, pero eso no es
  el arreglo real.
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
  `POST /canciones`.

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

Los 12 route handlers (menos `auth/logout`, que sí usa una forma simple y
consistente) siguen sin migrar a `errorResponse()` / `toErrorResponse()` de
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

- **E.3 · Aportar canción/versión** (HU-08, HU-09, HU-10) — bloqueado por el
  Bloque A (ver arriba). La pantalla sigue siendo un `PantallaPendiente` que
  explica por qué (`src/app/aportar/page.tsx`).
- **E.5 · Panel de administración** (HU-11) — bloqueado por el Bloque A (ver
  arriba). El acceso a los datos ya está listo (`GET /versiones/pendientes` +
  `GET /versiones/{id}` por cada una), así que en cuanto exista el
  renderizador esto se puede construir sin pedir nada más al backend, salvo
  resolver `autorId` → `username` si se quiere mostrar el nombre del autor.
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
npm run build     # 21 rutas: 15 de API + 6 de página
npm run lint      # 0 errores; quedan avisos preexistentes de variables sin usar en route handlers
npm run test:run  # 52 pruebas, 8 archivos
```

El detalle de qué se construyó cada día, con las tablas "Cómo quedó" y las
desviaciones documentadas, está en `docs/plan-implementacion-mvp.md`.
