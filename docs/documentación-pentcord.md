# PentCord

## 📊 Estado general de implementación

*Última actualización: 2026-08-22, en base a una auditoría del código real en `c:\dev\pentcord`.*

Leyenda usada en todo el documento: **✅ Implementado** · **🚧 Parcial / difiere del diseño original** · **⏳ Planeado, no implementado**.

- **Backend/API:** 🚧 avanzado — auth local (registro/login con JWT en cookie), CRUD de canciones y versiones, sistema de revisión (aprobar/rechazar), favoritos y foto de perfil (Cloudinary) están construidos y funcionando, pero varios nombres de campos/rutas y reglas de negocio ya se desviaron del diseño original (detallado sección por sección más abajo).
- **Módulo de dominio musical (parser ChordPro, transposición, conversión a grados Nashville, renderizador):** ✅ **construido y probado** en `src/domain/musica/` (2026-08-23), con la suite de precisión de 1008 acordes en verde. Lo que falta ahora es **consumirlo**: el visor sigue pintando una maqueta, la pantalla de aportar no existe, y `contenido_chordpro` se guarda y devuelve tal cual, sin que el servidor lo revalide.
- **Frontend/UI:** ⏳ **no existe** — `src/app/page.tsx` está vacío, no hay páginas de login, buscador, detalle de canción/versión, aportar, perfil ni panel de admin, y no hay carpeta `components/`.
- **Login con Google:** ⏳ solo existen los campos de datos (`metodoAutenticacion: google`, `googleId`); no hay endpoint ni lógica OAuth.
- **Refresh token:** ⏳ el código existe pero está comentado; no se emite ni se usa.
- **Testing:** ⏳ no existe ninguna infraestructura de pruebas (sin Jest/Vitest/Playwright, sin carpeta `tests/`).
- **Arquitectura en capas (`domain/application/infrastructure`):** ⏳ no implementada — hoy toda la lógica vive directamente en los `route.ts` de `src/app/api/v1/...`, que llaman a Prisma inline; lo más parecido a "infraestructura" es `src/lib/` (prisma.ts, cloudinary.ts, getUserFromToken.ts).

# 🏁 Fase 0 · Visión, Restricciones y Definición del Éxito

## 1️⃣ Visión del proyecto

> Este sistema sirve para mostrar canciones (letra y acordes) con distintas versiones, permitir que los músicos guarden sus favoritas y aporten canciones/versiones nuevas, y convertirlas de forma precisa entre notas y grados (sistema numérico tipo Nashville),
para que músicos puedan transportarlas al tono que necesiten de manera rápida y confiable durante ensayos o presentaciones.
> 

## 2️⃣ Problema que resuelve

- **¿Qué problema existe hoy?** Ya existen apps con canciones (muchas cristianas) que permiten transportar acordes, pero las notas suelen ser imprecisas o corresponden a otra versión de la canción (letra/acordes parecidos pero no exactos).
- **¿Cómo lo resuelve actualmente la gente?** Usan apps genéricas de acordes, o hacen el transporte a mano, o recurren al sistema de grados porque es más fácil de transportar mentalmente.
- **¿Por qué esa solución no es suficiente?** No distinguen bien entre versiones distintas de una misma canción, y la conversión nota↔grado no siempre es precisa ni está integrada en la misma app.
- **¿Qué cambiará gracias a tu sistema?** Un músico podrá encontrar la versión correcta de una canción, transportarla a cualquier tono y ver/usar su equivalente en grados, con precisión musical garantizada.

## 3️⃣ Usuario principal

- **Quién es:** Un músico (de alabanza o banda) que toca guitarra o teclado.
- **Qué intenta lograr:** Encontrar rápidamente la versión correcta de una canción y transportarla al tono que necesita antes o durante un ensayo/servicio.
- **Qué conocimientos tiene:** Conoce acordes básicos y, en muchos casos, el sistema de grados (números tipo Nashville).
- **Qué espera del sistema:** Que el acorde/grado mostrado sea siempre correcto y que sea rápido de consultar desde el celular.

## 4️⃣ Objetivos SMART (2–5)

| # | Objetivo |
| --- | --- |
| 1 | Transportar una canción a cualquier tono con 100% de precisión musical (validado con casos de prueba). |
| 2 | Convertir automáticamente acordes a grados y viceversa sin errores, cubriendo acordes mayores, menores, séptimas y suspendidos (sus). |
| 3 | Permitir registrar y distinguir múltiples versiones de una misma canción (letra y/o acordes distintos). |
| 4 | Que un músico encuentre y transporte una canción en máximo 3 clics desde el celular. |
| 5 | Que un músico pueda guardar canciones favoritas y aportar canciones/versiones nuevas con una cuenta (local o Google). |

## 5️⃣ Alcance — ¿qué SÍ hará?

- Registrar canciones con su letra y sus acordes.
- Permitir múltiples versiones por canción (variantes de letra/acordes).
- Transportar (transponer) los acordes de una canción a cualquier tono.
- Convertir acordes a grados (sistema numérico) y de grados a acordes.
- Buscar y visualizar canciones desde una web responsiva (celular y escritorio).
- Iniciar sesión con cuenta local o con Google.
- Guardar canciones como favoritas/frecuentes.
- Permitir que un músico aporte una canción o versión nueva al catálogo que queda sujeta a revisión antes de publicarse.
- Permitir que un administrador revise (apruebe o rechace) las versiones aportadas por usuarios.
- Permitir que el músico suba/edite una foto de perfil.
- Permitir que un usuario elimine su cuenta o una versión propia, conservando sus versiones ya verificadas y favoritos como registro recuperable (borrado lógico), no como borrado definitivo.

## 6️⃣ Fuera de alcance — ¿qué NO hará?

- No funcionará sin Internet (offline).
- No tendrá app nativa Android/iOS (solo web responsiva).
- No tendrá reproducción de audio ni pistas/backing tracks.
- No tendrá edición colaborativa en tiempo real entre varios usuarios.
- No usará inteligencia artificial para generar canciones o detectar acordes desde audio.

## 7️⃣ Restricciones

| Categoría | Detalle |
| --- | --- |
| Tamaño permitido *(obligatoria)* | Solo MVP: registrar canciones/versiones, transportar y convertir a grados. |
| Tiempo *(obligatoria)* | Sin fecha límite; ritmo aproximado de ~1 hora por semana, sin presión externa. |
| Recursos *(obligatoria)* | Un único desarrollador (Kevin), sin diseñador dedicado, sin QA dedicado. |
| Calidad *(obligatoria)* | La precisión de la conversión notas↔grados nunca se sacrifica; es la prioridad #1 sobre velocidad de desarrollo o estética. |
| Costo *(opcional)* | Servicios gratuitos o de muy bajo costo (Neon plan gratuito, Cloudinary plan gratuito, hosting/dominio). |
| Riesgo *(opcional)* | No depender de APIs de terceros para la lógica de transporte/grados (debe ser lógica propia); evitar tecnologías experimentales. |

## 8️⃣ Criterios No-Go

- Si la conversión acorde↔grado falla en más del 5% de los casos y no se puede corregir con esfuerzo razonable.
- Si el MVP requiere infraestructura paga significativa solo para funcionar.
- Si dejo de trabajar en esto por más de 8 semanas seguidas, replantear si vale la pena continuar.

## 9️⃣ Calidad mínima

| Categoría | Métrica |
| --- | --- |
| Rendimiento | La transposición/conversión de acordes se ejecuta en menos de 100 ms en el navegador. |
| Seguridad | Sin credenciales ni datos sensibles expuestos en el código (aunque no haya login en el MVP). |
| Disponibilidad | La app está disponible en línea sin caídas prolongadas (no se maneja backup diario por ser dato mayormente estático). |
| Usabilidad | Flujo principal (buscar → ver → transportar) completado en máximo 3 clics, en celular y escritorio. |
| Confiabilidad | La conversión de notas a grados (y viceversa) es 100% precisa según teoría musical, validada con casos de prueba manuales. |

## ✅ Gate Fase 0

- [x]  ¿Puedo explicar el proyecto completo en menos de 2 minutos?
- [x]  ¿La visión cabe en una sola frase?
- [x]  ¿Sé exactamente quién usará el sistema?
- [x]  ¿El problema que resuelve está claramente descrito?
- [x]  ¿Tengo entre 2 y 5 objetivos medibles?
- [x]  ¿Está claro qué sí hará el proyecto?
- [x]  ¿Está claro qué NO hará el proyecto?
- [x]  ¿Las restricciones están documentadas?
- [x]  ¿Existen al menos 2 criterios No-Go?
- [x]  ¿Hay al menos 3 métricas de calidad medibles?
- [x]  ¿Todo el documento puede leerse en menos de 5 minutos?

# 🧭 Fase 1 · Descubrimiento y Alcance

## 1️⃣ Actores

| Actor | Qué necesita | Qué recibe |
| --- | --- | --- |
| Músico (usuario) | Buscar, ver y transportar canciones; guardar favoritas; aportar canciones/versiones nuevas | La canción en el tono/formato (notas o grados) que necesita, su lista de favoritas guardada |
| Administradores | Cargar y curar el catálogo inicial de canciones y versiones | Control total del catálogo y de la calidad de los datos |
| Google | Autenticar a los usuarios que elijan ese método | Confirmación de identidad del usuario |
| Neon (PostgreSQL) | Persistir canciones, versiones, usuarios y favoritas | Almacenamiento y consulta de datos |
| Cloudinary | Almacenar la foto de perfil del usuario | Confirmación de subida y URL del recurso |

## 2️⃣ Contexto del sistema

> El sistema recibe canciones y sus versiones (letra y acordes) cargadas por el administrador, junto con las solicitudes de los músicos para buscar, ver, transportar y convertir esas canciones a grados. Procesa la transposición de acordes y la conversión notas↔grados con lógica propia. Devuelve la canción renderizada en el tono o formato solicitado, y permite guardar canciones como favoritas o proponer canciones/versiones nuevas. Se comunica con Neon (PostgreSQL) para persistir los datos y, opcionalmente, con Google para autenticar usuarios. El sistema no reproduce audio, no funciona sin Internet y no gestiona pagos ni notificaciones.
> 

## 3️⃣ MVP — funcionalidades (5–8)

- 🚧 Iniciar sesión (cuenta local o con Google) — local funciona (registro/login con JWT); Google **no** implementado.
- 🚧 Buscar y ver canciones (letra + acordes) — el endpoint de búsqueda existe (`GET /api/v1/canciones`) y la pantalla del visor también, pero todavía pinta una canción de maqueta: falta enchufarla al renderizador del dominio, que ya está construido.
- 🚧 Ver las distintas versiones de una misma canción — el dato existe y se puede listar vía API; sin UI.
- ⏳ Transportar (transponer) los acordes de una canción a cualquier tono — no implementado, no existe el módulo de dominio.
- 🚧 Convertir acordes a grados y de grados a acordes — el conversor del dominio está hecho y verificado; el conmutador de la pantalla todavía habla con la maqueta.
- ✅ Guardar canciones como favoritas/frecuentes — API completa (GET/POST/DELETE), idempotente; sin UI.
- 🚧 Agregar una canción o una versión nueva al catálogo — API funcional, pero sin vista previa en tiempo real (no hay módulo de dominio para renderizar) ni UI.
- ✅ Revisar (aprobar/rechazar) versiones pendientes — API funcional, restringida a rol administrador; sin UI.
- ✅ Subir o editar foto de perfil — API funcional con Cloudinary.
- 🚧 Eliminar versión propia o cuenta propia (con retención de favoritos/versiones verificadas) — cuenta propia: implementado. Versión propia: implementado pero con un flujo distinto al diseño original (ver Fase 2, HU-13 y RN-019).

## 4️⃣ Fuera del MVP (futuras versiones)

- Modo offline.
- Importación masiva o automática de canciones (ej. desde PDF/OCR).
- Notificaciones (ej. cuando se agrega una versión nueva de una canción favorita).
- Estadísticas de uso avanzadas.
- Temas personalizables / modo oscuro configurable.

## 5️⃣ Priorización

| Funcionalidad | Prioridad |
| --- | --- |
| Buscar y ver canciones (letra + acordes) | Imprescindible |
| Transportar acordes a cualquier tono | Imprescindible |
| Convertir acordes ↔ grados | Imprescindible |
| Ver distintas versiones de una canción | Imprescindible |
| Iniciar sesión (local / Google) | Importante |
| Guardar canciones favoritas | Importante |
| Agregar canción/versión nueva (usuario) | Importante |
| Revisar (aprobar/rechazar) versiones pendientes. | Importante |
| Subir/editar foto de perfil | Importante |
| Eliminar versión propia / cuenta propia | Importante |

## 6️⃣ Riesgos iniciales

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| La lógica de transporte/conversión a grados es más compleja de lo previsto (casos especiales: acordes con bajo, sus, add9, etc.) | Alto | Construir y validar esa lógica primero, con una suite de casos de prueba reales, antes de tocar la UI. ✅ **Cerrado el 2026-08-23:** la mitigación se cumplió, aunque tarde y fuera de orden (primero se construyó auth + CRUD y la interfaz). El módulo existe, con suite exhaustiva de 1008 acordes contra tabla de teoría musical. Los casos especiales que preocupaban se resolvieron así: acordes con bajo sí (`C/E`), `sus2`/`sus4` sí, y todo lo que queda fuera de las siete calidades de RN-005 —`add9`, `dim`, `aug`, novenas— se marca "no reconocido" y se arrastra tal cual en vez de adivinarse. |
| Cargar canciones a mano es tedioso y puede desincentivar mantener el catálogo | Medio | Definir un formato de texto simple y estándar para pegar letra+acordes, en vez de un formulario campo por campo. |
| Como único administrador, revisar cada aporte puede volverse un cuello de botella | Medio | Mantener el criterio de aprobación simple y rápido (validez de ChordPro + no duplicado evidente), sin proceso burocrático |
| Dependencia de Neon (plan gratuito) para persistencia | Bajo | Revisar límites del plan gratuito antes de escalar el catálogo; documentar la limitación. |

## ✅ Gate Fase 1

- [x]  ¿Conozco todos los actores principales?
- [x]  ¿El contexto del sistema puede entenderse leyendo un único párrafo?
- [x]  ¿El MVP tiene entre 5 y 10 funcionalidades realmente esenciales?
- [x]  ¿Está documentado qué quedará para futuras versiones?
- [x]  ¿Las funcionalidades están priorizadas?
- [x]  ¿Existen entre 3 y 5 riesgos con una mitigación clara?
- [x]  ¿El alcance parece realizable por una persona en el tiempo previsto?
- [x]  ¿Todo el documento puede leerse en menos de 10 minutos?
- [x]  ¿Podría terminar este MVP trabajando solo?
- [x]  ¿Estoy construyendo la versión 1 o la versión 10? → Versión 1: catálogo + transporte + grados + favoritas básicas.

# 📝 Fase 2 · Requisitos Funcionales

## 0️⃣ Decisiones base (derivadas de tus respuestas)

