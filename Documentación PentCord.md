# PentCord

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

- Iniciar sesión (cuenta local o con Google).
- Buscar y ver canciones (letra + acordes).
- Ver las distintas versiones de una misma canción.
- Transportar (transponer) los acordes de una canción a cualquier tono.
- Convertir acordes a grados y de grados a acordes.
- Guardar canciones como favoritas/frecuentes.
- Agregar una canción o una versión nueva al catálogo.
- Revisar (aprobar/rechazar) versiones pendientes.
- Subir o editar foto de perfil.
- Eliminar versión propia o cuenta propia (con retención de favoritos/versiones verificadas).

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
| La lógica de transporte/conversión a grados es más compleja de lo previsto (casos especiales: acordes con bajo, sus, add9, etc.) | Alto | Construir y validar esa lógica primero, con una suite de casos de prueba reales, antes de tocar la UI. |
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

| ID | Historia |
| --- | --- |
| HU-01 | Como **músico**, quiero **iniciar sesión con cuenta local o con Google**, para **guardar favoritas y aportar canciones bajo mi identidad**. |
| HU-02 | Como **músico**, quiero **buscar canciones por título/artista**, para **encontrar rápidamente la que necesito antes de un ensayo**. |
| HU-03 | Como **músico**, quiero **ver las distintas versiones de una canción**, para **elegir la que corresponde exactamente a lo que voy a tocar**. |
| HU-04 | Como **músico**, quiero **ver la letra y acordes de una versión específica**, para **seguir la canción mientras toco**. |
| HU-05 | Como **músico**, quiero **transportar los acordes de una versión a cualquier tono**, para **tocarla en el tono que me conviene sin recalcular a mano**. |
| HU-06 | Como **músico**, quiero **convertir los acordes de una versión a grados (Nashville) y viceversa**, para **comunicarme con otros músicos usando números en vez de notas**. |
| HU-07 | Como **músico**, quiero **guardar una canción como favorita**, para **encontrarla rápido la próxima vez sin buscarla de nuevo**. |
| HU-08 | Como **músico**, quiero **agregar una canción nueva al catálogo (con su primera versión)**, para **que esté disponible para mí y para otros músicos**. |
| HU-09 | Como **músico**, quiero **agregar una versión nueva a una canción que ya existe**, para **registrar una variante distinta de letra/acordes que no está en el catálogo**. |
| HU-10 | Como **músico que está aportando contenido**, quiero **ver una vista previa en tiempo real de cómo quedará renderizada mi canción mientras escribo el ChordPro**, para **confirmar que se ve bien antes de subirla, sin tener que guardar primero para revisar**. |
| HU-11 | Como administrador, quiero revisar las versiones pendientes para aprobarlas o rechazarlas, para mantener la calidad del catálogo público. |
| HU-12 | Como **músico**, quiero **subir o cambiar mi foto de perfil**, para **personalizar mi cuenta**. |
| HU-13 | Como **usuario autenticado**, quiero **eliminar una versión propia**, para **quitarla del catálogo si ya no la considero válida**. |
| HU-14 | Como **usuario autenticado**, quiero **eliminar mi cuenta**, para **dejar de usar el sistema, sabiendo que mi contenido verificado se conserva por si quiero restablecerla**. |

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

**RN-001:** Toda versión pertenece exactamente a una canción base (relación padre-hijo).

**RN-002:** Toda versión tiene un tono original fijo, asignado al momento de crearse; este tono no cambia después.

**RN-003:** Transportar o convertir a grados genera una vista distinta, pero nunca modifica el tono original ni la letra+acordes almacenados.

**RN-004:** La conversión acorde↔grado siempre es relativa al tono activo en pantalla (original o transportado), nunca a un tono fijo global.

**RN-005:** Los tipos de acorde soportados en el MVP son: mayor, menor, séptima (dominante, mayor, menor) y suspendido (sus2/sus4). Un acorde fuera de estos tipos se marca como "no reconocido" en vez de fallar silenciosamente.

**RN-006:** Una canción/versión solo puede aparecer una vez en la lista de favoritas de un mismo usuario (guardar una ya guardada es una operación idempotente, no crea duplicados).

**RN-007:** El correo de una cuenta local debe ser único en el sistema.

**RN-008:** Buscar y ver canciones/versiones no requiere autenticación. Guardar favoritas y aportar contenido (canción o versión nueva) sí requieren sesión iniciada.

**RN-009:** La letra+acordes se almacena siempre en formato ChordPro: el acorde va entre corchetes inmediatamente antes de la sílaba donde se toca (ej. `[C]Cuando salga el [G]sol`). Cualquier texto entre corchetes que no corresponda a un acorde válido de los tipos soportados (RN-005) se considera un error de formato al momento de guardar.

