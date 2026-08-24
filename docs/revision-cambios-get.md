# Revisión: commits `92b1c7d` y `4e3a6e4` (Aksel, 2026-08-23 16:59–17:01)

El último commit (`4e3a6e4 feat: eliminar método GET en la ruta de versiones de
canciones`) no está bien, y no se puede evaluar solo — depende del commit
anterior (`92b1c7d feat: agregar manejo de errores y validación de usuario en
las rutas GET de canciones y versiones`), que es donde está el bug real.
Juntos dejan la rama **sin compilar**.

## Qué hicieron los dos commits

- `92b1c7d` movió el filtro de RN-015 (verificada / propia / admin) de vuelta
  a `GET /canciones/{id}`, aplicándolo tanto al `where` de la propia `Cancion`
  como al `include.versiones`.
- `4e3a6e4` borró por completo el `GET /canciones/{id}/versiones` que se
  había agregado como endpoint dedicado (47 líneas, sin dejar nada en su
  lugar).

Es decir: se deshizo la separación endpoint-de-canción /
endpoint-de-versiones, volviendo al patrón de "todo embebido en
`GET /canciones/{id}`" — el mismo patrón que ya se había identificado como
problemático antes de hoy.

## 1. No compila — `npx tsc --noEmit` falla

```
src/app/api/v1/canciones/[id]/route.ts(36,48): error TS2322:
  Object literal may only specify known properties, and 'autorId'
  does not exist in type 'CancionWhereInput'.
```

El código nuevo filtra la tabla **Cancion** por `autorId`:

```ts
const cancion = await prisma.cancion.findFirst({
  where: {
    id,
    eliminadoEn: null,
    ...(esAdmin ? {} : { OR: [{ estado: "verificada" }, { autorId: userId ?? -1 }] }),
  },
  ...
```

pero el modelo `Cancion` (`prisma/schema.prisma`) no tiene columna `autorId` —
solo la tiene `Version`. Esa condición confunde "¿quién escribió esta
versión?" (que sí vive en `Version.autorId`) con "¿quién creó esta canción?"
(que no se registra en ningún lado). `npm run build` falla en el paso de
TypeScript, así que **esta rama no se puede desplegar tal como está.**

## 2. Aunque se corrigiera el `autorId`, filtrar `Cancion.estado` reproduce un bug ya resuelto hoy

La condición también usa `estado: "verificada"` sobre la propia `Cancion`,
no sobre sus versiones. Eso es exactamente la regresión del commit
`b5b20d2`, ya documentada y revertida el mismo día (ver
`docs/plan-implementacion-mvp.md`, Bloque B.4): **nada en el código pone
jamás `Cancion.estado` en `"verificada"`** — ese campo se queda en
`pendiente` por defecto para siempre. Si se arreglara solo el error de
tipos cambiando `autorId` por algo válido, esta rama del `OR` seguiría sin
cumplirse nunca, y cualquier usuario no-admin volvería a recibir `404` en
**toda** canción, otra vez.

## 3. Bloquea a cualquier visitante sin sesión

```ts
const { userId, userdb, error } = await getUserFromToken(request);
if (error) {
  return NextResponse.json({ error: error.message }, { status: error.status });
}
```

`getUserFromToken` devuelve `error` (401) cuando no hay cookie de sesión.
Como acá se corta la ejecución en ese caso, **ver el detalle de una canción
ahora exige estar logueado** — rompe el flujo público de
buscar → ver canción, que es la puerta de entrada de toda la app y no
debería requerir cuenta.

## 4. Borra el endpoint que el frontend ya estaba usando

`src/components/cancion/DetalleDeCancion.tsx` (pantalla D.2, "Detalle de
canción") pide:

```ts
pedirApi<{ data: Version[] }>(`/canciones/${id}/versiones`)
```

`4e3a6e4` eliminó el `GET` de esa ruta sin tocar el componente que lo
consume ni avisar del cambio. Ese `fetch` ahora devuelve `405 Method Not
Allowed` — la lista de versiones de una canción deja de cargar en
producción, incluso si se arreglaran los puntos 1–3.

## 5. `_count` queda desincronizado de la lista

`_count: { select: { versiones: true } }` no lleva `where`, así que sigue
contando *todas* las versiones no eliminadas — pendientes y rechazadas
incluidas — mientras que `include.versiones` sí las filtra por RN-015. Un
músico vería, por ejemplo, "5 versiones" en el contador pero solo 2 en la
lista, sin ninguna explicación.

## Recomendación

No mergear estos dos commits tal como están. La forma más simple de
arreglarlo es volver al split que ya existía antes de `92b1c7d`:

- `GET /canciones/{id}` → solo metadata + `_count` (sin filtrar por
  usuario, sin exigir sesión).
- `GET /canciones/{id}/versiones` → endpoint propio con el filtro RN-015
  correcto (`Version.estado` / `Version.autorId`, nunca campos de
  `Cancion`), tal como estaba en `1406fda` antes de que `4e3a6e4` lo
  borrara.

Vale la pena avisarle a Aksel de los puntos 1 y 3 primero — son los que
rompen el build y el acceso anónimo, y probablemente no se dio cuenta
porque el error de tipos no siempre se ve si no se corre `tsc`/`build`
antes de commitear.