- **Visibilidad:** Buscar y ver canciones/versiones es público (sin cuenta). Guardar favoritas y aportar contenido requieren cuenta (local o Google).
- **Modelo de datos:** Una **canción base** (título, artista) agrupa **N versiones**. Cada versión tiene su propio tono original, letra+acordes y estado (`Pendiente de revisión` / `Verificada` / `Rechazada`).
- **Tono:** Cada versión tiene un **tono original fijo**, asignado al crearse. Ese tono es la referencia para transportar y para convertir a grados. Transportar o convertir NO modifica el tono original almacenado, solo genera una vista distinta.
- **Formato de almacenamiento vs. formato de visualización (confirmado):**
    - **Almacenamiento (fuente de verdad):** ChordPro. El acorde va entre corchetes inmediatamente antes de la sílaba donde se toca: `[C]Cuando salga el [G]sol`.
    - **Visualización (lo que ve el músico):** línea de acordes encima de la letra, generada automáticamente a partir del ChordPro por un **renderizador**:
        
        ```
        C        G
        Cuando salga el sol
        ```
        
    - El usuario aporta contenido en ChordPro (paso de entrada); nunca edita directamente el formato visual con espacios. Transportar y convertir a grados operan siempre sobre el ChordPro almacenado; el renderizador recalcula la posición visual cada vez, así que nunca hay que recalcular espacios a mano.
- **Eliminación de cuenta:** es un borrado lógico del Usuario. Sus versiones ya Verificadas y sus Favoritos NO se eliminan ni se desasocian; quedan intactos en la base de datos para permitir restablecer la cuenta si el usuario lo solicita por otro medio. Solo se revoca su acceso (login) y deja de poder autenticarse.

---

## 1️⃣ Historias de usuario

| ID | Historia | Estado |
| --- | --- | --- |
| HU-01 | Como **músico**, quiero **iniciar sesión con cuenta local o con Google**, para **guardar favoritas y aportar canciones bajo mi identidad**. | 🚧 Local ✅ / Google ⏳ |
| HU-02 | Como **músico**, quiero **buscar canciones por título/artista**, para **encontrar rápidamente la que necesito antes de un ensayo**. | 🚧 API sí, UI no |
| HU-03 | Como **músico**, quiero **ver las distintas versiones de una canción**, para **elegir la que corresponde exactamente a lo que voy a tocar**. | 🚧 API sí, UI no |
| HU-04 | Como **músico**, quiero **ver la letra y acordes de una versión específica**, para **seguir la canción mientras toco**. | ⏳ Sin renderizador |
| HU-05 | Como **músico**, quiero **transportar los acordes de una versión a cualquier tono**, para **tocarla en el tono que me conviene sin recalcular a mano**. | ⏳ No implementado |
| HU-06 | Como **músico**, quiero **convertir los acordes de una versión a grados (Nashville) y viceversa**, para **comunicarme con otros músicos usando números en vez de notas**. | ⏳ No implementado |
| HU-07 | Como **músico**, quiero **guardar una canción como favorita**, para **encontrarla rápido la próxima vez sin buscarla de nuevo**. | ✅ API completa |
| HU-08 | Como **músico**, quiero **agregar una canción nueva al catálogo (con su primera versión)**, para **que esté disponible para mí y para otros músicos**. | 🚧 API sí, UI no |
| HU-09 | Como **músico**, quiero **agregar una versión nueva a una canción que ya existe**, para **registrar una variante distinta de letra/acordes que no está en el catálogo**. | 🚧 API sí, UI no |
| HU-10 | Como **músico que está aportando contenido**, quiero **ver una vista previa en tiempo real de cómo quedará renderizada mi canción mientras escribo el ChordPro**, para **confirmar que se ve bien antes de subirla, sin tener que guardar primero para revisar**. | ⏳ No implementado |
| HU-11 | Como administrador, quiero revisar las versiones pendientes para aprobarlas o rechazarlas, para mantener la calidad del catálogo público. | 🚧 API sí, UI no |
| HU-12 | Como **músico**, quiero **subir o cambiar mi foto de perfil**, para **personalizar mi cuenta**. | ✅ API con Cloudinary |
| HU-13 | Como **usuario autenticado**, quiero **eliminar una versión propia**, para **quitarla del catálogo si ya no la considero válida**. | 🚧 Flujo distinto (ver nota) |
| HU-14 | Como **usuario autenticado**, quiero **eliminar mi cuenta**, para **dejar de usar el sistema, sabiendo que mi contenido verificado se conserva por si quiero restablecerla**. | ✅ Implementado |

**Notas de implementación por historia** *(detalle de la columna Estado):*

- **HU-01:** local implementado (`POST /api/v1/auth/register`, `POST /api/v1/auth/login`); Google no implementado.
- **HU-02 / HU-03 / HU-08 / HU-09 / HU-11 / HU-12:** el endpoint de API existe y funciona; no hay ninguna pantalla que lo consuma todavía.
- **HU-04:** la API devuelve el ChordPro crudo, pero no hay renderizador (RN-009b no implementada) ni UI.
- **HU-08:** además, no valida sintaxis real de ChordPro (se guarda el texto tal cual).
- **HU-05 / HU-06 / HU-10:** dependen del módulo de dominio musical, que no existe.
- **HU-11:** implementado vía `GET /api/v1/versiones/pendientes` y `PATCH /api/v1/versiones/{id}/revision`; ya no se registra qué administrador revisó (ver nota sobre `revisor_id` en Fase 3/4).
- **HU-13:** implementado con un flujo de dos pasos distinto al diseño original: el autor solicita la eliminación (`PATCH /api/v1/versiones/{id}` → estado `pendienteEliminacion`) y un administrador la confirma (`DELETE /api/v1/versiones/{id}`). No confirmado aún como diseño definitivo — el DELETE directo por el propio dueño sigue siendo una alternativa abierta.
- **HU-14:** implementado vía `DELETE /api/v1/usuarios` (la ruta real no lleva `/me`).

---

## 2️⃣ Criterios de aceptación

| Historia | Given | When | Then |
| --- | --- | --- | --- |
| HU-01 | El usuario no tiene sesión iniciada | Ingresa correo/contraseña válidos registrados previamente | El sistema inicia sesión y lo redirige a la pantalla principal |
| HU-01 | El usuario no tiene sesión iniciada | Elige "Iniciar con Google" y autoriza correctamente | El sistema crea/asocia la cuenta y lo autentica |
| HU-01 | El usuario intenta registrar cuenta local | El correo ya existe en el sistema | El sistema rechaza el registro e informa que el correo ya está en uso (RN-007) |
| HU-02 | El usuario está en la pantalla de búsqueda | Escribe un texto que coincide con el título o artista de alguna canción | El sistema muestra la lista de canciones coincidentes en máximo 1 clic desde el buscador |
| HU-02 | El usuario busca un texto | Ninguna canción coincide | El sistema muestra un mensaje de "sin resultados", no un error |
| HU-03 | El usuario abrió una canción base | La canción tiene 2 o más versiones registradas | El sistema lista todas las versiones visibles (Verificadas); si el usuario es el autor de alguna versión propia en otro estado, también la ve con su etiqueta correspondiente |
| HU-04 | El usuario seleccionó una versión | Abre la versión | El sistema renderiza el ChordPro almacenado como línea de acordes encima de la letra, en el tono original, en menos de 100 ms |
| HU-05 | El usuario está viendo una versión en su tono original | Selecciona un tono destino distinto | El sistema recalcula el ChordPro transportado y vuelve a renderizarlo como línea de acordes encima de la letra, sin alterar el registro original, en menos de 100 ms |
| HU-05 | El usuario transporta una versión | El tono destino es igual al tono original | El sistema muestra la misma vista sin cambios (operación válida, no error) |
| HU-06 | El usuario está viendo una versión (en su tono original o transportada) | Activa "ver en grados" | El sistema muestra cada acorde como su grado equivalente respecto al tono activo en pantalla |
| HU-06 | El usuario está viendo una versión en modo grados | Activa "ver en notas" | El sistema reconvierte los grados a notas correctamente respecto al tono activo |
| HU-07 | El usuario tiene sesión iniciada y ve una canción/versión | Presiona "Guardar como favorita" | El sistema la agrega a su lista de favoritas y confirma visualmente |
| HU-07 | El usuario no tiene sesión iniciada | Presiona "Guardar como favorita" | El sistema lo redirige a iniciar sesión, sin perder la canción que estaba viendo |
| HU-08 | El usuario tiene sesión iniciada | Completa título, artista, tono original y letra+acordes en formato ChordPro válido, y guarda | El sistema crea la canción base y su primera versión (almacenada en ChordPro), creada en estado Pendiente de revisión, visible solo para el autor hasta ser aprobada |
| HU-08 | El usuario aporta una canción | El texto de letra+acordes no cumple el formato ChordPro esperado | El sistema rechaza el guardado e indica qué línea no pudo interpretarse |
| HU-09 | El usuario tiene sesión iniciada y está viendo una canción base existente | Elige "Agregar nueva versión", completa tono y letra+acordes en formato ChordPro válido, y guarda | El sistema agrega la versión (en ChordPro) a esa canción base, creada en estado Pendiente de revisión, visible solo para el autor hasta ser aprobada |
| HU-10 | El usuario está en el formulario de aportar canción/versión, en una pantalla ancha | Escribe o modifica el texto en el textarea de ChordPro | El sistema muestra, al lado del textarea, la vista previa renderizada (línea de acordes encima de la letra) actualizándose en tiempo real |
| HU-10 | El usuario está en el formulario de aportar canción/versión, en una pantalla angosta (móvil) | Escribe o modifica el texto en el textarea de ChordPro | El sistema muestra la vista previa renderizada debajo del textarea, actualizándose en tiempo real |
| HU-10 | El usuario está escribiendo en el textarea de ChordPro | El texto tiene un error de sintaxis (ej. un corchete sin cerrar o un acorde no reconocido, ver RN-005) | La vista previa señala el error en el punto exacto donde ocurre (ej. resaltando esa línea/acorde), en vez de mostrar una vista rota o desactualizada |
| HU-10 | La vista previa está mostrando un error de sintaxis | El usuario corrige el texto | La vista previa vuelve a renderizarse normalmente sin necesidad de recargar ni de una acción adicional |
| HU-11 | Administrador ve lista de versiones Pendientes  | Selecciona una y aprueba o rechaza  | El sistema actualiza el estado y notifica visualmente al autor (etiqueta) en su sección de aportes. |
| HU-12 | El usuario tiene sesión iniciada | Sube una imagen jpg/png/webp ≤10MB | El sistema actualiza `foto_perfil_url` y la muestra de inmediato |
| HU-12 | El usuario sube un archivo | El archivo no es una imagen válida o pesa más de 10MB | El sistema rechaza la subida con mensaje claro, sin tocar la foto anterior |
| HU-13 | El usuario ve una versión propia en "Mis aportes"  | Confirma "Eliminar" en el modal | El sistema marca `eliminado_en`; la versión desaparece de "Mis aportes" y del catálogo público si estaba Verificada |
| HU-14 | El usuario está en Perfil → Eliminar cuenta | Confirma la eliminación en el modal | El sistema marca `eliminado_en` en Usuario, cierra la sesión, y conserva sus versiones Verificadas y Favoritos sin cambios |

## 3️⃣ Reglas de negocio

**RN-001:** ✅ Toda versión pertenece exactamente a una canción base (relación padre-hijo). *(FK `cancion_id` obligatoria en `Version`)*

**RN-002:** ✅ Toda versión tiene un tono original fijo, asignado al momento de crearse; este tono no cambia después. *(campo `tono_original`, sin endpoint que lo edite)*

**RN-003:** ✅ Transportar o convertir a grados genera una vista distinta, pero nunca modifica el tono original ni la letra+acordes almacenados. *(`transportarDocumento` y `renderizar` devuelven estructuras nuevas y no mutan el documento de entrada; hay pruebas que lo comprueban con `structuredClone`. Nada del dominio escribe en base de datos. **Pendiente aparte:** el visor D.3 sigue conectado a la maqueta, ver RN-009b)*

**RN-004:** ✅ La conversión acorde↔grado siempre es relativa al tono activo en pantalla (original o transportado), nunca a un tono fijo global. *(`acordeAGrado`/`gradoAAcorde` reciben la tónica como parámetro obligatorio; no existe ningún tono global en el módulo. `renderizar` le pasa siempre el tono que hay en pantalla, no el original)*

**RN-005:** ✅ Los tipos de acorde soportados en el MVP son: mayor, menor, séptima (dominante, mayor, menor) y suspendido (sus2/sus4). Un acorde fuera de estos tipos se marca como "no reconocido" en vez de fallar silenciosamente. *(`parsearAcorde` devuelve `null` fuera de esas siete calidades; el token conserva el literal, el renderizador lo pinta tal cual con `reconocido: false` y el transportador no lo toca. Ver «Dominio musical» en Fase 8 §2)*

**RN-006:** ✅ Una canción/versión solo puede aparecer una vez en la lista de favoritas de un mismo usuario (guardar una ya guardada es una operación idempotente, no crea duplicados). *(PK compuesta `(user_id, version_id)` en `Favorito`, y `POST /favoritos` responde 200 sin duplicar si ya existe)*

**RN-007:** 🚧 El correo de una cuenta local debe ser único en el sistema. *(se valida en código en `POST /api/v1/auth/register`, pero el campo `email` no tiene restricción `@unique`/`UNIQUE` a nivel de base de datos — riesgo de condición de carrera con registros simultáneos)*

**RN-008:** ✅ Buscar y ver canciones/versiones no requiere autenticación. Guardar favoritas y aportar contenido (canción o versión nueva) sí requieren sesión iniciada. *(`GET /canciones`, `GET /canciones/{id}`, `GET /versiones/{id}` son públicos; `POST /canciones`, `POST /canciones/{id}/versiones`, `POST /favoritos` exigen JWT)*

**RN-009:** 🚧 La letra+acordes se almacena siempre en formato ChordPro: el acorde va entre corchetes inmediatamente antes de la sílaba donde se toca (ej. `[C]Cuando salga el [G]sol`). Cualquier texto entre corchetes que no corresponda a un acorde válido de los tipos soportados (RN-005) se considera un error de formato al momento de guardar. *(el **parser ya existe** en `src/domain/musica/chordpro.ts` y acumula los errores con línea y columna, pero el endpoint sigue guardando cualquier texto: falta llamarlo desde `POST /canciones/{id}/versiones`. Es tarea de backend, pendiente en el plan)*

**RN-009b:** 🚧 La visualización nunca muestra el ChordPro crudo al usuario final; siempre se renderiza como línea de acordes encima de la letra. El renderizado es una vista derivada, se recalcula en cada consulta y no se almacena. *(el **renderizador ya existe** — `renderizar` devuelve segmentos posicionados y no persiste nada — pero el visor D.3 todavía se alimenta de `src/lib/demo/cifradoDeMaqueta.ts`; falta enchufarlo. La API sigue devolviendo el ChordPro crudo, que es correcto: el render se hace en el cliente)*

**RN-010:** 🚧 El título de la canción base no necesita ser único (pueden existir canciones con el mismo título de artistas distintos), pero la combinación título+artista sí debería evitar duplicados exactos accidentales (advertencia, no bloqueo, ya que no hay moderación). *(no hay duplicación en BD, correcto; pero `POST /canciones` tampoco emite ninguna advertencia de posible duplicado — solo `GET /canciones` devuelve `autoresSugeridos`, una función de autocompletado no documentada originalmente, útil para prevenir duplicados desde la UI cuando exista)*