**RN-009b:** La visualización nunca muestra el ChordPro crudo al usuario final; siempre se renderiza como línea de acordes encima de la letra. El renderizado es una vista derivada, se recalcula en cada consulta y no se almacena.

**RN-010:** El título de la canción base no necesita ser único (pueden existir canciones con el mismo título de artistas distintos), pero la combinación título+artista sí debería evitar duplicados exactos accidentales (advertencia, no bloqueo, ya que no hay moderación).

**RN-011:** Todo formulario de aportar canción/versión debe mostrar una vista previa renderizada del ChordPro que el usuario está escribiendo, actualizada en tiempo real (sin necesidad de guardar ni de un botón "previsualizar" aparte).

**RN-012:** La ubicación de la vista previa se adapta al ancho de pantalla: al lado del textarea si hay espacio horizontal suficiente, debajo del textarea si la pantalla es angosta (móvil). Es una decisión de layout responsivo, no cambia el comportamiento de fondo.

**RN-013:** Si el texto en edición tiene un error de sintaxis (formato ChordPro inválido o acorde no reconocido según RN-005), la vista previa debe señalar el error en el punto donde ocurre en vez de romperse, mostrar contenido vacío o quedar congelada con la última versión válida.

**RN-014:** Toda versión aportada por un músico nace en estado Pendiente de revisión; una versión aportada por un administrador nace directamente Verificada.

**RN-015:** Solo las versiones en estado Verificada son visibles en el catálogo público; las Pendientes y Rechazadas solo son visibles para su autor.

**RN-016:** Solo un usuario con rol administrador puede aprobar o rechazar una versión Pendiente.

**RN-017:** Una versión Rechazada no puede volver a Pendiente ni ser editada en el MVP (si el músico quiere corregirla, debe crear una versión nueva).

**RN-018:** Eliminar una cuenta es un borrado lógico (`eliminado_en`) que solo revoca el acceso del usuario. Sus versiones en estado Verificada y sus Favoritos NO se eliminan ni se desvinculan; permanecen visibles/funcionales en el catálogo y quedan disponibles para restablecer la cuenta.

**RN-019:** Eliminar una versión propia es un borrado lógico independiente del estado en que se encuentre (Pendiente, Verificada o Rechazada). Si la versión estaba Verificada, deja de ser visible en el catálogo público y en las listas de favoritos de otros usuarios que la hubieran marcado (sin notificarles).

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

**Entidad: Usuario**

- **Atributos:** id, nombre, correo (solo cuentas locales), método de autenticación (local | Google), rol (músico | administrador), foto de perfil (URL), fecha de creación, fecha de eliminación lógica (opcional).
- **Reglas invariantes:**
    - El correo debe ser único en el sistema (RN-007)
    - Todo usuario tiene exactamente un rol.
    - Al marcarse como eliminado (`eliminado_en`), el usuario pierde acceso al sistema, pero sus versiones Verificadas y Favoritos permanecen sin cambios (RN-018).
- **Eventos clave:** creado (registro o primer login con Google).

**Entidad: Canción**

- **Atributos:** id, título, artista, fecha de creación.
- **Reglas invariantes:**
    - Título+artista no debería duplicarse exactamente (advertencia, no bloqueo — RN-010)
    - Una canción solo aparece en el catálogo público si tiene al menos una versión en estado Verificada.
- **Eventos clave:** creada (al aportar su primera versión).

**Entidad: Versión**

- **Atributos:** id, canción_id, autor_id, tono original, contenido (ChordPro), estado (Pendiente de revisión | Verificada | Rechazada), fecha de creación, fecha de revisión, revisor_id (opcional), fecha de eliminación lógica (opcional).
- **Reglas invariantes:**
    - Pertenece exactamente a una canción (RN-001)
    - El tono original es fijo y no cambia tras crearse (RN-002)
    - El ChordPro debe ser válido y usar solo tipos de acorde soportados (RN-005/RN-009)
    - Nace en **Pendiente de revisión** salvo que el autor sea administrador, en cuyo caso nace directamente **Verificada**
    - La etiqueta de estado solo es visible para el autor, el resto de usuarios solo ven versiones en estado Verificada, sin ninguna etiqueta.
    - El borrado lógico de una versión es independiente de su estado de revisión
    - Una versión eliminada deja de ser visible en el catálogo y en favoritos ajenos, sin importar si estaba Verificada, Pendiente o Rechazada (RN-019).
- **Eventos clave:** creada, aprobada, rechazada.