**RN-011:** ⏳ Todo formulario de aportar canción/versión debe mostrar una vista previa renderizada del ChordPro que el usuario está escribiendo, actualizada en tiempo real (sin necesidad de guardar ni de un botón "previsualizar" aparte). *(no implementado: no hay UI ni renderizador)*

**RN-012:** ⏳ La ubicación de la vista previa se adapta al ancho de pantalla: al lado del textarea si hay espacio horizontal suficiente, debajo del textarea si la pantalla es angosta (móvil). Es una decisión de layout responsivo, no cambia el comportamiento de fondo. *(no implementado, depende de RN-011)*

**RN-013:** 🚧 Si el texto en edición tiene un error de sintaxis (formato ChordPro inválido o acorde no reconocido según RN-005), la vista previa debe señalar el error en el punto donde ocurre en vez de romperse, mostrar contenido vacío o quedar congelada con la última versión válida. *(la mitad de dominio está hecha: `parsearChordPro` nunca lanza, devuelve las líneas legibles igualmente y acumula `{ clase, linea, columna, literal, mensaje }` con posiciones 1-based, listas para `details.linea`/`details.columna`. Falta la pantalla de aportar, que es la que lo señala)*

**RN-014:** ✅ Toda versión aportada por un músico nace en estado Pendiente de revisión; una versión aportada por un administrador nace directamente Verificada. *(default `pendiente` en el schema; no se encontró lógica que ponga `verificada` automáticamente si el autor es administrador — **verificar/implementar**, ver nota técnica)*

**RN-015:** 🚧 Solo las versiones en estado Verificada son visibles en el catálogo público; las Pendientes y Rechazadas solo son visibles para su autor. *(**no enforced todavía**: `GET /api/v1/canciones/{id}` devuelve todas las versiones no eliminadas sin filtrar por `estado` ni por autor, y `GET /api/v1/versiones/{id}` tampoco filtra por `estado` — cualquiera puede ver una versión Pendiente o Rechazada conociendo su id)*

**RN-016:** ✅ Solo un usuario con rol administrador puede aprobar o rechazar una versión Pendiente. *(`PATCH /api/v1/versiones/{id}/revision` valida `rol === "administrador"`, responde 403 si no)*

**RN-017:** 🚧 Una versión Rechazada no puede volver a Pendiente ni ser editada en el MVP (si el músico quiere corregirla, debe crear una versión nueva). *(no hay endpoint de edición de versión, así que de hecho se cumple; pero tampoco hay una validación explícita que impida re-transicionar el estado si se llamara `/revision` sobre una ya revisada — revisar si `PATCH /revision` valida que el estado actual sea `pendiente` antes de cambiarlo)*

**RN-018:** ✅ Eliminar una cuenta es un borrado lógico (`eliminado_en`) que solo revoca el acceso del usuario. Sus versiones en estado Verificada y sus Favoritos NO se eliminan ni se desvinculan; permanecen visibles/funcionales en el catálogo y quedan disponibles para restablecer la cuenta. *(`DELETE /api/v1/usuarios` — nota: la ruta real no incluye `/me`)*

**RN-019:** 🚧 Eliminar una versión propia es un borrado lógico independiente del estado en que se encuentre (Pendiente, Verificada o Rechazada). Si la versión estaba Verificada, deja de ser visible en el catálogo público y en las listas de favoritos de otros usuarios que la hubieran marcado (sin notificarles). *(implementado, pero **no como un borrado directo por el dueño**: hoy es un flujo de dos pasos — el autor solicita la eliminación vía `PATCH /api/v1/versiones/{id}` (pasa a estado `pendienteEliminacion`) y un administrador la confirma vía `DELETE /api/v1/versiones/{id}` (pasa a `eliminada` + `eliminado_en`). Este es el comportamiento actual del código, pendiente de confirmar si es el diseño definitivo o si se simplifica a un DELETE directo del dueño como se pensó originalmente — ver también RN-019b.)*

**RN-019b:** 🚧 *(regla nueva, agregada para documentar el comportamiento real, no confirmada como definitiva)* El ciclo de vida de una versión incluye dos estados adicionales no contemplados en el diseño original: `pendienteEliminacion` (el autor solicitó eliminarla, esperando confirmación de un administrador) y `eliminada` (un administrador confirmó la eliminación). Mientras una versión está en `pendienteEliminacion`, sigue existiendo en la base de datos con su `estado` anterior sobrescrito — no se documentó aún qué debe verse en el catálogo/favoritos durante ese estado intermedio.

**RN-020:** La foto de perfil se almacena en Cloudinary; solo la URL (`foto_perfil_url`) vive en la base de datos, nunca el archivo.

---

## 4️⃣ Escenarios alternativos y errores

- Login local con correo o contraseña incorrectos → mensaje de error genérico (sin indicar cuál campo falló, por seguridad).
- Falla la autenticación con Google (usuario cancela o hay error de red) → el usuario permanece sin sesión, sin mensaje alarmante.
- Búsqueda sin resultados → mensaje neutro, no error.
- Intento de ver una canción/versión que fue eliminada → mensaje de "contenido no disponible".
- Transportar a un tono igual al original → operación válida, no error (RN de "no-op").
- Acorde no reconocido durante transporte o conversión a grados → se muestra el acorde original marcado visualmente como "no reconocido", sin romper el resto de la canción.
- Usuario sin sesión intenta guardar favorita o aportar contenido → redirección a login, sin perder el contexto (la canción que estaba viendo).
- Guardar una canción ya marcada como favorita → no se duplica, se ignora silenciosamente o se muestra ya marcada.
- Aporte de canción/versión con formato de letra+acordes inválido → se rechaza el guardado señalando la línea/posición problemática, no se guarda contenido parcial.
- Aporte de canción/versión sin tono original especificado → se rechaza el guardado (el tono es obligatorio, es la base de RN-002 a RN-004).
- Mientras el usuario escribe en el textarea de ChordPro, el texto queda momentáneamente con sintaxis inválida (corchete sin cerrar, acorde no reconocido) → la vista previa señala el error puntual sin bloquear la escritura ni impedir seguir editando; el botón de guardar permanece deshabilitado hasta que el error se resuelva.
- Usuario elimina su cuenta teniendo versiones favoritas de otros usuarios apuntando a sus versiones Verificadas → esas versiones siguen visibles normalmente para todos (RN-018), solo el autor pierde acceso a su cuenta.
- Usuario elimina una versión Verificada que otros tenían como favorita → desaparece de esas listas de favoritos sin aviso (RN-019).

---

## 5️⃣ Casos de uso

### Caso de uso: Iniciar sesión

- **Actor principal:** Músico
- **Precondiciones:** El usuario no tiene sesión activa.
- **Flujo principal:**
    1. El usuario elige "Iniciar sesión".
    2. Ingresa correo y contraseña de su cuenta local.
    3. El sistema valida las credenciales.
    4. El sistema inicia sesión y lo redirige a donde estaba.
- **Flujos alternativos:**
    - El usuario elige "Iniciar con Google" en vez del paso 2; Google autentica y el sistema asocia/crea la cuenta.
    - Credenciales inválidas → el sistema muestra error y permite reintentar.
- **Postcondiciones:** El usuario queda autenticado y puede guardar favoritas o aportar contenido.

### Caso de uso: Transportar una versión a otro tono

- **Actor principal:** Músico
- **Precondiciones:** El usuario está viendo una versión de una canción (no requiere sesión).
- **Flujo principal:**
    1. El usuario abre el selector de tono.
    2. Elige el tono destino.
    3. El sistema recalcula cada acorde de la versión según la distancia entre tono original y tono destino.
    4. El sistema muestra la letra con los acordes ya transportados.
- **Flujos alternativos:**
    - El tono destino es igual al original → se muestra la vista sin cambios.
    - Un acorde no es de los tipos soportados → se marca como "no reconocido" y el resto se transporta normalmente.
- **Postcondiciones:** La vista en pantalla refleja el nuevo tono; el registro original de la versión no cambia.

### Caso de uso: Agregar canción o versión nueva

- **Actor principal:** Músico (autenticado)
- **Precondiciones:** El usuario tiene sesión iniciada.
- **Flujo principal:**
    1. El usuario elige "Agregar canción" (o "Agregar versión" desde una canción existente).
    2. Completa título/artista (si es canción nueva) y tono original.
    3. Escribe/pega la letra+acordes en formato ChordPro en el textarea; mientras escribe, ve la vista previa renderizada (al lado o debajo del textarea, según el ancho de pantalla) actualizándose en tiempo real.
    4. Cuando el ChordPro es sintácticamente válido, presiona guardar.
    5. El sistema guarda la canción base (si aplica) y la versión, marcada como "aportada por usuario".
- **Flujos alternativos:**
    - Mientras escribe, el texto tiene un error de sintaxis → la vista previa señala el error puntual y el botón de guardar queda deshabilitado hasta corregirlo.
    - Ya existe una canción con título+artista muy similar → el sistema advierte, pero permite continuar.
- **Postcondiciones:** La versión queda visible de inmediato en el catálogo, sin revisión previa.

### Caso de uso: Revisar versión pendiente

- **Actor principal:** Administrador
- **Precondiciones:** Existe al menos una versión en estado **Pendiente de revisión**.
- **Flujo principal:**
    1. El administrador abre la vista/lista de versiones **Pendientes**.
    2. Selecciona una versión para revisarla.
    3. El sistema muestra el detalle de la versión (ChordPro y/o vista renderizada), junto con acciones **Aprobar** y **Rechazar**.
    4. El administrador elige **Aprobar** o **Rechazar**.
    5. El sistema actualiza el estado de la versión y registra la decisión (estado + fecha + revisor).
- **Flujos alternativos:**
    - La versión deja de estar pendiente (ya fue revisada) mientras está abierta → el sistema informa y bloquea la acción para evitar doble revisión.
    - El administrador no tiene permisos → el sistema deniega la acción (403) sin cambiar el estado.
- **Postcondiciones:** La versión queda en **Verificada** o **Rechazada** y ya no aparece en la lista de pendientes.

---

## 6️⃣ Flujos críticos narrados

**Flujo: Buscar → ver → transportar (flujo principal, máx. 3 clics)**

1. El usuario escribe un texto en el buscador (sin necesidad de sesión).
2. El sistema muestra canciones coincidentes.
3. El usuario selecciona una canción (clic 1).
4. Si hay varias versiones, el usuario elige la versión correcta (clic 2).
5. El sistema muestra la letra con acordes en el tono original.
6. El usuario elige el tono destino en el selector (clic 3).
7. El sistema muestra la versión transportada al nuevo tono.

**Flujo: Ver en grados**

1. El usuario ya está viendo una versión (en su tono original o transportada), renderizada como línea de acordes encima de la letra.
2. Activa la opción "ver en grados".
3. El sistema convierte el ChordPro subyacente a grados respecto al tono activo en pantalla, y vuelve a renderizarlo como línea de grados encima de la letra.
4. El usuario puede volver a "ver en notas" en cualquier momento, y el sistema reconvierte y renderiza correctamente.

**Flujo: Aportar una versión nueva**

1. El usuario inicia sesión (si no lo ha hecho).
2. Busca la canción base o confirma que no existe.
3. Completa tono original y empieza a escribir la letra+acordes en formato ChordPro.
4. A medida que escribe, ve la vista previa renderizada actualizarse en tiempo real (al lado del textarea si la pantalla es ancha, debajo si es angosta).
5. Si en algún punto el texto tiene un error de sintaxis, la vista previa lo señala puntualmente y el guardado queda bloqueado hasta corregirlo.

**Flujo: Revisión de una versión aportada**

1. El músico (autenticado) guarda una canción o versión nueva → el sistema la registra en estado **Pendiente de revisión** y la deja visible solo para el autor con su etiqueta de estado (RN-014/RN-015).
2. El administrador abre la lista de **Pendientes** y selecciona la versión aportada.
3. El sistema muestra el detalle de la versión para revisión (contenido ChordPro y vista renderizada).
4. El administrador decide **Aprobar** o **Rechazar**.
5. El sistema actualiza el estado a **Verificada** o **Rechazada** y la elimina de la lista de pendientes.
6. El autor vuelve a su sección de aportes (o reabre la canción) y ve que la etiqueta de estado cambió según la decisión del administrador (RN-015).

---

## ✅ Gate Fase 2 (autoevaluación)

- [x]  ¿Cada funcionalidad del MVP tiene una historia de usuario? (HU-01 a HU-09 cubren las 7 funcionalidades del MVP de Fase 1; HU-10 añade la vista previa en tiempo real como parte del flujo de aportar contenido)
- [x]  ¿Todas las historias tienen criterios de aceptación verificables?
- [x]  ¿Las reglas de negocio importantes están documentadas? (RN-001 a RN-017)
- [x]  ¿Los escenarios de error relevantes fueron considerados?
- [x]  ¿Solo existen casos de uso donde realmente aportan valor? (login, transportar, agregar contenido — los 3 con más ramificaciones)
- [x]  ¿Los flujos críticos pueden seguirse paso a paso?
- [x]  ¿Un desarrollador podría implementar el sistema sin adivinar el comportamiento esperado? (RN-009/RN-009b definen almacenamiento en ChordPro y renderizado como línea de acordes encima de la letra)
- [x]  ¿Todo el documento puede entenderse sin hablar de tecnologías?

# 🧩 Fase 3 · Modelo de Dominio

## 1️⃣ Glosario de términos

| Término | Definición |
| --- | --- |
| **Canción** | Obra musical base, identificada por título y artista, que agrupa una o más versiones. |
| **Versión** | Variante de una canción con su propio tono original, contenido en ChordPro y estado de revisión. Pertenece siempre a una única canción. |
| **Tono** | Nota musical que sirve de referencia para transportar o convertir a grados los acordes de una versión. |
| **Grado** | Representación numérica (sistema Nashville) de un acorde, calculada respecto al tono activo en pantalla. No se almacena: se calcula cada vez. |
| **ChordPro** | Formato de almacenamiento donde el acorde va entre corchetes, inmediatamente antes de la sílaba donde se toca. |
| **Usuario** | Persona autenticada (cuenta local o Google), con un rol asignado (músico o administrador). |
| **Estado de revisión** | Situación de una versión dentro de su ciclo de aprobación: Pendiente de revisión, Verificada o Rechazada. |
| **Favorito** | Marca que un usuario asigna a una versión específica para encontrarla rápido después. |

> **Nota:** *Acorde* y *Grado* no son entidades persistidas — son valores calculados por el renderizador a partir del ChordPro almacenado (RN-009b).
> 

---

## 2️⃣ Entidades y agregados

**Entidad: Usuario** *(tabla real: `users`, modelo Prisma `User`)*

- **Atributos:** `id`, `username`, `email`, `metodoAutenticacion`, `password`, `googleId`, `rol`, `fotoPerfilUrl`, `creadoEn`, `eliminadoEn`.
- **Reglas invariantes:**
    - 🚧 Correo único en el sistema (RN-007) — validado en código, sin `@unique` en BD.
    - ✅ Todo usuario tiene exactamente un rol.
    - ✅ Borrado lógico revoca acceso, conserva versiones Verificadas y Favoritos (RN-018).
- **Eventos clave:** creado (registro local ✅; login con Google ⏳ no implementado).

Notas: el plan original usaba `nombre`/`correo`/`password_hash`; el código usa `username`/`email`/`password`. `email` es nullable. Ni `email` ni `googleId` tienen `@unique` en la base de datos todavía.

**Entidad: Canción** *(tabla real: `canciones`, modelo Prisma `Cancion`)*

- **Atributos:** `id`, `titulo`, `artista`, `creadoEn`, `eliminadoEn`, y `estado` (campo nuevo, no en el diseño original).
- **Reglas invariantes:**
    - 🚧 Título+artista sin duplicado exacto (RN-010): no forzado en BD, sin advertencia real todavía.
    - 🚧 Solo visible en catálogo público si tiene versión Verificada — no implementado.
- **Eventos clave:** creada (al aportar su primera versión).

Notas: `estado` usa el mismo enum `Estado` que Versión, default `pendiente`, pero ningún endpoint lo asigna ni lo usa — es un campo sin lógica funcional todavía. Queda pendiente decidir si Canción tendrá su propio ciclo de aprobación o si el campo se elimina. `GET /canciones/{id}` hoy devuelve todas las versiones no eliminadas sin filtrar por estado.

**Entidad: Versión** *(tabla real: `versiones`, modelo Prisma `Version`)*

- **Atributos:** `id`, `cancionId`, `autorId`, `tonoOriginal`, `contenidoChordpro`, `estado`, `creadoEn`, `revisadoEn`, `eliminadoEn`. *(`revisorId` ya no existe, ver nota.)*
- **Reglas invariantes:**
    - ✅ Pertenece exactamente a una canción (RN-001).
    - ✅ Tono original fijo, no cambia tras crearse (RN-002).
    - ⏳ ChordPro válido con tipos de acorde soportados (RN-005/RN-009) — no implementado.
    - 🚧 Nace Pendiente, salvo autor administrador → Verificada — solo la primera mitad implementada.
    - 🚧 Estado no verificado visible solo para el autor (RN-015) — no implementado.
    - ✅ Borrado lógico independiente del estado de revisión.
    - 🚧 Versión eliminada deja de verse en catálogo/favoritos (RN-019) — implementado vía flujo de dos pasos.
- **Eventos clave:** creada, aprobada, rechazada, 🚧 eliminación solicitada, 🚧 eliminación confirmada.

Notas: el enum `estado` real tiene 5 valores, no 3: `pendiente`, `verificada`, `rechazada`, `pendienteEliminacion`, `eliminada` — los dos últimos son parte del flujo real de eliminación de versión (RN-019/RN-019b). El campo `revisorId` se agregó en la migración inicial y fue eliminado deliberadamente poco después: hoy no se registra qué administrador aprobó/rechazó una versión, solo la fecha `revisadoEn`.

**Entidad: Favorito** *(tabla real: `favoritos`, modelo Prisma `Favorito`)*

- **Atributos:** `userId` (campo real de `usuario_id`), `versionId`, `creadoEn`.
- **Reglas invariantes:** ✅ idempotente por usuario (RN-006); 🚧 "solo versiones Verificadas" — no validado.
- **Eventos clave:** agregado, eliminado.

Notas: `POST /favoritos` valida que la versión exista y no esté eliminada, pero no valida que su `estado` sea `verificada` — se podría marcar como favorita una versión Pendiente o Rechazada.

---

## 3️⃣ Relaciones y cardinalidades

```
Usuario 1—N Versión (como autor)
Canción 1—N Versión
Usuario N—N Versión (a través de Favorito)
```

> 🚧 La relación "Usuario 1—N Versión (como revisor)" del diseño original ya no existe: el campo `revisor_id` fue removido del schema (ver nota en la entidad Versión arriba). Si se quiere volver a auditar quién aprobó/rechazó cada versión, hay que reintroducir ese campo.

- Un usuario puede aportar muchas versiones; cada versión tiene exactamente un autor.
- 🚧 Actualmente **no se registra** qué administrador revisó una versión — solo queda la fecha de revisión (`revisado_en`) y el estado resultante.
- Una canción puede tener muchas versiones; cada versión pertenece a una única canción.
- Un usuario puede marcar muchas versiones como favoritas, y una versión puede ser favorita de muchos usuarios.

---

## 4️⃣ Estados y transiciones (entidad crítica: Versión)

```
(creación por músico) → Pendiente de revisión
(creación por administrador) → Verificada  [diseñado como directo; NO implementado todavía — hoy toda versión nace Pendiente sin importar el rol del autor]

Pendiente de revisión → administrador aprueba → Verificada
Pendiente de revisión → administrador rechaza → Rechazada

Verificada → (estado final respecto a revisión, no vuelve a Pendiente ni a Rechazada)
Rechazada → (estado final en el MVP; no hay reenvío ni edición contemplados)

--- 🚧 Transiciones reales adicionales (implementadas, diseño no confirmado como definitivo) ---

Pendiente | Verificada | Rechazada → (autor solicita eliminar, PATCH /versiones/{id}) → Pendiente de eliminación
Pendiente de eliminación → (administrador confirma, DELETE /versiones/{id}) → Eliminada [+ eliminado_en]
```

---

## ✅ Gate Fase 3

- [x]  ¿Todos los términos tienen una definición única y clara?
- [x]  ¿Cada entidad tiene atributos esenciales y reglas de negocio documentadas?
- [x]  ¿Las relaciones entre entidades están descritas sin ambigüedad?
- [x]  ¿Las entidades críticas tienen estados y transiciones definidos?
- [x]  ¿Alguien puede leer el modelo completo en menos de 5 minutos sin necesitar un diagrama?
- [x]  ¿El número de entidades sigue siendo coherente con el MVP (4–8)? → 4 entidades: Usuario, Canción, Versión, Favorito.

# 🗄️ Fase 4 · Datos y Persistencia

## 1️⃣ Modelo lógico

> **Nota general:** las tablas siguientes muestran el nombre lógico original del documento y, entre paréntesis, el nombre real de la columna en el código/schema actual cuando difiere. ✅ = coincide con el diseño e implementado; 🚧 = implementado con diferencias; ⏳ = diseñado pero no implementado/forzado aún.

### Entidad: Usuario *(tabla `users`)*

| Atributo | Tipo lógico | PK/FK | Estado |
| --- | --- | --- | --- |
| id | entero | PK | ✅ |
| nombre (real: `username`) | texto | — | 🚧 |
| correo (real: `email`) | texto | — | 🚧 |
| metodo_autenticacion | enum | — | ✅ |
| password_hash (real: `password`) | texto | — | 🚧 |
| google_id | texto | — | 🚧 |
| rol | enum | — | ✅ |
| foto_perfil_url | texto | — | ✅ |
| creado_en | fecha/hora | — | ✅ |
| eliminado_en | fecha/hora | — | ✅ |

Notas: `nombre`/`correo`/`password_hash` del plan son `username`/`email`/`password` en código. `email` es único solo por validación de código, sin `@unique` en BD (RN-007). `google_id` existe en el schema pero sin lógica de login Google que lo llene, tampoco tiene `@unique`.

### Entidad: Canción *(tabla `canciones`)*

| Atributo | Tipo lógico | PK/FK | Estado |
| --- | --- | --- | --- |
| id | entero | PK | ✅ |
| titulo | texto | — | ✅ |
| artista | texto | — | ✅ |
| estado *(no en el diseño original)* | enum | — | 🚧 |
| creado_en | fecha/hora | — | ✅ |
| eliminado_en | fecha/hora | — | ✅ |

Notas: `estado` usa el mismo enum `Estado` que Versión, default `pendiente`, sin lógica de negocio que lo use todavía (ver Fase 3).

### Entidad: Versión *(tabla `versiones`)*

| Atributo | Tipo lógico | PK/FK | Estado |
| --- | --- | --- | --- |
| id | entero | PK | ✅ |
| cancion_id | entero | FK → Canción | ✅ |
| autor_id | entero | FK → Usuario | ✅ |
| ~~revisor_id~~ | ~~entero~~ | ~~FK → Usuario~~ | ⏳ removido del schema |
| tono_original | texto (10 chars) | — | ✅ |
| contenido_chordpro | texto largo (TEXT) | — | 🚧 |
| estado | enum, 5 valores | — | 🚧 |
| creado_en | fecha/hora | — | ✅ |
| revisado_en | fecha/hora | — | ✅ |
| eliminado_en | fecha/hora | — | ✅ |

Notas: `tono_original` es obligatorio e inmutable tras creación (RN-002). `contenido_chordpro` es obligatorio y no vacío, pero no valida sintaxis ChordPro ni tipos de acorde (RN-005/RN-009). El enum `estado` real tiene 5 valores: `pendiente`, `verificada`, `rechazada`, `pendienteEliminacion`, `eliminada` (no 3 como el plan original) — default `pendiente`; el default a `verificada` cuando el autor es administrador (RN-014) no está implementado.

### Entidad: Favorito *(tabla `favoritos`)*

| Atributo | Tipo lógico | PK/FK | Estado |
| --- | --- | --- | --- |
| usuario_id (real: `user_id`) | entero | PK compuesta / FK → Usuario | ✅ |
| version_id | entero | PK compuesta / FK → Versión | ✅ |
| creado_en | fecha/hora | — | ✅ |

Notas: la PK compuesta (usuario_id, version_id) garantiza la idempotencia de RN-006. "Solo referencia versiones Verificadas" no está validado: `POST /favoritos` solo verifica que la versión exista y no esté eliminada, no que su estado sea `verificada`.

---

## 2️⃣ Modelo físico (borrador)

- **Motor de base de datos:** ✅ PostgreSQL vía Neon, usando **Prisma ORM v7** con `@prisma/adapter-pg` (driver adapter, sin motor binario) — coincide con lo decidido en Fase 0/5.
- **Índices sugeridos (diseño original):**
    - `Usuario.correo` (real: `email`) — único, parcial (`WHERE metodo_autenticacion = 'local'`) — RN-007. ⏳ **no creado** en el schema actual.
    - `Usuario.google_id` — único, parcial (`WHERE metodo_autenticacion = 'google'`). ⏳ **no creado**.
    - `Canción(titulo, artista)` — no único, para búsqueda (HU-02) y detección de duplicados (RN-010, advertencia). ⏳ **no creado** (la búsqueda actual hace `contains` sin índice dedicado).
    - `Versión.cancion_id` — para listar versiones de una canción (HU-03). ⏳ **no creado** (existe el índice implícito de la FK, pero no un `@@index` explícito).
    - `Versión.estado` — para listar pendientes rápido (HU-11 / RN-016). ⏳ **no creado**.
    - `Versión.autor_id` — para la sección "mis aportes". ⏳ **no creado**.
    - 🚧 **Nota:** el schema actual (`prisma/schema.prisma`) no declara ningún `@@index` explícito en ningún modelo — solo existen las claves primarias y foráneas automáticas. No es crítico con el volumen de datos actual, pero conviene agregarlos antes de escalar el catálogo (riesgo documentado en Fase 1 §6).
- **Política de borrado:**
    - ✅ **Canción, Versión y Usuario:** borrado lógico (`eliminado_en`), usado consistentemente en los queries (filtran `eliminadoEn: null`).
    - ✅ **Favorito:** borrado físico (DELETE real).
- **Retención y backups:**
    - ⏳ Export manual **semanal**, adicional al mecanismo propio de Neon — **no configurado todavía** (no hay script en `scripts/` ni automatización).
    - ⏳ Se guarda en **Google Drive** (u otro cloud storage equivalente) — pendiente.

---

## 3️⃣ Gestión de archivos y medios

- ✅ **Qué se almacena en Postgres:** todo el contenido textual — letra, acordes en ChordPro (como texto plano, sin parsear) y metadatos de canciones/versiones/usuarios.
- ✅ **Qué se almacena externamente:** únicamente la **foto de perfil del Usuario**, en Cloudinary. Canciones, versiones y artistas **no tienen imagen** en el MVP.
- ✅ **Metadatos en la base de datos:** solo la URL del recurso (`foto_perfil_url`), nunca el archivo ni una ruta local absoluta.
- ✅ **Tamaños máximos permitidos:** 10 MB por imagen de perfil (validado en `POST /api/v1/usuarios/me/foto`).
- ✅ **Convención de nombres:** se usa `public_id: user_{usuario_id}` con `overwrite: true` al subir a Cloudinary (no el nombre original del archivo).
- 🚧 **Estructura en Cloudinary:** carpeta real **`pentcord_imagenes/perfiles/`** — difiere de lo planeado originalmente (`/usuarios/{usuario_id}/perfil`).
- ✅ **Validaciones al subir:** tipo MIME real de imagen, tamaño ≤ 10 MB.
- **Limpieza de archivos huérfanos:** no aplica de forma crítica — al ser borrado lógico de Usuario, la imagen puede quedar en Cloudinary sin necesidad de limpieza inmediata (no hay canciones/versiones con imagen que huerfanar).

---

## 4️⃣ Trazabilidad con el Modelo de Dominio

- [x]  Entidades y relaciones coinciden con la Fase 3: **Usuario, Canción, Versión, Favorito** — sin cambios.
- [x]  Cada entidad de la Fase 3 tiene su ficha lógica aquí.
- [x]  Cada regla invariante de la Fase 3 tiene su restricción equivalente:
    - RN-001 (Versión pertenece a una Canción) → `cancion_id` FK obligatorio.
    - RN-002 (tono original inmutable) → `tono_original` sin mecanismo de edición tras creación. ✅
    - RN-005 / RN-009 (ChordPro válido, tipos de acorde soportados) → validación a nivel de aplicación sobre `contenido_chordpro`. 🚧 el validador existe (`parsearChordPro`), falta llamarlo desde el endpoint que guarda.
    - RN-006 (favorito idempotente) → PK compuesta (usuario_id, version_id). ✅
    - RN-007 (correo único) → índice único parcial en `Usuario.correo`. 🚧 solo validado en código, sin índice único en BD.
    - RN-010 (título+artista sin duplicado exacto, advertencia) → índice no único + validación de advertencia en aplicación. ⏳ pendiente.
    - RN-014 / RN-015 / RN-016 / RN-017 (ciclo de vida de estado) → campo `estado` + `revisado_en`. 🚧 `revisor_id` fue removido del schema, ya no forma parte de la trazabilidad.
- [x]  Ninguna entidad nueva apareció aquí que no estuviera ya en la Fase 3, **excepto** el campo `estado` agregado a Canción (no una entidad nueva, pero sí un campo fuera del diseño original de Fase 3, actualizado ahí retroactivamente).

---

## ✅ Gate Fase 4

- [x]  ¿Cada entidad tiene atributos con tipo lógico y restricciones claras?
- [x]  ¿Las relaciones están documentadas sin ambigüedad?
- [x]  ¿Cada regla invariante de la Fase 3 tiene su restricción equivalente aquí?
- [x]  ¿Existe una decisión inicial de motor de base de datos, índices y política de borrado?
- [x]  ¿La frecuencia y el destino de los backups están definidos?
- [x]  ¿La política de archivos está definida?
- [x]  ¿Puedes explicar en menos de 3 minutos cómo y dónde se guardan los datos?
- [x]  ¿Ninguna entidad nueva apareció aquí que no estuviera ya en la Fase 3?