**Entidad: Favorito**

- **Atributos:** usuario_id, versión_id, fecha en que se marcó.
- **Reglas invariantes:** una misma versión solo puede aparecer una vez en los favoritos de un mismo usuario — operación idempotente (RN-006); solo pueden marcarse como favoritas versiones en estado Verificada.
- **Eventos clave:** agregado, eliminado.

---

## 3️⃣ Relaciones y cardinalidades

```
Usuario 1—N Versión (como autor)
Usuario 1—N Versión (como revisor, opcional)
Canción 1—N Versión
Usuario N—N Versión (a través de Favorito)
```

- Un usuario puede aportar muchas versiones; cada versión tiene exactamente un autor.
- Un administrador puede revisar muchas versiones; una versión tiene a lo sumo un revisor (el admin que tomó la decisión), y ninguno mientras está Pendiente.
- Una canción puede tener muchas versiones; cada versión pertenece a una única canción.
- Un usuario puede marcar muchas versiones como favoritas, y una versión puede ser favorita de muchos usuarios.

---

## 4️⃣ Estados y transiciones (entidad crítica: Versión)

```
(creación por músico) → Pendiente de revisión
(creación por administrador) → Verificada  [directo, sin pasar por Pendiente]

Pendiente de revisión → administrador aprueba → Verificada
Pendiente de revisión → administrador rechaza → Rechazada

Verificada → (estado final, no vuelve a Pendiente ni a Rechazada)
Rechazada → (estado final en el MVP; no hay reenvío ni edición contemplados)
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

### Entidad: Usuario

| Atributo | Tipo lógico | PK/FK | Restricción |
| --- | --- | --- | --- |
| id | entero | PK | autoincremental |
| nombre | texto | — | obligatorio, máx 120 caracteres |
| correo | texto | — | único (solo si metodo_autenticacion = local), obligatorio en ese caso — RN-007 |
| metodo_autenticacion | enum ('local', 'google') | — | obligatorio |
| password_hash | texto | — | obligatorio si metodo_autenticacion = local |
| google_id | texto | — | único (solo si metodo_autenticacion = google) |
| rol | enum ('musico', 'administrador') | — | obligatorio, default 'musico' |
| foto_perfil_url | texto | — | opcional (URL a Cloudinary) |
| creado_en | fecha/hora | — | obligatorio, default: ahora |
| eliminado_en | fecha/hora | — | borrado lógico (confirmado) |

### Entidad: Canción

| Atributo | Tipo lógico | PK/FK | Restricción |
| --- | --- | --- | --- |
| id | entero | PK | autoincremental |
| titulo | texto | — | obligatorio, máx 200 caracteres |
| artista | texto | — | obligatorio, máx 200 caracteres (texto plano, no entidad — sin imagen asociada) |
| creado_en | fecha/hora | — | obligatorio, default: ahora |
| eliminado_en | fecha/hora | — | borrado lógico (confirmado) |

### Entidad: Versión

| Atributo | Tipo lógico | PK/FK | Restricción |
| --- | --- | --- | --- |
| id | entero | PK | autoincremental |
| cancion_id | entero | FK → Canción | obligatorio — RN-001 |
| autor_id | entero | FK → Usuario | obligatorio |
| revisor_id | entero | FK → Usuario | opcional, solo se llena al aprobar/rechazar |
| tono_original | texto (12 valores posibles) | — | obligatorio, inmutable tras creación — RN-002 |
| contenido_chordpro | texto largo | — | obligatorio, debe validar sintaxis ChordPro y tipos de acorde soportados — RN-005 / RN-009 |
| estado | enum ('pendiente', 'verificada', 'rechazada') | — | obligatorio; default 'pendiente' si autor.rol = músico, default 'verificada' si autor.rol = administrador — RN-014 |
| creado_en | fecha/hora | — | obligatorio, default: ahora |
| revisado_en | fecha/hora | — | opcional |
| eliminado_en | fecha/hora | — | borrado lógico (confirmado) |

### Entidad: Favorito

| Atributo | Tipo lógico | PK/FK | Restricción |
| --- | --- | --- | --- |
| usuario_id | entero | PK (compuesta) / FK → Usuario | obligatorio |
| version_id | entero | PK (compuesta) / FK → Versión | obligatorio |
| creado_en | fecha/hora | — | obligatorio, default: ahora |

> La combinación (usuario_id, version_id) es la clave primaria compuesta, lo que garantiza de forma nativa la idempotencia de RN-006. Solo puede referenciar versiones en estado `verificada`.
> 

---

## 2️⃣ Modelo físico (borrador)

- **Motor de base de datos candidato:** PostgreSQL vía Neon (decidido en Fase 0, restricción de costo).
- **Índices sugeridos:**
    - `Usuario.correo` — único, parcial (`WHERE metodo_autenticacion = 'local'`) — RN-007.
    - `Usuario.google_id` — único, parcial (`WHERE metodo_autenticacion = 'google'`).
    - `Canción(titulo, artista)` — no único, para búsqueda (HU-02) y detección de duplicados (RN-010, advertencia).
    - `Versión.cancion_id` — para listar versiones de una canción (HU-03).
    - `Versión.estado` — para listar pendientes rápido (HU-11 / RN-016).
    - `Versión.autor_id` — para la sección "mis aportes".
- **Política de borrado:**
    - **Canción, Versión y Usuario:** borrado lógico (`eliminado_en`).
    - **Favorito:** borrado físico (DELETE real).
- **Retención y backups:**
    - Export manual **semanal**, adicional al mecanismo propio de Neon.
    - Se guarda en **Google Drive** (u otro cloud storage equivalente).

---

## 3️⃣ Gestión de archivos y medios

- **Qué se almacena en Postgres:** todo el contenido textual — letra, acordes en ChordPro y metadatos de canciones/versiones/usuarios.
- **Qué se almacena externamente:** únicamente la **foto de perfil del Usuario**, en Cloudinary. Canciones, versiones y artistas **no tienen imagen** en el MVP.
- **Metadatos en la base de datos:** solo la URL del recurso (`foto_perfil_url`), nunca el archivo ni una ruta local absoluta.
- **Tamaños máximos permitidos:** 10 MB por imagen de perfil.
- **Convención de nombres:** usar el `public_id` que devuelve Cloudinary al subir, no el nombre original del archivo del usuario.
- **Estructura en Cloudinary:** carpeta `/usuarios/{usuario_id}/perfil`.
- **Validaciones al subir:** tipo MIME real de imagen (jpg/png/webp), tamaño ≤ 10 MB.
- **Limpieza de archivos huérfanos:** no aplica de forma crítica — al ser borrado lógico de Usuario, la imagen puede quedar en Cloudinary sin necesidad de limpieza inmediata (no hay canciones/versiones con imagen que huerfanar).

---

## 4️⃣ Trazabilidad con el Modelo de Dominio

- [x]  Entidades y relaciones coinciden con la Fase 3: **Usuario, Canción, Versión, Favorito** — sin cambios.
- [x]  Cada entidad de la Fase 3 tiene su ficha lógica aquí.
- [x]  Cada regla invariante de la Fase 3 tiene su restricción equivalente:
    - RN-001 (Versión pertenece a una Canción) → `cancion_id` FK obligatorio.
    - RN-002 (tono original inmutable) → `tono_original` sin mecanismo de edición tras creación.
    - RN-005 / RN-009 (ChordPro válido, tipos de acorde soportados) → validación a nivel de aplicación sobre `contenido_chordpro`.
    - RN-006 (favorito idempotente) → PK compuesta (usuario_id, version_id).
    - RN-007 (correo único) → índice único parcial en `Usuario.correo`.
    - RN-010 (título+artista sin duplicado exacto, advertencia) → índice no único + validación de advertencia en aplicación.
    - RN-014 / RN-015 / RN-016 / RN-017 (ciclo de vida de estado) → campo `estado` + `revisor_id` + `revisado_en`.
- [x]  Ninguna entidad nueva apareció aquí que no estuviera ya en la Fase 3.

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

El CRUD de las 4 entidades es simple, pero la lógica de transposición y conversión a grados (prioridad #1 del proyecto, Fase 0) sí justifica separar el dominio del framework, para poder probarlo de forma aislada y reutilizarlo en cliente y servidor.

- **Route Handlers (`app/api/v1/.../route.ts`):** reciben la petición HTTP, validan sesión/JWT y rol, y llaman a los servicios. No contienen lógica musical.
- **Servicios:** orquestan casos de uso (ej. "crear versión", "aprobar versión", "marcar favorito"). Coordinan repositorios + dominio.
- **Dominio (módulo TS puro, sin dependencias de Next.js ni de la base de datos):**
    - Parser/validador de ChordPro (RN-005, RN-009).
    - Transportador de acordes (RN-002, RN-003, RN-004).
    - Conversor acorde ↔ grado (RN-004).
    - Renderizador (letra + línea de acordes/grados encima) (RN-009b).
    
    Este módulo se importa **tanto en el cliente (para la vista previa en tiempo real, HU-10, <100 ms) como en el servidor** (para renderizar sin JS y para revalidar en el backend). Así evitamos una llamada de red para transportar o previsualizar.
    
- **Repositorios:** acceso a Neon (Postgres). Sin lógica de negocio, solo consultas.

---

## 3️⃣ Vistas de secuencia (3 casos críticos)

**Flujo: Buscar → ver → transportar**

1. El usuario escribe en el buscador → `GET /api/v1/canciones?q=...`.
2. El Route Handler llama al repositorio, que busca en Neon por título/artista.
3. Responde la lista de canciones coincidentes.
4. El usuario abre una canción → `GET /api/v1/canciones/{id}` (trae sus versiones Verificadas, o también las propias en otro estado si hay sesión).
5. El usuario elige una versión → `GET /api/v1/versiones/{id}` (trae el ChordPro + tono original).
6. El módulo de dominio (cargado en el cliente) renderiza la letra con acordes en el tono original.
7. El usuario cambia el tono en el selector → el dominio transporta y re-renderiza **en el cliente, sin nueva llamada al servidor** (RN-003, <100 ms).

**Flujo: Aportar una versión nueva (con vista previa en tiempo real)**

1. El usuario (autenticado, JWT en header) escribe en el textarea de ChordPro.
2. En cada cambio, el módulo de dominio (en el cliente) valida sintaxis y renderiza la vista previa localmente — **sin llamar al backend** (HU-10, RN-011, RN-013).
3. Si hay error de sintaxis, se resalta el punto exacto y el botón "Guardar" queda deshabilitado.
4. Al guardar, el frontend envía `POST /api/v1/canciones/{id}/versiones` con tono original + ChordPro.
5. El servidor **revalida** el ChordPro con el mismo módulo de dominio (nunca confía solo en la validación del cliente).
6. Si es válido, el repositorio inserta la versión con `estado = pendiente` (o `verificada` si el autor es administrador, RN-014).
7. El servidor responde con la versión creada y su estado.

**Flujo: Revisar versión pendiente (administrador)**

1. El administrador abre `GET /api/v1/versiones/pendientes` (requiere rol `administrador`, si no → 403 FORBIDDEN).
2. Selecciona una y ve su detalle (`GET /api/v1/versiones/{id}`).
3. Envía `PATCH /api/v1/versiones/{id}/revision` con `{ decision: "aprobada" | "rechazada" }`.
4. El servidor valida que la versión siga en estado `pendiente` (si ya fue revisada por otro admin, responde 409 CONFLICT).
5. Actualiza `estado`, `revisor_id`, `revisado_en`.
6. Responde con la versión actualizada; el autor la verá reflejada la próxima vez que abra "mis aportes".

---

## 4️⃣ Patrones y decisiones globales

- **Patrón arquitectónico general:** Monolito modular con Next.js (App Router) — un único despliegue en Vercel para frontend y backend. La lógica de dominio musical vive en un módulo aislado, sin dependencias de framework, compartido entre cliente y servidor.
- **Tipo de comunicación:** REST/JSON síncrono vía Route Handlers (`/api/v1/...`). La transposición y la vista previa **no** viajan por red: corren en el cliente.
- **Estrategia de persistencia:** PostgreSQL (Neon) utilizando **Prisma ORM** como capa de acceso a datos.
- **Seguridad mínima:** JWT en header `Authorization: Bearer <token>`, emitido en login local/Google. HTTPS siempre (garantizado por Vercel). Contraseñas locales hasheadas (bcrypt). Cada Route Handler protegido valida rol antes de ejecutar (RN-016).
- **Dónde corre el sistema:** Vercel (app Next.js completa) + Neon (Postgres) + Cloudinary (fotos de perfil).

---

## 5️⃣ Endpoints

**Autenticación**

- `POST /api/v1/auth/register` → registrar cuenta local (HU-01, RN-007)
- `POST /api/v1/auth/login` → iniciar sesión local, devuelve JWT (HU-01)
- `POST /api/v1/auth/google` → iniciar/asociar sesión con Google, devuelve JWT (HU-01)
- `GET /api/v1/auth/me` → datos del usuario autenticado (rol, nombre, foto)

**Canciones**

- `GET /api/v1/canciones` → buscar/listar (HU-02)
- `GET /api/v1/canciones/{id}` → detalle + versiones visibles (HU-03)
- `POST /api/v1/canciones` → crear canción + primera versión (HU-08)

**Versiones**

- `POST /api/v1/canciones/{id}/versiones` → agregar versión a canción existente (HU-09)
- `GET /api/v1/versiones/{id}` → obtener ChordPro + tono original de una versión (HU-04)
- `GET /api/v1/versiones/pendientes` → listar pendientes (HU-11, solo administrador)
- `GET /api/v1/versiones/mias` → "mis aportes" con su estado (soporta RN-015)
- `PATCH /api/v1/versiones/{id}/revision` → aprobar/rechazar (HU-11, RN-016, RN-017)
- `DELETE /api/v1/versiones/{id}` → eliminar versión propia, borrado lógico (HU-13, RN-019)

**Favoritos**

- `GET /api/v1/favoritos` → listar favoritos del usuario (HU-07)
- `POST /api/v1/favoritos` → agregar favorito `{ version_id }` (HU-07, RN-006, idempotente)
- `DELETE /api/v1/favoritos/{version_id}` → quitar favorito

**Perfil**

- `POST /api/v1/usuarios/me/foto` → subir/actualizar foto de perfil a Cloudinary (≤10 MB, jpg/png/webp — Fase 4)
- `DELETE /api/v1/usuarios/me` → eliminar cuenta propia, borrado lógico, conserva versiones verificadas y favoritos (HU-14, RN-018)

---

## 6️⃣ Esquemas de request/response

**POST /api/v1/auth/login**

Request:

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| correo | texto | sí |
| password | texto | sí |

Response 200:

```json
{ "token": "jwt...", "usuario": { "id": 1, "nombre": "Kevin", "rol": "musico" } }
```

Response 401:

```json
{ "error": "UNAUTHENTICATED", "message": "Correo o contraseña incorrectos" }
```

**POST /api/v1/canciones**

Request:

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| titulo | texto | sí |
| artista | texto | sí |
| tono_original | texto (una de 12 notas) | sí |
| contenido_chordpro | texto largo | sí |

Response 201:

```json
{ "id": 10, "titulo": "...", "artista": "...", "version": { "id": 55, "estado": "pendiente", "tono_original": "C" } }
```

Response 400 (ChordPro inválido):

```json
{ "error": "VALIDATION_ERROR", "message": "Acorde no reconocido", "linea": 4, "columna": 12 }
```

**GET /api/v1/versiones/{id}**

Response 200:

```json
{ "id": 55, "cancion_id": 10, "tono_original": "C", "estado": "verificada", "contenido_chordpro": "[C]Cuando salga el [G]sol" }
```

> El transporte y la conversión a grados **no** son parámetros de este endpoint: el cliente recibe siempre el ChordPro original y lo recalcula localmente con el módulo de dominio.
> 

**PATCH /api/v1/versiones/{id}/revision**

Request:

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| decision | enum ("aprobada", "rechazada") | sí |

Response 200:

```json
{ "id": 55, "estado": "verificada", "revisor_id": 2, "revisado_en": "2026-07-13T10:00:00Z" }
```

Response 409 (ya revisada):

```json
{ "error": "CONFLICT", "message": "Esta versión ya fue revisada" }
```

**POST /api/v1/favoritos**

Request:

| Campo | Tipo | Obligatorio |
| --- | --- | --- |
| version_id | entero | sí |

Response 200/201 (idempotente, RN-006):

```json
{ "usuario_id": 1, "version_id": 55, "creado_en": "2026-07-13T10:00:00Z" }
```

**DELETE /api/v1/usuarios/me**

Response 200:

```json
{"eliminado_en":"2026-07-13T10:00:00Z","mensaje":"Cuenta eliminada. Tus versiones verificadas y favoritos se conservan." }
```

---

## 7️⃣ Catálogo único de errores

| Código | Nombre |
| --- | --- |
| 400 | VALIDATION_ERROR |
| 401 | UNAUTHENTICATED |
| 403 | FORBIDDEN |
| 404 | NOT_FOUND |
| 409 | CONFLICT |
| 413 | PAYLOAD_TOO_LARGE |
| 500 | INTERNAL_ERROR |

Todos los endpoints usan este mismo catálogo. Los errores de sintaxis de ChordPro (RN-009) se devuelven como `400 VALIDATION_ERROR`, con `linea`/`columna` adicionales para que el frontend resalte el punto exacto (HU-10, RN-013).

---

## 8️⃣ Paginación, orden, filtros y versionado

- **Paginación:** `?page=1&limit=20` en listados (`/canciones`, `/versiones/pendientes`, `/versiones/mias`) → respuesta `{ items, page, limit, total }`.
- **Orden por defecto:** fecha de creación descendente, salvo `/canciones` que ordena por relevancia de búsqueda (o alfabético si no hay término de búsqueda).
- **Filtros:** `/canciones?q=` (título/artista, coherente con el índice `(titulo, artista)` de Fase 4); `/versiones/pendientes` no necesita filtros adicionales en el MVP.
- **Versionado:** todas las rutas bajo `/api/v1/...`. Un cambio incompatible se libera como `/api/v2/...`, sin romper `/v1`.

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

**Método de autenticación:** JWT (`Authorization: Bearer <token>`), emitido tras login local (correo/contraseña) o login con Google. Buscar y ver canciones/versiones no requiere sesión (RN-008).

| Rol | Puede | No puede |
| --- | --- | --- |
| Músico | Crear/editar sus propias versiones y canciones; guardar favoritas; ver sus propios aportes; eliminar sus propias versiones y su propia cuenta | Ver o modificar versiones ajenas no verificadas; aprobar/rechazar versiones (endpoints de revisión); eliminar cuenta ajena; al eliminar su cuenta, no puede eliminar retroactivamente sus versiones ya Verificadas ni sus favoritos (quedan intactos, RN-018) |
| Administrador | Todo lo del músico + revisar (aprobar/rechazar) versiones pendientes; sus propios aportes nacen directamente Verificados | Editar el contenido de una versión que no es suya |

---

### 2️⃣ Dónde viven los secretos

- [x]  `.env` está en `.gitignore` desde el primer commit
- **Procedimiento de rotación:** si un secreto se filtra, se genera un nuevo `JWT_SECRET` manualmente en Vercel; esto invalida todas las sesiones activas de inmediato (los usuarios deben volver a iniciar sesión).
- [ ]  Existe `.env.example` sin valores reales *(pendiente de crear)*

---

### 3️⃣ Protección de datos sensibles

- **Hash de contraseñas:** bcrypt, **12 rounds**.
- **Convención de nombres de archivos subidos:** se usa el `public_id` que devuelve Cloudinary al subir la foto de perfil; nunca el nombre original del archivo del usuario (heredado de Fase 4).
- **Otros datos sensibles a proteger:** `JWT_SECRET`, `DATABASE_URL`, credenciales de Google OAuth y de Cloudinary — todos viven exclusivamente en variables de entorno, nunca en el código ni en el repositorio.

---

### 4️⃣ Amenazas reales (3–5)

| Amenaza | Mitigación |
| --- | --- |
| Acceso no autorizado a versiones/canciones ajenas (ej. editar o ver una versión Pendiente/Rechazada que no es propia) | Cada Route Handler valida `autor_id` contra el usuario autenticado antes de permitir edición; las versiones no Verificadas solo son visibles para su autor (RN-015) |
| Escalar a rol administrador sin serlo (manipular el JWT o llamar directo al endpoint de revisión) | El rol se valida siempre en el servidor a partir de los datos del usuario en base de datos, nunca se confía en un campo `rol` enviado desde el cliente; endpoints de revisión (`PATCH /versiones/{id}/revision`, `GET /versiones/pendientes`) verifican `rol = administrador` server-side y responden `403 FORBIDDEN` si no aplica (RN-016) |
| Subida de imagen de perfil maliciosa o gigante | Validación de tipo MIME real (jpg/png/webp) y límite de tamaño ≤10 MB antes de subir a Cloudinary (Fase 4); Cloudinary además aplica sus propios límites de la cuenta |

---

### 5️⃣ Logging

- **Qué se registra:** inicios de sesión (exitosos y fallidos), creación/edición/eliminación de canciones y versiones, aprobación/rechazo de versiones, errores de la aplicación.
- **Qué NO se registra:** contraseñas, tokens JWT completos, ni el contenido completo del `.env`.
- **Formato:** `[timestamp] [nivel] [módulo] mensaje`
- **Niveles usados:** `info` (eventos normales), `warn` (algo raro pero no crítico, ej. intento de acceso no autorizado), `error` (falló algo, ej. error de validación de ChordPro no capturado antes).
- **Dónde viven:** consola/logs nativos de Vercel (sin servicio externo por ahora — suficiente para el tamaño del proyecto).

---

### 6️⃣ Catálogo de configuración

| Variable | Propósito | Default | ¿Sensible? |
| --- | --- | --- | --- |
| DATABASE_URL | Conexión a Neon (PostgreSQL) | — | Sí |
| JWT_SECRET | Firma y verificación de tokens de sesión | — | Sí |
| GOOGLE_CLIENT_ID | Autenticación con Google OAuth | — | No |
| GOOGLE_CLIENT_SECRET | Autenticación con Google OAuth | — | Sí |
| CLOUDINARY_CLOUD_NAME | Identificador de la cuenta de Cloudinary | — | No |
| CLOUDINARY_API_KEY | Subida de fotos de perfil | — | Sí |
| CLOUDINARY_API_SECRET | Subida de fotos de perfil | — | Sí |

Ninguna de estas variables tiene un default razonable; si falta alguna al iniciar, el sistema debe fallar de inmediato con un mensaje claro, no silenciosamente.

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
- [x]  ¿Las contraseñas se guardan hasheadas con bcrypt ≥10 rounds? (12 rounds)
- [x]  ¿Existen entre 3 y 5 amenazas reales, con mitigación documentada?
- [x]  ¿El logging tiene niveles definidos y un formato mínimo?
- [x]  ¿El catálogo de variables de entorno está completo y sin secretos expuestos en código?
- [x]  ¿El backup tiene frecuencia y destino definidos?
- [ ]  ¿Ya probé el procedimiento de restore al menos una vez? → **No, pendiente.**
- [x]  ¿La convención de migraciones está documentada, con rollback manual?

**⚠️ Nota:** el gate no está 100% cerrado. Falta probar la restauración del backup antes de dar por completada esta fase con confianza real.

# 🎨 Fase 7 · UX: Navegación y Flujos de Pantalla

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
├── prisma
│   ├── schema.prisma
│   └── migrations
│
├── docs
│   └── Documento de planeación y decisiones técnicas
│
└── scripts
├── Backup manual semanal
└── Seeds de datos de prueba

**Por qué esta forma:** `/domain` queda aislado porque se importa tanto en cliente (vista previa en tiempo real, transposición sin red) como en servidor (revalidación), tal como se decidió en Fase 5. El resto sigue la convención estándar de App Router para no pelear contra el framework.

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

- **Sprint 1 — Núcleo musical + datos:** construir y validar con pruebas unitarias el parser de ChordPro, el transportador y el conversor a grados; definir el `schema.prisma` con las 4 entidades y correr la primera migración. Sin UI todavía.
- **Sprint 2 — Flujo público + auth:** levantar buscar → ver → transportar → ver en grados en la UI (usando `/domain` en el cliente), más login local/Google y favoritos.
- **Sprint 3 — Contribución y administración:** formulario de aportar canción/versión con vista previa en tiempo real, panel de revisión del administrador, foto de perfil, y eliminación de versión propia/cuenta.

---

### 5️⃣ Decisiones técnicas críticas

| Decisión | Por qué | Alternativa descartada | Fase |
| --- | --- | --- | --- |
| Monolito Next.js (App Router) para frontend + backend | Un único desarrollador, un único despliegue en Vercel, sin el costo de mantener dos repos/servicios | Backend separado (Express/NestJS) + frontend independiente | Fase 5 |
| Módulo `/domain` en TS puro, sin dependencias de framework ni BD | Se reutiliza en cliente y servidor; permite transponer/previsualizar sin llamada de red y cumplir el NFR de <100 ms | Recalcular siempre en el servidor y llamar por API en cada cambio de tono | Fase 5 |
| PostgreSQL vía Neon + Prisma ORM | Plan gratuito suficiente para el MVP, tipado fuerte, migraciones versionadas | MongoDB (no se necesita flexibilidad de esquema); SQLite (no escala a producción en Vercel) | Fase 4/5 |
| ChordPro como formato único de almacenamiento | Formato estándar y compacto para representar acorde+sílaba con precisión, evita recalcular espacios a mano | Guardar el acorde con posición en JSON custom | Fase 2 |
| JWT en header `Authorization` | Stateless, simple de validar en cada Route Handler, sin infraestructura de sesión adicional | Sesiones con cookie + almacenamiento server-side | Fase 6 |
| Cloudinary solo para la foto de perfil | Gratuito, no hay canciones/versiones con imagen que justifiquen más | Guardar el archivo en Neon como bytes, o usar S3 | Fase 4 |
| Borrado lógico en Usuario/Canción/Versión; borrado físico en Favorito | Preserva contenido verificado recuperable ante eliminación de cuenta; los favoritos no tienen valor histórico propio | Borrado físico total en todas las entidades | Fase 4 |

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

- Ubicación base: Cloudinary (carpeta `/usuarios/{usuario_id}/perfil`)
- Estructura: un recurso por usuario, sobrescribible al actualizar
- Nombre: `public_id` generado por Cloudinary (nunca el nombre original del archivo)
- Límites: imagen de perfil ≤ 10 MB, tipo MIME real jpg/png/webp
- Metadata en DB: solo `foto_perfil_url` (texto), nunca el archivo ni una ruta local

**D. Variables de configuración (.env local)**

```
# Base de datos
DATABASE_URL=

# Autenticación
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Ninguna variable tiene un default razonable: si falta alguna al iniciar, el sistema debe fallar de inmediato con un mensaje claro.