# 🏗️ Fase 5 · Arquitectura y Contratos de API

## 1️⃣ Contenedores del sistema

| Contenedor | Responsabilidad | Protocolo | Depende de |
| --- | --- | --- | --- |
| App Next.js (frontend + backend) | Renderiza la UI (App Router) y expone la API vía Route Handlers. Un único despliegue en Vercel. | HTTP/JSON (páginas) + REST/JSON (`/api/v1/...`) | Neon (Postgres), Cloudinary |
| Neon (PostgreSQL) | Persistencia de Usuario, Canción, Versión, Favorito | SQL (conexión desde los Route Handlers) | — |
| Cloudinary | Almacenamiento de fotos de perfil (`foto_perfil_url`) | HTTPS (API de Cloudinary) | — |
| Google OAuth | Autenticación federada (login con Google) | HTTPS/OAuth 2.0 | — |

> Solo 4 contenedores: no hay un "backend" separado — Next.js hace de frontend y de backend en el mismo proceso/despliegue (Vercel).
> 

---

## 2️⃣ Componentes internos (solo backend/dominio)

> 🚧 **Estado: el dominio musical ya existe; el resto de la separación en capas no.** `src/domain/musica/` está construido y probado (ver más abajo). Lo que sigue sin existir es la capa de servicios: cada `route.ts` bajo `src/app/api/v1/...` llama a Prisma (`src/lib/prisma.ts`) directamente e inline, y la validación de sesión/rol se repite copiada en cada endpoint que la necesita (vía `src/lib/getUserFromToken.ts`), en vez de un middleware o helper central `requireAdmin()`.

- **Route Handlers (`src/app/api/v1/.../route.ts`):** ✅ existen y reciben la petición HTTP; 🚧 validan sesión/JWT y rol llamando a `getUserFromToken` (no hay capa de servicios detrás — llaman a Prisma directamente). No contienen lógica musical (porque no existe).
- **Servicios:** ⏳ no existen — los casos de uso ("crear versión", "aprobar versión", "marcar favorito") están implementados directamente dentro de cada Route Handler.
- **Dominio (módulo TS puro, sin dependencias de Next.js ni de la base de datos):** ✅ `src/domain/musica/`, construido en 2026-08-23. Ni una importación de `next`, `@prisma/client` ni `react`, así que se puede importar igual desde el cliente y desde un route handler.
    - `notas.ts` — clases de pitch, los 12 tonos y la ortografía por tonalidad (RN-002). ✅
    - `acordes.ts` — parser/formateador de acordes (RN-005). ✅
    - `chordpro.ts` — parser de ChordPro con errores situados (RN-009, RN-013). ✅
    - `transporte.ts` — transportador (RN-003, RN-004). ✅
    - `grados.ts` — conversor acorde ↔ grado (RN-004). ✅
    - `render.ts` — renderizador, letra con la línea de acordes/grados encima (RN-009b). ✅
    - `tipos.ts` / `index.ts` — contrato público.
    
    Se importa **tanto en el cliente (vista previa en tiempo real, HU-10, y transporte sin red, HU-05) como en el servidor** (revalidar el ChordPro al guardar), evitando una llamada de red para transportar o previsualizar.

### El dominio musical por dentro

**Todo es aritmética, el nombre se decide al final.** Al parsear, un acorde deja de ser texto y pasa a ser `{ raiz: 0–11, calidad, bajo }`. El documento queda así **sin ortografía**: transportar es sumar semitonos, y si el semitono 1 se escribe `Db` o `C#` lo decide la tonalidad en el momento de pintarlo, no el texto que se guardó.

**Ortografía dependiente de la tonalidad.** La dirección la marca la armadura: `F`, `Bb`, `Eb`, `Ab` y `Db` se escriben con bemoles; los otros siete tonos, con sostenidos. Se tomó a propósito la variante **práctica** sobre la estricta: nunca se escriben `E#`, `B#`, `Fb` ni `Cb`, aunque la teoría los pida (F# mayor lleva `E#` en el séptimo grado, y aquí se lee `F`). De **entrada** sí se aceptan: quien aporte `[E#]` obtiene el acorde correcto, escrito luego como corresponda.

**Notación de grados (sistema numérico tipo Nashville).** Número + sufijo, y opcionalmente `/` + número para el bajo:

| Escrito | Significa | En tono de C |
| --- | --- | --- |
| `1` | primer grado, mayor | `C` |
| `6m` | sexto grado, menor | `Am` |
| `57` | quinto grado, séptima dominante | `G7` |
| `1maj7` | primer grado, séptima mayor | `Cmaj7` |
| `6m7` | sexto grado, séptima menor | `Am7` |
| `4sus4` | cuarto grado, sus4 | `Fsus4` |
| `b7` | séptimo grado bemol, mayor | `Bb` |
| `1/3` | primer grado con el bajo en el tercero | `C/E` |

El número es siempre **un solo dígito del 1 al 7**, tomado de la escala mayor de la tónica; los grados de fuera de la escala llevan `b` delante (`b2`, `b3`, `b5`, `b6`, `b7`). Por eso `57` no es ambiguo: el `5` es el grado y el `7` es la calidad. De salida los cromáticos siempre se escriben con bemol; de entrada se acepta también el sostenido (`#4` = `b5`).

**Directivas de sección: lista blanca cerrada y solo en español.** Se admiten ocho, entre llaves y solas en su línea: `{intro}`, `{verso}`, `{precoro}`, `{coro}`, `{puente}`, `{interludio}`, `{solo}`, `{final}`. Cualquier otra llave —incluidos los metadatos ingleses que traen otras aplicaciones, como `{title: …}`— es un error de sintaxis con línea y columna. Es una decisión deliberada: la aplicación es de una sola lengua.

**El parser nunca lanza.** Acumula los errores en una lista y devuelve las líneas legibles igualmente. Es la condición de RN-013: mientras el músico escribe, el texto pasa por estados inválidos (un corchete a medio cerrar) y la vista previa tiene que señalar el punto exacto sin romperse ni quedarse congelada. Las cuatro clases de error son `corchete-sin-cerrar`, `corchete-vacio`, `acorde-no-reconocido` y `directiva-no-reconocida`, todas con `linea` y `columna` 1-based.

**Solapamiento de acordes largos.** Si el nombre del acorde mide más que la sílaba que lleva debajo, el renderizador rellena esa sílaba con espacios hasta dejar al menos uno de separación. Se resuelve en el dominio y no en el CSS para que el mismo resultado valga en pantalla, en un volcado a texto plano y en el servidor.

**Precisión verificada.** La suite exhaustiva cubre 12 tonos × 7 calidades × 12 grados = **1008 acordes**, comprobados contra una tabla de teoría musical escrita a mano, sobre la cadena completa (parsear → transportar → renderizar); más el I-IV-V-vi de las doce tonalidades y la ida y vuelta acorde↔grado sin pérdida. Es el criterio No-Go de Fase 0 §8.

**Rendimiento medido** con `performance.now()` sobre una canción de 40 líneas, 20 corridas tras calentamiento, contra el límite de 100 ms de HU-04/HU-05:

| Operación | Promedio | p95 |
| --- | --- | --- |
| Abrir la versión (parsear + renderizar) | 0,17 ms | 0,34 ms |
| Cambiar de tono (documento ya parseado) | 0,02 ms | 0,02 ms |
| Ver en grados | 0,03 ms | 0,09 ms |

Tres órdenes de magnitud de margen: el presupuesto de los 100 ms se lo va a gastar entero la pintura del navegador, no el dominio.
    
- **Repositorios:** ⏳ no existen como capa separada — el acceso a Neon vía Prisma se hace inline en cada Route Handler.

---

## 3️⃣ Vistas de secuencia (3 casos críticos)

> Las siguientes secuencias describen el **flujo objetivo** (incluyendo UI y dominio, que no existen aún). Las notas 🚧/⏳ marcan qué parte de cada paso ya funciona hoy solo a nivel de API.

**Flujo: Buscar → ver → transportar**

1. 🚧 El usuario escribe en el buscador → `GET /api/v1/canciones?titulo=...&autor=...` (🚧 parámetros reales `titulo`/`autor`, no `q` como se pensó originalmente; implementado con paginación `page`/`limit`, default `limit=9`, y sugerencia de artistas; sin UI).
2. ✅ El Route Handler consulta Prisma directamente (no hay repositorio separado), que busca en Neon por título/artista.
3. ✅ Responde la lista de canciones coincidentes.
4. 🚧 El usuario abre una canción → `GET /api/v1/canciones/{id}` — **hoy trae TODAS las versiones no eliminadas sin filtrar por estado ni por autor** (RN-015 no enforced), no solo las Verificadas + las propias.
5. 🚧 El usuario elige una versión → `GET /api/v1/versiones/{id}` (trae el ChordPro crudo + tono original; payload mínimo, sin `id`/`estado`/`autor`).
6. ⏳ El módulo de dominio (cargado en el cliente) renderiza la letra con acordes en el tono original — **no existe**, hoy no hay ninguna forma de ver la canción renderizada.
7. ⏳ El usuario cambia el tono en el selector → el dominio transporta y re-renderiza **en el cliente, sin nueva llamada al servidor** (RN-003, <100 ms) — **no implementado**.

**Flujo: Aportar una versión nueva (con vista previa en tiempo real)**

1. 🚧 El usuario (autenticado) escribe en el textarea de ChordPro — **nota:** la sesión viaja en una **cookie httpOnly (`accesstoken`)**, no en un header `Authorization: Bearer` como describe Fase 6 más abajo; ver nota ahí.
2. ⏳ En cada cambio, el módulo de dominio (en el cliente) valida sintaxis y renderiza la vista previa localmente — **sin llamar al backend** (HU-10, RN-011, RN-013) — **no implementado, no hay UI ni dominio**.
3. ⏳ Si hay error de sintaxis, se resalta el punto exacto y el botón "Guardar" queda deshabilitado — **no implementado**.
4. 🚧 Al guardar, el frontend envía `POST /api/v1/canciones/{id}/versiones` con tono original + ChordPro — endpoint implementado; llamado hoy solo se puede probar directamente contra la API (no hay frontend que lo invoque).
5. ⏳ El servidor **revalida** el ChordPro con el mismo módulo de dominio (nunca confía solo en la validación del cliente) — **no implementado**, el servidor solo valida que el campo no esté vacío.
6. 🚧 Si es válido, se inserta la versión con `estado = pendiente` (el caso `verificada` si el autor es administrador — RN-014 — **no está implementado**, siempre nace `pendiente`).
7. El servidor responde con la versión creada y su estado.

**Flujo: Revisar versión pendiente (administrador)** — 🚧 implementado con diferencias

1. ✅ El administrador abre `GET /api/v1/versiones/pendientes` (requiere rol `administrador`, si no → 403 FORBIDDEN). Nota: la lista solo trae `id` y `autorId`, sin canción ni contenido, y sin paginación.
2. 🚧 Selecciona una y ve su detalle (`GET /api/v1/versiones/{id}`) — el endpoint real no requiere ser administrador ni devuelve `estado`/`autorId`, solo `contenidoChordpro`/`tonoOriginal`.
3. 🚧 Envía `PATCH /api/v1/versiones/{id}/revision` con **`{ estado: "verificada" | "rechazada" }`** — el campo real se llama `estado`, no `decision`, y los valores son los mismos nombres del enum (no "aprobada"/"rechazada").
4. ⏳ El servidor valida que la versión siga en estado `pendiente` (si ya fue revisada por otro admin, responde 409 CONFLICT) — **no implementado**: hoy se puede volver a revisar una versión ya `verificada` o `rechazada` sin error (riesgo para RN-017).
5. 🚧 Actualiza `estado` y `revisadoEn` — **no actualiza `revisor_id` porque ese campo ya no existe en el schema**.
6. ✅ Responde con la versión actualizada; el autor podría verla reflejada la próxima vez que consulte `GET /api/v1/myContributions` (aún sin UI).

---

## 4️⃣ Patrones y decisiones globales

- ✅ **Patrón arquitectónico general:** Monolito con Next.js (App Router) — un único despliegue previsto en Vercel para frontend y backend. 🚧 La lógica de dominio musical en un módulo aislado sigue siendo el plan, pero **no existe todavía** (ver §2).
- 🚧 **Tipo de comunicación:** REST/JSON síncrono vía Route Handlers (`/api/v1/...`) — implementado para todo lo que existe. La transposición y la vista previa **no** viajan por red porque **no existen aún** (cuando se implementen, deberían correr en el cliente según el plan original).
- ✅ **Estrategia de persistencia:** PostgreSQL (Neon) utilizando **Prisma ORM v7** (con `@prisma/adapter-pg`) como capa de acceso a datos.
- 🚧 **Seguridad mínima:** el diseño original decía JWT en header `Authorization: Bearer <token>`; **la implementación real usa una cookie httpOnly (`accesstoken`)** seteada por el servidor en login/registro, leída manualmente del header `cookie` en cada Route Handler (`src/lib/getUserFromToken.ts`) — no se usa el header `Authorization`. HTTPS depende de Vercel (⏳ aún no desplegado). Contraseñas locales hasheadas con **bcryptjs** (variante JS pura de bcrypt), 12 rounds. Cada Route Handler protegido valida rol inline (no hay middleware ni helper centralizado). Login con Google: ⏳ no implementado.
- ⏳ **Dónde corre el sistema:** Vercel (app Next.js completa) + Neon (Postgres) + Cloudinary (fotos de perfil) — sigue siendo el plan; **el proyecto no está desplegado todavía** (desarrollo 100% local).

---

## 5️⃣ Endpoints

> Leyenda: ✅ implementado como está descrito · 🚧 implementado con una ruta/nombre/comportamiento distinto al planeado (se documenta la ruta **real**) · ⏳ planeado, no implementado.

**Autenticación**

- ✅ `POST /api/v1/auth/register` → registrar cuenta local (HU-01, RN-007). Body real: `username`, `email`, `password`.
- ✅ `POST /api/v1/auth/login` → iniciar sesión local, JWT de 15 min en cookie httpOnly `accesstoken` (HU-01). Body real: `email`, `password`.
- ⏳ `POST /api/v1/auth/google` → iniciar/asociar sesión con Google — **no implementado**.
- ⏳ `GET /api/v1/auth/me` → datos del usuario autenticado — **no implementado**.

**Canciones**

- ✅ `GET /api/v1/canciones` → buscar/listar, paginado (`page`, `limit`, default `limit=9`). 🚧 Filtros reales: `?titulo=&autor=` (contains, insensible a mayúsculas) — el plan decía un único parámetro `?q=` (HU-02). Además devuelve `autoresSugeridos` (autocompletado de artistas para prevenir duplicados, no documentado originalmente).
- 🚧 `GET /api/v1/canciones/{id}` → detalle + **todas** las versiones no eliminadas, sin filtrar por estado ni autor (HU-03) — RN-015 no enforced aquí.
- 🚧 `POST /api/v1/canciones` → crear canción + primera versión (HU-08). Respuesta real confirmada: `{ id, titulo, artista, version }`. **Nota técnica:** internamente hace un `fetch` HTTP a `http://localhost:3000/api/v1/canciones/{id}/versiones` (hardcodeado, sin transacción de Prisma) para crear la primera versión — frágil fuera de `localhost:3000`, pendiente de refactor antes de desplegar.

**Versiones**

- ✅ `POST /api/v1/canciones/{id}/versiones` → agregar versión a canción existente (HU-09).
- 🚧 `GET /api/v1/versiones/{id}` → obtener ChordPro + tono original de una versión (HU-04) — payload mínimo (no incluye `id`, `estado`, `autorId` ni datos de canción); público, sin filtrar por estado (RN-015 no enforced).
- 🚧 `PATCH /api/v1/versiones/{id}` *(no estaba en el plan original)* → el propio autor solicita eliminar su versión, pasa a `pendienteEliminacion`. Ver RN-019/RN-019b.
- 🚧 `DELETE /api/v1/versiones/{id}` → **solo administrador** confirma la eliminación (pasa a `eliminada` + `eliminado_en`) — en el diseño original este DELETE lo ejecutaba directamente el dueño de la versión (HU-13, RN-019).
- ✅ `GET /api/v1/versiones/pendientes` → listar pendientes, solo administrador (HU-11). Sin paginación; payload mínimo (`id`, `autorId`).
- 🚧 `PATCH /api/v1/versiones/{id}/revision` → aprobar/rechazar (HU-11, RN-016). Body real: `{ estado: "verificada" | "rechazada" }` (no `decision`/"aprobada"). No valida que el estado actual sea `pendiente` antes de cambiarlo (riesgo para RN-017). Ya no registra `revisor_id`.
- 🚧 `GET /api/v1/myContributions` *(renombrado; el plan decía `versiones/mias`)* → "mis aportes" con su estado (soporta RN-015). Sin paginación, sin incluir datos de la canción.

**Favoritos**

- ✅ `GET /api/v1/favoritos` → listar favoritos del usuario, con canción incluida, ordenados por fecha (HU-07). Sin paginación.
- ✅ `POST /api/v1/favoritos` → agregar favorito `{ versionId }` (HU-07, RN-006, idempotente). Nota: no valida que la versión esté `verificada`.
- 🚧 `DELETE /api/v1/favoritos` *(el plan decía `favoritos/{version_id}` como parámetro de ruta)* → quitar favorito, recibiendo `versionId` en el **body JSON**, no en la URL.

**Perfil**

- ✅ `POST /api/v1/usuarios/me/foto` → subir/actualizar foto de perfil a Cloudinary (≤10 MB — Fase 4).
- ⏳ `GET /api/v1/usuarios/me` → perfil del usuario autenticado — **no implementado** (equivalente a `auth/me`, tampoco existe).
- 🚧 `DELETE /api/v1/usuarios` *(el plan decía `/usuarios/me`)* → eliminar cuenta propia, borrado lógico, conserva versiones verificadas y favoritos (HU-14, RN-018). También borra una cookie `refreshtoken` que en la práctica nunca llega a crearse (código de refresh token comentado).

---

## 6️⃣ Esquemas de request/response

**POST /api/v1/auth/login**

Request:

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| correo | texto | sí |
| password | texto | sí |

> 🚧 **Nota general sobre esta sección:** los ejemplos siguientes muestran los payloads **reales** devueltos por el código hoy (verificados leyendo cada `route.ts`), que difieren notablemente de los ejemplos originales del documento: no hay un campo `token` en el body (el JWT viaja en la cookie `accesstoken`), los mensajes de error usan `message` (rutas de auth) o `error` (resto de rutas) como texto libre — **no existe todavía el catálogo normalizado de códigos** (`VALIDATION_ERROR`, `UNAUTHENTICATED`, etc.) descrito en Fase 5 §7 más abajo.

Response 200 (real, `POST /api/v1/auth/login`):

```json
{ "message": "Inicio de sesión exitoso", "user": { "id": 1, "email": "kevin@mail.com", "username": "kevin" } }
```

*(el JWT no viaja en el body — se setea como cookie httpOnly `accesstoken`, 15 min de expiración)*

Response 401 (real):

```json
{ "message": "Credenciales invalidas" }
```

**POST /api/v1/canciones**

Request (campos reales):

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| titulo | texto | sí |
| artista | texto | sí |
| tono_original | texto | sí |
| contenido_chordpro | texto largo | sí |

Response 201 (✅ confirmado contra el código real):

```json
{ "id": 10, "titulo": "...", "artista": "...", "version": { "id": 55, "estado": "pendiente", "tono_original": "C" } }
```

*(el objeto `version` viene de la llamada interna a `POST /canciones/{id}/versiones`, ver nota técnica en Fase 5 §5)*

Response 400 (ChordPro inválido) — ⏳ **no implementado**: hoy no hay validación de sintaxis ChordPro, solo se rechaza si el campo viene vacío, con un mensaje libre (no el código `VALIDATION_ERROR` ni `linea`/`columna`).

**GET /api/v1/versiones/{id}**

Response 200 (real — payload reducido, sin `id`/`estado`/`cancion_id`):

```json
{ "contenidoChordpro": "[C]Cuando salga el [G]sol", "tonoOriginal": "C" }
```

> ⏳ El transporte y la conversión a grados siguen sin implementarse: hoy la API solo devuelve el ChordPro crudo tal cual se guardó, sin ningún recálculo.
> 

**PATCH /api/v1/versiones/{id}/revision**

Request (🚧 campo real es `estado`, no `decision`):

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| estado | enum ("verificada", "rechazada") | sí |

Response 200 (real — sin `revisor_id`, ya no existe):

```json
{ "message": "Versión verificada", "version": { "id": 55, "estado": "verificada", "revisadoEn": "2026-07-13T10:00:00Z" } }
```

Response 409 (ya revisada): ⏳ **no implementado** — hoy el endpoint permite re-revisar una versión ya `verificada`/`rechazada` sin devolver conflicto.

**POST /api/v1/favoritos**

Request (🚧 campo real es `versionId`, camelCase):

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| versionId | entero | sí |

Response 201 (creado):

```json
{ "message": "Versión agregada a favoritos", "favorito": { "userId": 1, "versionId": 55, "creadoEn": "2026-07-13T10:00:00Z" } }
```

Response 200 (idempotente, RN-006 — ya existía):

```json
{ "message": "La versión ya estaba en favoritos", "favorito": { "userId": 1, "versionId": 55, "creadoEn": "2026-07-13T10:00:00Z" } }
```

**DELETE /api/v1/favoritos** *(el plan decía `favoritos/{version_id}` como parámetro de ruta; la ruta real recibe `versionId` en el body JSON)*

Response 200:

```json
{ "message": "Versión eliminada de favoritos" }
```

**DELETE /api/v1/usuarios** *(la ruta real no lleva `/me`)*

Response 200 (real):

```json
{ "message": "Cuenta desactivada correctamente" }
```

*(borra las cookies `accesstoken` y `refreshtoken` — esta última nunca llegó a crearse, ya que el refresh token está comentado en login/registro)*

---

## 7️⃣ Catálogo único de errores

> ⏳ **Este catálogo es el diseño objetivo — no está implementado todavía.** Hoy cada endpoint devuelve errores como texto libre (`{ "message": "..." }` en las rutas de `auth/*`, `{ "error": "..." }` en el resto), sin un código normalizado (`VALIDATION_ERROR`, `UNAUTHENTICATED`, etc.). Los status HTTP sí se usan de forma razonablemente consistente (400/401/403/404/409/500), pero el body no sigue todavía un formato único. Se recomienda introducir este catálogo antes de que crezca más la superficie de la API, para no tener que migrar muchos endpoints a la vez.

| Código | Nombre |
| --- | --- |
| 400 | VALIDATION_ERROR |
| 401 | UNAUTHENTICATED |
| 403 | FORBIDDEN |
| 404 | NOT_FOUND |
| 409 | CONFLICT |
| 413 | PAYLOAD_TOO_LARGE |
| 500 | INTERNAL_ERROR |

Todos los endpoints deberían usar este mismo catálogo (⏳ pendiente). Los errores de sintaxis de ChordPro (RN-009) se devolverían como `400 VALIDATION_ERROR`, con `linea`/`columna` adicionales para que el frontend resalte el punto exacto (HU-10, RN-013) — depende de que exista el parser de ChordPro, que tampoco existe aún.

---

## 8️⃣ Paginación, orden, filtros y versionado

- 🚧 **Paginación:** implementada solo en `GET /api/v1/canciones` (`?page=&limit=`, respuesta con `data` + `pagination {total, page, limit, totalPages}` — nombres de campos distintos a los planeados `{items, page, limit, total}`). ⏳ **Ausente** en `/versiones/pendientes`, `/myContributions` (antes `/versiones/mias`) y `/favoritos`, pese a ser listados que van a crecer.
- ✅ **Orden por defecto:** `/canciones` filtra por `titulo`/`artista` (`contains`, insensible a mayúsculas); `/favoritos` ordena por `creadoEn desc`. El resto de listados no define un orden explícito documentado en el código revisado.
- 🚧 **Filtros:** `/canciones?titulo=&autor=` (🚧 nombres reales de los parámetros, no `q` como decía el plan original) implementado, pero **sin el índice `(titulo, artista)`** de Fase 4 (no hay `@@index` declarado); `/versiones/pendientes` no tiene filtros adicionales, como se planeó.
- ✅ **Versionado:** todas las rutas reales están bajo `/api/v1/...`, coincide con el plan.

---

## ✅ Gate Fase 5

- [x]  ¿Todos los contenedores y sus responsabilidades están descritos?
- [x]  ¿Documenté componentes internos solo porque el dominio musical lo justificaba (no el CRUD)?
- [x]  ¿Existen al menos 2 vistas de secuencia narradas de punta a punta? (3 incluidas)
- [x]  ¿Las decisiones globales de arquitectura están escritas una sola vez?
- [x]  ¿Cada endpoint mapea a al menos una historia de usuario de la Fase 2?
- [x]  ¿Los requests y responses principales están documentados?
- [x]  ¿Todos los endpoints usan el mismo catálogo de errores?
- [x]  ¿Las reglas de paginación, filtros y versionado están definidas una sola vez?
- [x]  ¿Puedo explicar en menos de 3 minutos cómo fluye un dato de la UI a la BD y de vuelta?

## 🔐 Fase 6 · Seguridad y Operabilidad

### 1️⃣ Autenticación y roles

**Método de autenticación:** 🚧 diseño original: JWT en header `Authorization: Bearer <token>`. **Real:** JWT (HS256, expira en 15 min) emitido tras login/registro local, entregado en una **cookie httpOnly `accesstoken`** (`secure` solo en producción, `sameSite: strict`), leída manualmente del header `cookie` en cada Route Handler protegido. ⏳ Login con Google no implementado. ✅ Buscar y ver canciones/versiones no requiere sesión (RN-008).

| Rol | Puede (resumen) | No puede (resumen) |
| --- | --- | --- |
| Músico | Crear versiones/canciones, favoritas, ver sus aportes, solicitar eliminar sus versiones, eliminar su cuenta | Aprobar/rechazar versiones; eliminar cuenta ajena |
| Administrador | Todo lo del músico + revisar y confirmar eliminación de versiones | Editar contenido de una versión ajena |

Notas de implementación:

- Músico: ✅ crear versiones/canciones y guardar favoritas; 🚧 ver sus propios aportes vía `GET /myContributions` (sin paginación); 🚧 solicitar eliminar sus propias versiones es un flujo de dos pasos, no un DELETE directo; ✅ eliminar su propia cuenta.
- 🚧 "Un músico no puede ver versiones ajenas no verificadas" — hoy **sí puede**: RN-015 no está enforced en `GET /canciones/{id}` ni `GET /versiones/{id}`.
- ✅ Aprobar/rechazar versiones sigue restringido a administrador (RN-016); eliminar cuenta ajena no es posible.
- ✅ Al eliminar su cuenta, las versiones Verificadas y favoritos del usuario quedan intactos (RN-018).
- Administrador: ✅ revisa versiones pendientes y ✅ confirma la eliminación de versiones (`DELETE /versiones/{id}`).
- 🚧 "Los aportes de un administrador nacen directamente Verificados" — **no implementado**: todas las versiones nacen `pendiente` sin importar el rol del autor.
- No existe ningún endpoint de edición de versiones para nadie, músico o administrador.

---

### 2️⃣ Dónde viven los secretos

- [x]  `.env` está en `.gitignore` desde el primer commit (confirmado, y no hay ningún `.env` comprometido en el repo).
- **Procedimiento de rotación:** si un secreto se filtra, se genera un nuevo `JWT_SECRET` manualmente en Vercel; esto invalida todas las sesiones activas de inmediato (los usuarios deben volver a iniciar sesión). *(⏳ el proyecto aún no está desplegado en Vercel, este procedimiento sigue siendo el plan.)*
- [ ]  Existe `.env.example` sin valores reales *(pendiente de crear — sigue sin existir)*

---

### 3️⃣ Protección de datos sensibles

- 🚧 **Hash de contraseñas:** bcrypt (vía la librería `bcryptjs`, no `bcrypt` nativo), pero el código real usa **10 rounds** (`bcrypt.hash(password, 10)` en `auth/register`), no 12 como se había documentado. Sigue siendo ≥10, cumple el gate de Fase 6, pero el número exacto hay que corregirlo aquí.
- ✅ **Convención de nombres de archivos subidos:** se usa `public_id: user_{usuario_id}` que genera la subida a Cloudinary; nunca el nombre original del archivo del usuario.
- ✅ **Otros datos sensibles a proteger:** `JWT_SECRET`, `DATABASE_URL`, credenciales de Cloudinary viven en variables de entorno. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` están planeadas pero ⏳ no se usan en ningún lugar del código todavía (no hay login con Google).

---

### 4️⃣ Amenazas reales (3–5)

| Amenaza | Mitigación planeada | Estado |
| --- | --- | --- |
| Acceso no autorizado a versiones/canciones ajenas | Validar `autor_id` y RN-015 (no Verificadas solo visibles para su autor) | 🚧 Parcial, ver nota |
| Escalar a rol administrador sin serlo | Rol validado server-side en cada endpoint sensible (RN-016) | ✅ Mitigado |
| Subida de imagen de perfil maliciosa o gigante | Validar tipo MIME real y tamaño ≤10 MB | ✅ Mitigado |
| Condición de carrera en registro simultáneo *(riesgo nuevo, no documentado originalmente)* | — | 🚧 Sin mitigar, ver nota |

Notas de implementación:

- **Acceso no autorizado:** la edición no existe (no hay endpoint para editar versiones, así que no hay riesgo ahí), pero la **lectura sí es un gap real hoy**: `GET /canciones/{id}` y `GET /versiones/{id}` no filtran por `estado` ni exigen sesión, así que cualquiera con el id puede leer una versión Pendiente o Rechazada ajena.
- **Escalar a administrador:** el rol se valida siempre en el servidor a partir de los datos del usuario en BD, nunca se confía en un campo `rol` del cliente; `PATCH /versiones/{id}/revision`, `GET /versiones/pendientes` y `DELETE /versiones/{id}` verifican `rol = administrador` y responden 403 si no aplica. La validación está duplicada en cada endpoint en vez de un helper/middleware central, pero funciona.
- **Subida de imagen:** mitigado según lo diseñado; Cloudinary además aplica sus propios límites de cuenta.
- **Condición de carrera en registro:** como `email`/`username` no tienen `@unique` a nivel de base de datos, dos registros concurrentes con el mismo correo podrían pasar ambos la validación en código antes de insertarse, creando usuarios duplicados. Mitigación pendiente: agregar `@unique` en el schema.

---

### 5️⃣ Logging

> ⏳ **Nada de esto está implementado todavía.** El código real solo tiene llamadas puntuales a `console.error(...)` dentro de bloques `catch` en unos pocos endpoints (`auth/login`, `auth/register`, `versiones/[id]`, `versiones/[id]/revision`, `canciones/[id]/versiones`, `usuarios/me/foto`) para depuración — sin niveles, sin formato consistente, y sin registrar los eventos de negocio (logins exitosos, aprobaciones/rechazos, etc.) descritos abajo, que siguen siendo el diseño objetivo.

- ⏳ **Qué se registra (planeado):** inicios de sesión (exitosos y fallidos), creación/edición/eliminación de canciones y versiones, aprobación/rechazo de versiones, errores de la aplicación.
- **Qué NO se registra:** contraseñas, tokens JWT completos, ni el contenido completo del `.env` — esto sigue siendo válido porque ningún log expone estos datos hoy.
- ⏳ **Formato (planeado):** `[timestamp] [nivel] [módulo] mensaje` — no implementado, hoy son `console.error` con mensajes libres.
- ⏳ **Niveles usados (planeado):** `info`/`warn`/`error` — no implementado.
- **Dónde viven:** consola local en desarrollo (⏳ Vercel aún no aplica, no está desplegado).

---

### 6️⃣ Catálogo de configuración

| Variable | ¿Sensible? | Estado |
| --- | --- | --- |
| DATABASE_URL | Sí | ✅ en uso |
| JWT_SECRET | Sí | ✅ en uso |
| JWT_REFRESH_SECRET *(no en el catálogo original)* | Sí | 🚧 sin uso real |
| GOOGLE_CLIENT_ID | No | ⏳ sin usar |
| GOOGLE_CLIENT_SECRET | Sí | ⏳ sin usar |
| CLOUDINARY_CLOUD_NAME | No | ✅ en uso |
| CLOUDINARY_API_KEY | Sí | ✅ en uso |
| CLOUDINARY_API_SECRET | Sí | ✅ en uso |

Notas: `DATABASE_URL` se usa en `src/lib/prisma.ts`; `JWT_SECRET` en `getUserFromToken.ts`/`auth/login`/`auth/register`; `JWT_REFRESH_SECRET` solo aparece en código comentado, no corre en runtime; `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` no se referencian en ningún archivo (login con Google no implementado); las 3 variables de `CLOUDINARY_*` se usan en `src/lib/cloudinary.ts`.

Ninguna de estas variables tiene un default razonable; si falta alguna al iniciar, el sistema debe fallar de inmediato con un mensaje claro, no silenciosamente. ⏳ Esto último no está verificado/probado explícitamente en el código actual.

---

### 7️⃣ Backups y restore

- **Frecuencia:** export manual semanal, además del mecanismo propio de Neon.
- **Dónde se guarda:** Google Drive (u otro cloud storage equivalente).
- **Procedimiento de restore:** se documentará el paso a paso exacto una vez exista la base de datos en Neon y haya datos reales que respaldar.
- [ ]  Restore probado — **No aplica todavía.** Esta prueba requiere tener el proyecto desplegado con datos en Neon. Queda como tarea obligatoria antes de considerar el sistema "en producción" con usuarios reales, no antes de escribir código.

### 8️⃣ Convención de migraciones

- **Numeración:** gestionada automáticamente por **Prisma Migrate** (cada migración se genera con `prisma migrate dev`, con nombre descriptivo, ej. `20260713_init`, `20260714_add_favoritos`).
- **Procedimiento de rollback manual:** si una migración causa problemas en producción, restaurar el backup anterior a esa migración (Neon permite point-in-time recovery además del export semanal); no se define rollback automático de Prisma para producción en el MVP.

---

### ✅ Gate Fase 6

- [x]  ¿Los roles y permisos están definidos, aunque sea uno solo?
- [x]  ¿Todos los secretos viven en `.env`, fuera del repositorio?
- [x]  ¿Las contraseñas se guardan hasheadas con bcrypt ≥10 rounds? (real: 10 rounds vía `bcryptjs`, no 12 como se documentaba antes)
- [x]  ¿Existen entre 3 y 5 amenazas reales, con mitigación documentada?
- [x]  ¿El logging tiene niveles definidos y un formato mínimo?
- [x]  ¿El catálogo de variables de entorno está completo y sin secretos expuestos en código?
- [x]  ¿El backup tiene frecuencia y destino definidos?
- [ ]  ¿Ya probé el procedimiento de restore al menos una vez? → **No, pendiente.**
- [x]  ¿La convención de migraciones está documentada, con rollback manual?

**⚠️ Nota:** el gate no está 100% cerrado. Falta probar la restauración del backup antes de dar por completada esta fase con confianza real.

# 🎨 Fase 7 · UX: Navegación y Flujos de Pantalla

> ⏳ **Estado: 0% construido.** `src/app/page.tsx` está vacío y no existe ninguna otra ruta de página, ni carpeta `components/`, bajo `src/app`. Todo lo que sigue en esta fase es el **diseño objetivo**, no una descripción de algo ya construido — se mantiene tal cual porque sigue siendo el plan vigente para cuando arranque el frontend.

## 1️⃣ Mapa de navegación

```
Inicio (Buscador)
 ├── Detalle de canción (lista de versiones)
 │    └── Detalle de versión (letra + acordes, transportar, ver en grados)
 │
 ├── [Barra de navegación fija: Buscar | Favoritos | Aportar | Perfil]
 │
 ├── Mis favoritos
 │    └── Detalle de versión (misma pantalla que arriba)
 │
 ├── Aportar canción/versión
 │    └── Vista previa en tiempo real (misma pantalla, panel lateral o inferior)
 │
 └── Perfil
      ├── Mis aportes (lista con estado: Pendiente / Verificada / Rechazada)
      │    └── Eliminar versión propia (con confirmación)
      ├── Panel de admin — solo visible si rol = administrador
      │    └── Revisión de versiones pendientes → Aprobar / Rechazar (con confirmación)
      ├── Editar foto de perfil
      ├── Cerrar sesión
      └── Eliminar cuenta (con confirmación)

Login / Registro
 └── Se muestra cuando el usuario intenta una acción que requiere sesión
     (guardar favorito, aportar contenido, entrar a Perfil) sin estar autenticado.
     Al completarlo, regresa a la pantalla donde estaba (no pierde el contexto).
```

**Reglas de la navegación:**

- Buscar y ver canciones/versiones es público, no requiere estar en la barra fija con sesión iniciada.
- La barra de navegación fija (Buscar, Favoritos, Aportar, Perfil) es visible siempre, con o sin sesión. Si el usuario sin sesión toca Favoritos, Aportar o Perfil, se le redirige a Login/Registro sin perder de vista qué intentaba hacer.
- El Panel de admin **no** aparece en la barra fija; solo es visible dentro de Perfil, y solo si el usuario tiene rol `administrador`.

---

## 2️⃣ Flujos de usuario críticos (7)

### Flujo: Buscar → ver → transportar

1. El usuario escribe en el buscador (Inicio).
2. Selecciona una canción de los resultados.
3. Si hay varias versiones, elige la correcta.
4. Ve la letra con acordes en el tono original.
5. Cambia el tono en el selector y ve la versión transportada al instante.

### Flujo: Iniciar sesión / registrarse

1. El usuario intenta una acción que requiere sesión (favorito, aportar, entrar a Perfil).
2. El sistema lo redirige a Login/Registro, recordando la pantalla anterior.
3. Elige "Iniciar con Google" o completa correo/contraseña.
4. Si el login es exitoso, regresa automáticamente a donde estaba e intenta completar la acción original.

### Flujo: Aportar canción/versión (con vista previa)

1. El usuario entra a "Aportar" desde la barra fija.
2. Completa título/artista (si es canción nueva) y tono original.
3. Escribe el ChordPro; ve la vista previa renderizada actualizarse en tiempo real junto al formulario.
4. Si hay un error de sintaxis, la vista previa lo señala en el punto exacto y el botón "Guardar" queda deshabilitado.
5. Al guardar, ve una confirmación de que su aporte quedó en estado "Pendiente de revisión".

### Flujo: Revisar versión pendiente (admin)

1. El administrador entra a Perfil → Panel de admin.
2. Ve la lista de versiones pendientes.
3. Abre una para revisar el contenido.
4. Elige Aprobar o Rechazar.
5. Si elige Rechazar, el sistema pide confirmación explícita antes de aplicar el cambio.

### Flujo: Guardar o quitar un favorito

1. El usuario está viendo una versión.
2. Toca el ícono de favorito.
3. Si no tiene sesión, se le redirige a Login/Registro sin perder la versión que estaba viendo.
4. Si ya tiene sesión, la versión se marca/desmarca como favorita al instante, sin confirmación adicional (no es una acción destructiva).

### Flujo: Eliminar una versión propia

1. El usuario entra a Perfil → Mis aportes.
2. Selecciona una versión propia (en cualquier estado: Pendiente, Verificada o Rechazada).
3. Toca "Eliminar".
4. El sistema muestra un modal de confirmación explicando que la acción es irreversible.
5. Si confirma, la versión se elimina (borrado lógico) y desaparece de "Mis aportes" y del catálogo si estaba Verificada.

### Flujo: Eliminar la cuenta

1. El usuario entra a Perfil → Eliminar cuenta.
2. El sistema muestra un modal de confirmación explicando qué pasará (pierde acceso, sus favoritos y sesión activa; sus versiones ya verificadas y sus favoritos se conservan sin cambios, por si solicita restablecer la cuenta).
3. Si confirma, se cierra la sesión y la cuenta queda eliminada (borrado lógico).

---

## 3️⃣ Estados especiales de la interfaz

- **Vacío:**
    - Búsqueda sin resultados → mensaje neutro invitando a intentar con otro término.
    - Sin favoritos guardados → mensaje invitando a explorar canciones.
    - Sin versiones pendientes (Panel de admin) → mensaje "No hay nada pendiente de revisión".
    - Sin aportes propios (Mis aportes) → mensaje invitando a aportar la primera canción/versión.
- **Error de validación:**
    - ChordPro inválido al aportar → se resalta la línea/posición exacta del error en la vista previa, con mensaje claro (no genérico).
    - Login con credenciales incorrectas → mensaje de error genérico (sin indicar cuál campo falló).
    - Registro con correo ya existente → mensaje indicando que el correo ya está en uso.
- **Confirmación de acciones destructivas:**
    - Rechazar una versión (admin).
    - Eliminar una versión propia (en cualquier estado).
    - Eliminar la cuenta.
    - En todos los casos: modal explícito, texto claro sobre qué se pierde, y la acción solo se ejecuta tras un segundo toque de confirmación (nunca por accidente con un solo tap).

---

## 4️⃣ Accesibilidad mínima

- [ ]  Navegable con teclado (tab, enter, esc)
- [ ]  Foco visualmente identificable
- [ ]  Errores no comunicados solo por color (ej. el error de ChordPro también se indica con texto/ícono, no solo resaltado en rojo)
- [ ]  Imágenes/archivos con texto alternativo (`alt`) — aplica principalmente a la foto de perfil

---

## ✅ Gate Fase 7

- [x]  ¿El mapa de pantallas no tiene rutas ambiguas o pantallas fuera del MVP?
- [x]  ¿Cada acción crítica tiene su flujo narrado paso a paso? (7 flujos)
- [x]  ¿Los estados vacío, error y confirmación están definidos?
- [x]  ¿Existen al menos 3 reglas de accesibilidad escritas? (4 definidas, pendientes de implementar/verificar)
- [ ]  ¿Alguien que nunca vio el proyecto podría navegarlo en papel sin confundirse? *(pendiente de validar con alguien externo)*

## ✅ Fase 8 · Pruebas, Organización y Cierre

### 1️⃣ Plan de pruebas

> ⏳ **Estado: no existe ninguna infraestructura de pruebas todavía.** No hay `jest`/`vitest`/`playwright` ni ninguna librería de testing en `package.json`, no hay script `test`, y no existe ninguna carpeta `tests/`/`__tests__/`/`e2e/`. La tabla siguiente sigue siendo el plan de casos a cubrir, ninguno implementado aún.

| Historia | Caso (Given / When / Then) | Tipo |
| --- | --- | --- |
| HU-01 | Given un usuario registrado con correo/contraseña válidos, When inicia sesión, Then recibe un JWT y accede a la pantalla donde estaba | Flujo completo |
| HU-02 | Given un catálogo con canciones cargadas, When busca por título o artista, Then ve la lista de coincidencias en ≤1 clic desde el buscador | Prueba con base de datos |
| HU-03 | Given una canción con 2+ versiones Verificadas, When abre la canción, Then ve todas las versiones visibles (más las propias en otro estado, si aplica) | Prueba con base de datos |
| HU-04 | Given una versión existente, When la abre, Then se renderiza la letra con línea de acordes encima, en el tono original, en <100 ms | Prueba de lógica pura |
| HU-05 | Given una versión en su tono original, When elige un tono destino distinto, Then los acordes se recalculan correctamente sin alterar el registro almacenado | Prueba de lógica pura |
| HU-06 | Given una versión visible (original o transportada), When activa "ver en grados", Then cada acorde se muestra como grado relativo al tono activo, y puede revertirse a notas sin pérdida de precisión | Prueba de lógica pura |
| HU-07 | Given un usuario autenticado viendo una versión, When toca "guardar favorita" dos veces seguidas, Then queda una sola entrada en su lista (idempotente) | Prueba con base de datos |
| HU-08 | Given un usuario autenticado, When envía título, artista, tono original y ChordPro válido, Then se crea la canción y su primera versión en estado Pendiente | Prueba con base de datos |
| HU-09 | Given una canción existente, When un usuario autenticado agrega una versión con ChordPro válido, Then la versión se asocia a esa canción en estado Pendiente | Prueba con base de datos |
| HU-10 | Given el formulario de aporte abierto, When el usuario escribe un ChordPro con un corchete sin cerrar, Then la vista previa señala el error en la línea/columna exacta sin romperse, y el botón Guardar queda deshabilitado | Prueba de lógica pura |
| HU-11 | Given una versión Pendiente, When el administrador la aprueba o rechaza, Then su estado cambia y deja de aparecer en la lista de pendientes | Prueba con base de datos |
| HU-12 | Given un usuario autenticado, When sube una imagen jpg/png/webp ≤10 MB, Then `foto_perfil_url` se actualiza y se refleja de inmediato | Flujo completo |
| HU-13 | Given una versión propia (en cualquier estado), When confirma "Eliminar", Then queda marcada con `eliminado_en` y desaparece de "Mis aportes" y del catálogo si estaba Verificada | Prueba con base de datos |
| HU-14 | Given un usuario autenticado, When confirma "Eliminar cuenta", Then se marca `eliminado_en` en Usuario, se cierra la sesión, y sus versiones Verificadas y favoritos quedan intactos | Prueba con base de datos |

#### Datos de prueba

1. **Típico:** canción "Cuán Grande Es Él" / artista "Trad." / tono C / ChordPro corto y válido (2 estrofas + coro).
2. **Texto largo:** una versión con 6+ estrofas y coro repetido, para validar renderizado y performance (<100 ms) con contenido extenso.
3. **Duplicado:** intento de crear una canción con el mismo título+artista que una ya existente, para validar la advertencia no bloqueante (RN-010).
4. **ChordPro inválido:** contenido con un corchete sin cerrar (`[C` sin `]`) y un acorde fuera de los tipos soportados (ej. `[Cadd9]`), para validar el error con línea/columna (RN-005, RN-009, RN-013).
5. **Archivo inválido:** un archivo `.pdf` renombrado a `.jpg` y otro `.png` de 15 MB, para validar el rechazo por tipo MIME real y por tamaño (HU-12).

#### Verificación de los NFR (definidos en Fase 0)

| NFR | Cómo se verifica |
| --- | --- |
| Transposición/conversión < 100 ms en navegador | Medir con `performance.now()` alrededor de la llamada al módulo de dominio, sobre una versión de ~40 líneas, 20 corridas, reportando promedio y p95 |
| Sin credenciales expuestas en el código | Revisar que `.env` esté en `.gitignore` desde el primer commit; correr un escáner de secretos (ej. gitleaks) antes de cada release |
| Disponibilidad sin caídas prolongadas | Monitorear el uptime nativo de Vercel; objetivo: 0 incidentes reportados de más de 1 hora en 30 días |
| Flujo principal en máximo 3 clics | Prueba manual cronometrando clics en el flujo "buscar → ver → transportar", en móvil y escritorio |
| Conversión notas↔grados 100% precisa | Suite de pruebas unitarias del módulo `/domain` cubriendo los 12 tonos × todos los tipos de acorde soportados (mayor, menor, 7ª dominante/mayor/menor, sus2/sus4), comparada contra una tabla de teoría musical validada manualmente |

---

### 2️⃣ Estructura del repositorio

> Adaptada al stack real (Next.js App Router como monolito frontend+backend), no a la plantilla genérica de 8 carpetas planas.
> 

**Estructura real actual** (auditada en `c:\dev\pentcord\src`):

```text
src/
├── app/
│   ├── api/v1/
│   │   ├── auth/{register,login}/route.ts
│   │   ├── canciones/route.ts, canciones/[id]/route.ts, canciones/[id]/versiones/route.ts
│   │   ├── versiones/[id]/route.ts, versiones/[id]/revision/route.ts, versiones/pendientes/route.ts
│   │   ├── myContributions/route.ts
│   │   ├── favoritos/route.ts
│   │   └── usuarios/route.ts, usuarios/me/foto/route.ts
│   ├── layout.tsx        (layout por defecto de create-next-app, sin personalizar)
│   └── page.tsx           (⏳ vacío, 0 bytes — sin UI)
├── generated/
│   └── prisma/             (🚧 cliente de Prisma generado y comprometido en el repo, salida custom del generator)
└── lib/
    ├── cloudinary.ts
    ├── getUserFromToken.ts
    └── prisma.ts
```

No existen `components/`, `domain/`, `application/`, `infrastructure/`, `tests/` ni `scripts/`. La estructura en capas de abajo sigue siendo el **plan objetivo**, no lo construido:

```txt
/
├── src
│   ├── app
│   │   ├── (public)
│   │   │   ├── Inicio / buscador
│   │   │   ├── Detalle de canción
│   │   │   └── Detalle de versión
│   │   ├── (auth)
│   │   │   ├── Login
│   │   │   └── Registro
│   │   ├── perfil
│   │   │   ├── Perfil
│   │   │   ├── Mis aportes
│   │   │   └── Panel de administración
│   │   ├── aportar
│   │   │   ├── Formulario
│   │   │   └── Vista previa en tiempo real
│   │   └── api
│   │       └── v1
│   │           ├── auth
│   │           ├── canciones
│   │           ├── versiones
│   │           ├── favoritos
│   │           └── usuarios
│   │
│   ├── domain
│   │   └── Módulo TypeScript puro (sin dependencias de Next.js ni de la base de datos)
│   │       ├── Parser / Validador ChordPro
│   │       ├── Transportador de acordes
│   │       ├── Conversor acorde ↔ grado
│   │       └── Renderizador
│   │
│   ├── application
│   │   └── Servicios / Casos de uso
│   │       ├── crearVersion
│   │       ├── aprobarVersion
│   │       ├── marcarFavorito
│   │       └── ...
│   │
│   ├── infrastructure
│   │   ├── db
│   │   │   ├── Prisma Client
│   │   │   └── Repositorios
│   │   ├── cloudinary
│   │   │   └── Cliente para subida de fotos de perfil
│   │   └── auth
│   │       ├── JWT
│   │       ├── Verificación de sesión
│   │       └── Integración con Google OAuth
│   │
│   ├── components
│   │   └── Componentes UI compartidos (React)
│   │
│   ├── lib
│   │   └── Utilidades transversales
│   │       ├── Formateadores
│   │       ├── Constantes
│   │       └── Catálogo de errores
│   │
│   └── tests
│       ├── domain
│       │   └── Pruebas unitarias del módulo musical (prioridad #1)
│       ├── application
│       │   └── Pruebas de servicios / casos de uso
│       └── e2e
│           └── Flujos críticos de punta a punta
│
├── prisma                          ✅ existe (`schema.prisma` + `migrations/`)
│   ├── schema.prisma
│   └── migrations
│
├── docs                            ⏳ no existe (este documento vive en la raíz del repo, no en `/docs`)
│   └── Documento de planeación y decisiones técnicas
│
└── scripts                         ⏳ no existe
├── Backup manual semanal
└── Seeds de datos de prueba
```

*(`app/`, `domain/`, `application/`, `infrastructure/`, `components/`, `lib/`, `tests/` arriba: ver estado real ⏳/🚧 detallado en el bloque de la estructura real, más arriba.)*

**Por qué esta forma:** `/domain` queda aislado porque se importa tanto en cliente (vista previa en tiempo real, transposición sin red) como en servidor (revalidación), tal como se decidió en Fase 5. El resto sigue la convención estándar de App Router para no pelear contra el framework. *(Sigue siendo la razón de diseño válida — solo que `/domain` y las demás capas todavía no se han creado.)*

---

### 3️⃣ Definition of Ready / Definition of Done

**DoR** — una tarea puede empezar si:

- Tiene su historia de usuario con criterios de aceptación (G/W/T) ya escritos.
- No depende de otra tarea sin terminar ni de una decisión aún abierta.
- Si toca el módulo `/domain`, el caso de prueba correspondiente ya está redactado (Fase 8 §1).
- Está claro qué endpoint(s) de la Fase 5 y qué pantalla(s) de la Fase 7 involucra.

**DoD** — una tarea se considera terminada si:

- El código está en la rama principal (o en un PR aprobado, si se usa ese flujo).
- Las pruebas relacionadas pasan en local (unitarias de `/domain` obligatorias si aplica).
- Si afecta un endpoint, respeta el catálogo único de errores (Fase 5 §7).
- Si afecta transporte o conversión a grados, fue validada contra la suite de precisión (NFR de confiabilidad).
- La documentación mínima (`/docs` o README) quedó actualizada si cambió el comportamiento esperado.

---

### 4️⃣ Sprints iniciales

> 🚧 **El orden real de construcción no siguió este plan.** Se empezó por auth + CRUD de canciones/versiones/favoritos/perfil (lo que este documento llamaba Sprint 2 y 3), sin el núcleo musical del Sprint 1. Hoy no existe todavía ni el parser de ChordPro ni el transportador ni el conversor a grados — la prioridad #1 declarada en Fase 0 sigue sin empezar, mientras que buena parte del backend de los sprints 2 y 3 ya está construida.

- ⏳ **Sprint 1 — Núcleo musical + datos:** construir y validar con pruebas unitarias el parser de ChordPro, el transportador y el conversor a grados; definir el `schema.prisma` con las 4 entidades y correr la primera migración. **El schema y las migraciones sí están hechos** ✅ (aunque con las diferencias de nombres/campos documentadas en Fase 3/4); el parser/transportador/conversor siguen en ⏳.
- 🚧 **Sprint 2 — Flujo público + auth:** login local ✅ implementado (Google ⏳ no), favoritos ✅ implementados; buscar/ver/transportar/ver en grados en la UI **no existe** (⏳ sin frontend, sin dominio musical).
- 🚧 **Sprint 3 — Contribución y administración:** APIs de aportar canción/versión ✅, panel de revisión ✅ (API), foto de perfil ✅, eliminación de versión propia/cuenta 🚧 (implementada con el flujo de dos pasos, ver RN-019) — **todo sin UI ni vista previa en tiempo real** (⏳, depende del dominio musical).

---

### 5️⃣ Decisiones técnicas críticas

| Decisión | Por qué | Alternativa descartada | Fase | Estado |
| --- | --- | --- | --- | --- |
| Monolito Next.js (App Router) para frontend + backend | Un único desarrollador, un único despliegue en Vercel, sin el costo de mantener dos repos/servicios | Backend separado (Express/NestJS) + frontend independiente | Fase 5 | ✅ vigente |
| Módulo `/domain` en TS puro, sin dependencias de framework ni BD | Se reutiliza en cliente y servidor; permite transponer/previsualizar sin llamada de red y cumplir el NFR de <100 ms | Recalcular siempre en el servidor y llamar por API en cada cambio de tono | Fase 5 | ⏳ decidido, no construido |
| PostgreSQL vía Neon + Prisma ORM | Plan gratuito suficiente para el MVP, tipado fuerte, migraciones versionadas | MongoDB (no se necesita flexibilidad de esquema); SQLite (no escala a producción en Vercel) | Fase 4/5 | ✅ implementado — 🚧 con un matiz: se usa **Prisma v7 con `@prisma/adapter-pg`** (driver adapter sin motor binario), decisión técnica más específica no registrada originalmente aquí |
| ChordPro como formato único de almacenamiento | Formato estándar y compacto para representar acorde+sílaba con precisión, evita recalcular espacios a mano | Guardar el acorde con posición en JSON custom | Fase 2 | 🚧 se guarda como texto plano; el formato no se valida ni se parsea todavía |
| JWT en header `Authorization` | Stateless, simple de validar en cada Route Handler, sin infraestructura de sesión adicional | Sesiones con cookie + almacenamiento server-side | Fase 6 | 🚧 **cambió en la implementación:** el JWT viaja en una cookie httpOnly (`accesstoken`), no en el header `Authorization` — sigue siendo stateless, pero es una decisión distinta a la registrada aquí, vale la pena confirmar si fue intencional |
| Cloudinary solo para la foto de perfil | Gratuito, no hay canciones/versiones con imagen que justifiquen más | Guardar el archivo en Neon como bytes, o usar S3 | Fase 4 | ✅ vigente |
| Borrado lógico en Usuario/Canción/Versión; borrado físico en Favorito | Preserva contenido verificado recuperable ante eliminación de cuenta; los favoritos no tienen valor histórico propio | Borrado físico total en todas las entidades | Fase 4 | ✅ implementado tal cual |
| 🚧 *(decisión nueva, no registrada originalmente)* `bcryptjs` (implementación JS pura) en vez de `bcrypt` nativo | — *(no documentada; posiblemente para evitar compilación nativa en el entorno de desarrollo/despliegue)* | `bcrypt` (binding nativo) | Fase 6 | ✅ implementado — confirmar si fue una decisión deliberada |

---

### 6️⃣ Checklist final (Go para implementar) — corregido

- [x]  Historias + criterios de aceptación completos (Fase 2)
- [x]  Modelo de dominio con glosario, entidades y estados (Fase 3)
- [x]  Diseño de datos completo (Fase 4)
- [x]  Arquitectura y contratos de API definidos (Fase 5)
- [x]  Checklist de seguridad y operación cubierto (Fase 6) — *restore probado se mueve al checklist de "Go a producción", ver abajo*
- [ ]  UX lista (Fase 7) → sigue pendiente la validación externa del mapa de navegación
- [x]  Plan de pruebas con al menos un caso por historia (Fase 8 §1)
- [x]  Repositorio estructurado, DoR y DoD definidos (Fase 8 §2–3)
- [x]  Decisiones técnicas críticas registradas (Fase 8 §5)
- [x]  Puedo crear el primer sprint sin inventar nada durante la ejecución

#### ✅ Gate Fase 8

- [x]  ¿Cada historia tiene al menos un caso de prueba de aceptación?
- [x]  ¿El repositorio está organizado y sería entendible por un tercero?
- [x]  ¿La DoR y la DoD están definidas y son claras?
- [x]  ¿Existen al menos 2 sprints iniciales con objetivos concretos?
- [x]  ¿Las decisiones críticas están registradas?
- [ ]  ¿El checklist final está completo? → Queda **un solo** pendiente real antes de programar: validar el mapa de navegación de Fase 7 con alguien externo. El resto está cerrado.

### 🚀 Checklist adicional — Go a producción (no bloquea el inicio de desarrollo)

- [ ]  Procedimiento de restore probado al menos una vez, con datos reales en Neon.
- [ ]  Export manual semanal corriendo y verificado.

---

### 📑 Apéndice · Referencia rápida

**A. Plantilla de Historia de Usuario**

> Como `<actor>` quiero `<acción>` para `<valor>`.
> 
> 
> Criterios de aceptación (G/W/T):
> 
> - Given … When … Then …

**B. Errores normalizados**

| Código | Nombre |
| --- | --- |
| 400 | VALIDATION_ERROR |
| 401 | UNAUTHENTICATED |
| 403 | FORBIDDEN |
| 404 | NOT_FOUND |
| 409 | CONFLICT |
| 413 | PAYLOAD_TOO_LARGE |
| 500 | INTERNAL_ERROR |

**C. Política de archivos**

- Ubicación base: Cloudinary — 🚧 carpeta real `pentcord_imagenes/perfiles/` (el diseño original decía `/usuarios/{usuario_id}/perfil`)
- Estructura: un recurso por usuario (`public_id: user_{usuario_id}`), sobrescribible al actualizar (`overwrite: true`) ✅
- Nombre: `public_id` generado por Cloudinary (nunca el nombre original del archivo) ✅
- Límites: imagen de perfil ≤ 10 MB, tipo MIME real jpg/png/webp ✅
- Metadata en DB: solo `foto_perfil_url` (texto), nunca el archivo ni una ruta local ✅

**D. Variables de configuración (.env local)**

```text
# Base de datos
DATABASE_URL=

# Autenticación
JWT_SECRET=
JWT_REFRESH_SECRET=       # 🚧 referenciada solo en código comentado, sin uso real todavía
GOOGLE_CLIENT_ID=         # ⏳ sin uso todavía (login con Google no implementado)
GOOGLE_CLIENT_SECRET=     # ⏳ sin uso todavía

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Ninguna variable tiene un default razonable: si falta alguna al iniciar, el sistema debe fallar de inmediato con un mensaje claro. ⏳ **`.env.example` sigue sin existir en el repo** (ver Fase 6 §2).
