# Requerimientos

Derivados de `CLAUDE.md` (secciones 1 a 8 y 11). Estado de todos: **pendiente** (10/11/2026, antes del paso 1).

## 1. Criterio de priorización

Las funciones se priorizaron con una **matriz de decisión ponderada**:

| Criterio | Peso | Pregunta |
| --- | --- | --- |
| Valor para el usuario | 40 % | ¿Resuelve un problema central de algún rol? |
| Demostración de habilidades | 35 % | ¿Muestra diseño de flujos complejos, diseño instruccional o visualización de datos en el portfolio? |
| Facilidad | 25 % | ¿Se puede construir bien sin backend y en tiempo razonable? |

El resultado se expresa en **MoSCoW** y es coherente con las fases:

| Prioridad | Significado | Fase |
| --- | --- | --- |
| **Must** | Sin esto el MVP no demuestra su propuesta. | A (F0 a F6) |
| **Should** | Lo que se espera de una plataforma corporativa; suma mucho a la demo. | B (F7 a F17) |
| **Could** | Mejora deseable si hay tiempo, dentro de una función de fase B. | B |
| **Won't** | Fuera del alcance del MVP (sección 9). | No se construye |

---

## 2. Requerimientos funcionales (RF)

### F0. Autenticación y control de acceso (fase A)

| ID | Descripción | Rol | Pantallas | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| RF-001 | El sistema debe permitir iniciar sesión con SSO simulado (Microsoft y Google) pasando por una simulación neutra de la redirección, que no imita la página del proveedor. | Todos | G1, G2 | Must | G2 está rotulada como simulación, no usa el diseño, colores ni textos de Microsoft o Google, y "Continuar" lleva a G3. | Hecho |
| RF-002 | El sistema debe permitir iniciar sesión con correo y contraseña de las cuentas demo. | Todos | G1 | Must | Las 4 cuentas `@nortia.demo` con `Demo.2026!` llegan a G3. | Hecho |
| RF-003 | El sistema debe ofrecer, desde el inicio de la demo, un recorrido por rol que abre el login con ese rol preseleccionado y completa SSO y MFA con el código precargado. | Todos | G0, G1, G2, G3 | Must | Cada tarjeta de G0 abre `/login?demo=…`; "Continuar con Microsoft" o "Continuar con Google" simula el inicio de sesión con la cuenta ficticia de esa persona y llega al inicio del rol confirmando sin escribir; el formulario de correo llega precargado (D-66). | Hecho |
| RF-004 | El sistema debe mostrar un error genérico ante credenciales inválidas, sin revelar si el correo existe. | Todos | G1 | Must | Correo inexistente y contraseña errónea muestran el mismo mensaje. | Hecho |
| RF-005 | El sistema debe bloquear la cuenta tras 5 intentos fallidos y derivar a sistemas, sin desbloqueo automático ni por el usuario. | Todos | G1, G4 | Must | Al quinto intento aparece el aviso de bloqueo con enlace a G4; esperar o recargar no desbloquea. | Hecho |
| RF-006 | El sistema debe pedir un código de 6 dígitos (MFA) en un único campo que acepte pegado, con "Recordar este dispositivo por 30 días" y "Usar un código de respaldo". | Todos | G3 | Must | `246810` valida; otro código muestra "No pudimos verificar el código. Revisa que tenga 6 dígitos". Pegar el código funciona. | Hecho |
| RF-007 | El sistema debe exigir MFA a RRHH y sistemas y dejarlo opcional para jefe y nuevo ingreso. | Todos | G3, G5 | Must | RRHH y sistemas no pueden desactivarlo en G5; jefe y nuevo ingreso sí. | Hecho |
| RF-008 | El sistema debe ofrecer "¿Problemas para iniciar sesión?" con canales de la mesa de ayuda y un formulario de solicitud a sistemas. | Todos | G4 | Must | El formulario valida correo y motivo y genera un número `IT-2026-NNNN`. | Hecho |
| RF-009 | La confirmación de la solicitud debe ser idéntica exista o no el correo, e informar que sistemas verificará la identidad. | Todos | G4 | Must | Mismo texto con correo existente e inexistente. | Hecho |
| RF-010 | La confirmación debe incluir "Ver como sistemas (demo)", que entra como Diego directo a la solicitud creada. | Todos | G4, S2 | Must | El enlace abre S2 con la solicitud recién creada. | En curso (S2 se construye en el paso 10) |
| RF-011 | Tras un cambio forzado de contraseña, el sistema debe pedir una nueva con la política visible y validada en vivo e indicador de fortaleza. | Todos | G1 | Must | No se acepta una contraseña de menos de 12 caracteres o sin mayúscula, minúscula, número y símbolo, ni una anterior. | Hecho |
| RF-012 | El sistema debe cerrar la sesión tras 15 minutos de inactividad, avisando en el minuto 13 con un modal accesible. | Todos | G6 | Must | El modal ofrece "Seguir conectado" y "Cerrar sesión"; sin respuesta, se cierra. Existe un control de demo para acelerarlo. | Hecho |
| RF-013 | El sistema debe permitir cerrar sesión y volver al login con un mensaje de confirmación. | Todos | G6, G1 | Must | El estado de sesión se limpia y G1 muestra la confirmación. | Hecho |
| RF-014 | Sin sesión, toda ruta interna debe redirigir al login y volver a la ruta pedida tras iniciar sesión. | Todos | G1 | Must | Abrir `/#/admin/hires` sin sesión lleva a G1 y, al entrar como RRHH, a A2. | Hecho |
| RF-015 | Cada rol debe acceder solo a sus rutas; el intento contrario muestra G7 y queda en la auditoría. | Todos | G7 | Must | Sofía en `/admin` ve G7 y aparece un evento `auth.access_denied`. | Hecho |
| RF-016 | Los permisos deben definirse en un único archivo como matriz rol × acción, consultado por rutas y botones. | Todos | Todas | Must | No hay condiciones por nombre de rol en los componentes. | Hecho |
| RF-017 | El sistema debe ofrecer un selector de rol visible en el header que cierre la sesión actual e inicie la del usuario demo elegido. | Todos | G6 | Must | Cambiar de rol no recarga la página y queda registrado en la auditoría. | Hecho |
| RF-018 | El sistema debe ofrecer un menú de usuario con nombre, rol, "Mi seguridad" y "Cerrar sesión". | Todos | G6, G5 | Must | Accesible con teclado desde el header. | Hecho |
| RF-019 | El sistema debe ofrecer "Restablecer demo" en el menú de usuario y en el login. | Todos | G1, G6 | Must | Limpia `localStorage`, recarga los datos semilla y cierra la sesión. | Hecho |
| RF-020 | El login debe mostrar el aviso "Esto es una demo: no ingreses datos reales". | Todos | G1 | Must | Visible sin desplazar en 375 px. | Hecho |
| RF-087 | El sistema debe mostrar un inicio de la demo (G0) en `/` que presente el proyecto, explique que es un prototipo con datos ficticios y deje elegir uno de los 4 recorridos, con enlaces al case study y a la documentación y "Restablecer demo". | Todos | G0 | Must | G0 es lo primero que ve quien llega sin sesión; con sesión, `/` lleva al inicio del rol. | Hecho |
| RF-088 | Los botones de SSO deben usar los logos oficiales sin modificar, los textos "Continuar con Microsoft" y "Continuar con Google" y la misma prominencia, y el login no debe tener tarjetas de roles ni panel de marketing. | Todos | G1 | Must | Logos en `src/assets/brands/` con nota de origen; ambos botones con el mismo componente. | Hecho |
| RF-089 | El sistema debe ofrecer un botón "Volver arriba" en las páginas largas, visible solo después de desplazarse, y un índice de secciones siempre accesible en el sitio del sistema de diseño en cualquier ancho. | Todos | G0, sitio del sistema de diseño, layout (G6) | Should | El botón no aparece arriba de todo, es usable con teclado y lleva el foco al título; por debajo de 1280 px la barra "Secciones" abre el índice y marca la sección actual (D-104). | Hecho |
| RF-086 | El sistema debe simular al menos un error de servidor en un formulario, conservando los datos y ofreciendo "Reintentar". | Todos | G4 | Must | Con el motivo "Otro" y el comentario `error-servidor`, el envío falla una vez con "El servicio no está disponible"; al reintentar, funciona. | Hecho |

### F1. Mi recorrido (fase A)

| ID | Descripción | Rol | Pantallas | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| RF-021 | El sistema debe mostrar el recorrido agrupado por etapas: Preingreso, Semana 1, Mes 1, Días 30 a 90. | Nuevo ingreso | N1 | Must | Cada tarea aparece en una sola etapa. | Hecho |
| RF-022 | Cada tarea debe mostrar título, tipo, responsable, fecha límite y estado. | Nuevo ingreso, Jefe, RRHH | N1, J2, A4 | Must | Fecha en `DD/MM/AAAA`; estado en píldora con texto. | Hecho |
| RF-023 | El sistema debe permitir completar tareas propias y, en cursos, abrir el contenido y marcarlo completado. | Nuevo ingreso | N1, N2 | Must | La tarea pasa a hecha, persiste al recargar y se anima según 2.6. | Hecho |
| RF-024 | Las tareas bloqueadas por dependencias deben verse deshabilitadas con el motivo. | Nuevo ingreso | N1, N2 | Must | Texto del tipo "Primero completa: Acceso a Jira". | Hecho |
| RF-025 | Completar una tarea debe desbloquear las que dependen de ella. | Nuevo ingreso | N1 | Must | La dependiente cambia de bloqueada a pendiente y se resalta brevemente. | Hecho |
| RF-026 | El sistema debe mostrar el progreso general y por etapa. | Nuevo ingreso | N1 | Must | Los porcentajes coinciden con las tareas hechas. | Hecho |
| RF-027 | El sistema debe mostrar "Lo próximo" con las 3 tareas más urgentes. | Nuevo ingreso | N1 | Must | Ordenadas por vencidas primero y luego por fecha; excluye bloqueadas y hechas. | Hecho |
| RF-028 | El sistema debe mostrar los contactos clave: jefe directo, buddy y referente de RRHH. | Nuevo ingreso | N1 | Must | Con nombre, puesto y correo. | Hecho |

### F2. Constructor de plantillas (fase A)

| ID | Descripción | Rol | Pantallas | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| RF-029 | El sistema debe listar plantillas con puesto, cantidad de tareas y cantidad de ingresos que la usan. | RRHH | A5 | Must | Los números se calculan desde los datos. | Hecho |
| RF-030 | El sistema debe permitir crear, duplicar, editar y eliminar plantillas, con confirmación al eliminar. | RRHH | A5, A6 | Must | El diálogo dice "¿Eliminar esta plantilla?" y el botón "Eliminar plantilla". | Hecho |
| RF-031 | El sistema debe permitir agregar, editar, eliminar y reordenar tareas con arrastrar y soltar y, como alternativa, con "Subir", "Bajar" y "Mover a etapa…". | RRHH | A6 | Must | El orden persiste; la alternativa funciona con teclado y con un solo clic, y el cambio se anuncia a lectores de pantalla. | Hecho |
| RF-032 | Cada tarea debe definir título, descripción, tipo, responsable, plazo relativo y dependencias. | RRHH | A6 | Must | Formulario validado con Zod y etiquetas visibles. | Hecho |
| RF-033 | El sistema debe impedir dependencias circulares con un mensaje claro. | RRHH | A6 | Must | Intentar A→B→A muestra el error y no guarda. | Hecho |
| RF-034 | El sistema debe impedir que una dependencia tenga un plazo posterior al de la tarea que depende de ella. | RRHH | A6 | Must | El error indica ambas tareas y sus plazos. | Hecho |
| RF-035 | El sistema debe mostrar una vista previa del recorrido con una fecha de ingreso de ejemplo editable. | RRHH | A7 | Must | Las fechas se recalculan al cambiar la fecha de ejemplo. | Hecho |

### F3. Alta de ingresos (fase A)

| ID | Descripción | Rol | Pantallas | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| RF-036 | El sistema debe permitir dar de alta un ingreso con nombre, puesto, área, fecha de ingreso, jefe, buddy y plantilla. | RRHH | A3 | Must | Validación con errores junto a cada campo. | Hecho |
| RF-037 | Al guardar, el sistema debe generar el recorrido copiando las tareas de la plantilla y calculando `dueDate = startDate + offsetDays`. | RRHH | A3, A4 | Must | Una plantilla nueva asignada genera fechas correctas. | Hecho |
| RF-038 | El sistema debe listar ingresos con filtros por estado (próximo, en curso, finalizado) y por área. | RRHH | A2 | Must | En mobile la tabla se muestra como tarjetas. | Hecho |
| RF-039 | El sistema debe mostrar la ficha del ingreso con datos, recorrido con estados e historial de check-ins. | RRHH | A4 | Must | RRHH puede marcar como hechas las tareas de buddy, IT y Facilities. | Hecho |
| RF-040 | El alta de un ingreso debe registrarse en la auditoría. | RRHH | A3 | Must | Evento `hire.create`. | Hecho |

### F4. Panel de seguimiento (fase A)

| ID | Descripción | Rol | Pantallas | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| RF-041 | El sistema debe mostrar KPIs: ingresos activos, % de tareas a tiempo, recorridos con atraso y promedio de avance. | RRHH | A1 | Must | Se calculan en `metrics.ts` y cambian al cambiar los datos. | Hecho |
| RF-042 | El sistema debe mostrar un gráfico de avance por ingreso o por cohorte (mes de ingreso). | RRHH | A1 | Must | Se puede alternar entre ambas vistas; tiene título, resumen en texto y tabla para lectores de pantalla (D-83). | Hecho |
| RF-043 | El sistema debe mostrar un gráfico de tareas atrasadas por responsable. | RRHH | A1 | Must | Incluye IT, Facilities, buddy, jefe, RRHH y nuevo ingreso. | Hecho |
| RF-044 | El sistema debe mostrar alertas: tareas vencidas, check-ins pendientes, check-ins escalados y tareas bloqueadas hace más de X días. | RRHH | A1 | Must | Cada alerta enlaza a la ficha del ingreso. | Hecho |
| RF-045 | El panel debe mostrar los datos de ánimo solo agregados. | RRHH | A1 | Must | No hay nombre asociado a un valor de ánimo en A1. | Hecho |

### F5. Check-ins 30/60/90 (fase A)

| ID | Descripción | Rol | Pantallas | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| RF-046 | El sistema debe mostrar al jefe su equipo en onboarding con avance y próximo check-in. | Jefe | J1 | Must | Solo personas de su equipo. | Hecho |
| RF-047 | El sistema debe mostrar al jefe el recorrido del ingreso en modo lectura, permitiéndole completar solo sus propias tareas. | Jefe | J2 | Must | Las tareas de otros responsables no tienen acción. | Hecho |
| RF-048 | El sistema debe permitir al jefe evaluar cada hito (cumplido, parcial, no cumplido) con comentarios y próximos pasos. | Jefe | J3 | Must | No se envía sin evaluar todos los hitos. | Hecho |
| RF-049 | Ante un hito no cumplido, el jefe debe elegir reprogramar (nueva fecha) o escalar a RRHH (con nota). | Jefe | J3 | Must | Escalar genera una alerta en A1 y un evento de auditoría. | Hecho |
| RF-050 | El nuevo ingreso debe poder responder su autoevaluación (cómo se siente, 1 a 5, y comentario) antes de la reunión. | Nuevo ingreso | N3 | Must | El jefe ve la autoevaluación en J2 y J3. | Hecho |
| RF-051 | El check-in completado debe quedar en el historial de la ficha del ingreso. | RRHH, Jefe | A4, J2 | Must | Con fecha, resultados de hitos y acción tomada. | Hecho |

### F6. Seguridad, accesos y auditoría (fase A)

| ID | Descripción | Rol | Pantallas | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| RF-052 | El sistema debe mostrar la bandeja de solicitudes de acceso con número, usuario, motivo, fecha y estado. | Sistemas | S1 | Must | Filtrable por estado. | Hecho |
| RF-053 | El sistema debe exigir marcar la verificación de identidad antes de resolver una solicitud. | Sistemas | S2 | Must | Las acciones de resolución están deshabilitadas, con motivo visible, hasta completar el checklist. | Hecho |
| RF-054 | El sistema debe permitir desbloquear, forzar cambio de contraseña, restablecer MFA o rechazar con motivo. | Sistemas | S2 | Must | Cada acción cambia el estado y genera un evento de auditoría. | Hecho |
| RF-055 | Resolver una solicitud debe permitir al usuario volver a iniciar sesión. | Sistemas, Todos | S2, G1 | Must | Tras desbloquear, la cuenta entra; tras forzar cambio, pide contraseña nueva. | Hecho |
| RF-056 | El sistema debe listar las cuentas bloqueadas con intentos fallidos y último intento, con desbloqueo directo. | Sistemas | S3 | Must | Desbloquear actualiza la lista y la auditoría. | Hecho |
| RF-057 | El sistema debe mostrar la auditoría con fecha y hora, usuario, acción, recurso y resultado, con filtros y exportación a CSV. | Sistemas | S3 | Must | Filtros por usuario, tipo y rango de fechas; el CSV respeta los filtros. | Hecho |
| RF-058 | El sistema debe mostrar la matriz de permisos en modo lectura generada desde `permissions.ts`. | Sistemas | S3 | Must | Coincide con lo que cada rol puede hacer. | Hecho |
| RF-059 | El sistema debe mostrar las políticas vigentes: MFA por rol, duración de sesión, intentos antes del bloqueo y política de contraseñas. | Sistemas | S3 | Must | Valores leídos de `SecurityPolicy`. | Hecho |
| RF-060 | El sistema debe registrar en la auditoría todos los eventos listados en F6. | Todos | S3 | Must | Cada evento de la lista de F6 tiene al menos un caso en los datos semilla o al usar la demo. | Hecho |

### Fase B (F7 a F17)

| ID | Descripción | Rol | Función | Pantallas | Prioridad | Criterio de aceptación | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RF-061 | El sistema debe generar notificaciones por eventos y mostrarlas en un panel con contador y en una página con filtros. | Todos | F7 | G6, G9 | Should | Llegan al rol correcto y enlazan a la acción. | Hecho |
| RF-062 | El sistema debe permitir marcar notificaciones como leídas (una o todas) y mostrar toasts de la sesión actual. | Todos | F7 | G6, G9 | Should | El contador se actualiza. | Hecho |
| RF-063 | El sistema debe mostrar una vista previa del correo simulado de cada notificación. | Todos | F7 | G9 | Could | No se envía nada. | Hecho |
| RF-064 | Las plantillas deben tener estado borrador o publicada y número de versión. | RRHH | F8 | A5, A6 | Should | Editar una publicada crea un borrador. | Hecho |
| RF-065 | Publicar una versión no debe modificar los recorridos en curso. | RRHH | F8 | A4, A6 | Should | La ficha muestra la versión usada por cada ingreso. | Hecho |
| RF-066 | Publicar debe mostrar un resumen de cambios y exigir una nota de versión. | RRHH | F8 | A6 | Should | Sin nota no se publica. | Hecho |
| RF-067 | El sistema debe mostrar el historial de versiones, compararlas y restaurar una anterior como borrador. | RRHH | F8 | A8 | Should | La comparación muestra tareas agregadas, quitadas y modificadas. | Hecho |
| RF-068 | Solo se deben poder asignar plantillas publicadas. | RRHH | F8 | A3 | Should | Los borradores no aparecen en el alta. | Hecho |
| RF-069 | El sistema debe permitir comentar en tareas del recorrido, con menciones `@` que notifican. | Nuevo ingreso, Jefe, RRHH | F9 | N2, J2, A4 | Should | Solo texto plano; editar marca "editado". | Hecho |
| RF-070 | El sistema debe pedir aceptar el aviso de privacidad en el primer ingreso, registrando fecha y versión. | Todos | F10 | G8 | Should | Sin aceptar no se continúa. | Hecho |
| RF-071 | El sistema debe ofrecer "Mi privacidad" con el aviso vigente, la fecha de aceptación y los datos propios. | Todos | F10 | G10 | Should | | Hecho |
| RF-072 | El sistema debe permitir enviar solicitudes de acceso, rectificación o supresión y gestionarlas con plazo y estado. | Todos, RRHH | F10 | G10, A12 | Should | El plazo de respuesta es visible en ambas vistas. | Hecho |
| RF-073 | DNI, CUIL y datos bancarios deben mostrarse enmascarados; revelarlos requiere `pii:reveal`, motivo y auditoría. | RRHH | F10 | A10 | Should | También enmascarados en exportaciones. | Hecho |
| RF-074 | El sistema debe mostrar la política de retención y la fecha programada de anonimización de ingresos finalizados. | RRHH, Sistemas | F10 | A4, S3 | Could | | Hecho |
| RF-075 | El sistema debe listar las sesiones activas propias y permitir cerrarlas. | Todos | F11 | G5 | Should | La sesión actual está marcada. | Hecho |
| RF-076 | El sistema debe alertar de inicios de sesión inusuales con "Sí, fui yo" o "No fui yo"; esta última cierra la sesión y genera una solicitud urgente. | Todos | F11 | G6, G9, S1 | Should | Sofía tiene una alerta semilla pendiente. | Hecho |
| RF-077 | Sistemas debe ver las sesiones de toda la organización y forzar su cierre. | Sistemas | F11 | S3 | Should | Queda en la auditoría. | Hecho |
| RF-078 | El sistema debe generar tareas de accesos para sistemas en altas, cambios de puesto y bajas. | RRHH, Sistemas | F12 | A11, S4 | Should | La baja deshabilita la cuenta en la fecha efectiva. | Hecho |
| RF-079 | El sistema debe permitir crear campañas de revisión de accesos que los jefes completan y sistemas cierra con resumen. | Sistemas, Jefe | F13 | S5, S6, J4 | Should | Avance en % por jefe; resumen descargable. | Hecho |
| RF-080 | Las acciones sensibles deben requerir doble aprobación, sin que quien pide pueda aprobar. | RRHH, Sistemas | F14 | S7 | Should | El botón de aprobar no está disponible para quien solicitó. | Hecho |
| RF-081 | El sistema debe permitir gestionar personas, áreas y puestos (con plantilla y accesos sugeridos). | RRHH | F15 | A9, A10 | Should | El cambio de rol a admin pasa por doble aprobación. | Hecho |
| RF-082 | El sistema debe ofrecer búsqueda global (`Ctrl+K` o `/`) filtrada por permisos y agrupada por tipo. | Todos | F16 | G6, G12 | Should | Sofía no encuentra recorridos ajenos. | Hecho |
| RF-083 | El sistema debe ofrecer ayuda contextual por pantalla y un recorrido guiado de 3 a 5 pasos por rol. | Todos | F16 | Todas | Should | Se puede saltar y volver a ver desde el menú. | Hecho |
| RF-084 | El sistema debe exportar listados a CSV y ofrecer vistas imprimibles del panel, la ficha del ingreso y el resumen de campañas. | RRHH, Sistemas | F16 | A13 | Should | Respetan el enmascarado y quedan en la auditoría. | Hecho |
| RF-085 | El sistema debe permitir elegir idioma, preferencias de notificación, zona horaria, formato de fecha, reducir animaciones y alto contraste. | Todos | F17 | G11 | Should | Los cambios se aplican sin recargar al guardar, son de cada persona y se aplican al iniciar sesión o cambiar de rol (D-129). | Hecho |

### Won't (fuera del alcance del MVP)

| ID | Descripción | Motivo |
| --- | --- | --- |
| RF-W01 | Vistas de gestión de tareas para Facilities y buddy | Iteración futura; el modelo de datos ya lo contempla. |
| RF-W02 | Encuesta de experiencia de onboarding | Iteración futura. |
| RF-W03 | Biblioteca de cursos y microaprendizaje | Iteración futura. |
| RF-W04 | Gamificación | Iteración futura. |
| RF-W05 | Integraciones reales (HRIS, Slack, Teams, correo) | Sin backend. |
| RF-W06 | Autogestión de acceso (recuperar contraseña por correo, desbloqueo automático) | **Decisión de diseño**: en un entorno corporativo siempre pasa por sistemas. |
| RF-W07 | Autenticación y autorización reales | Sin backend; documentado en `security.md`. |
| RF-W08 | Asistente conversacional | Línea futura; solo se reserva el lugar del botón de ayuda flotante. |

---

## 3. Matriz de reglas de negocio

Reglas que el sistema hace cumplir siempre, con dónde se verifican y cómo se prueban (sección 7 de `CLAUDE.md`).

| ID | Regla | Funciones | Dónde se verifica | Prueba | Estado |
| --- | --- | --- | --- | --- | --- |
| RN-01 | La fecha de una tarea es la fecha de ingreso más su plazo relativo (`dueDate = startDate + offsetDays`). | F2, F3 | `src/lib/journey.ts` | Tests de `journey` | Hecho |
| RN-02 | Una tarea está bloqueada si alguna de sus dependencias no está hecha, y vencida si su fecha pasó y no está hecha; el estado se calcula, no se guarda. | F1 | `src/lib/journey.ts` | Tests de `journey` | Hecho |
| RN-03 | Publicar una plantilla nunca modifica los recorridos existentes. | F8 | `src/lib/templates.ts`, store | Tests de plantillas | Hecho |
| RN-04 | Quien pide una acción con doble aprobación nunca puede aprobarla, ni la persona a la que afecta. | F14 | `src/lib/approvals.ts`, store | Tests de aprobaciones | Hecho |
| RN-05 | **Sistemas nunca queda con menos de dos personas activas** (D-121): no se aplica un cambio de rol, una revocación en una campaña ni una baja que lo dejaría así. Se verifica al pedir y al aprobar; el intento queda auditado como `denied`. | F12, F13, F14, F15 | `itMinimumBlock` en `src/lib/people.ts` y el store | `ItMinimum.test.tsx`, `AccessReview.test.tsx` | Hecho |
| RN-06 | Nadie revisa sus propios accesos: lo revisa su jefe directo; sin jefe, RRHH; a RRHH, sistemas. Las cuentas admin entran en todas las campañas. | F13 | `src/lib/access-review.ts` | Tests de revisión de accesos | Hecho |
| RN-07 | Toda acción sobre datos sensibles, permisos o accesos genera un evento de auditoría. | F6 a F15 | Store | Tests de cada función | Hecho |
| RN-08 | La fecha de "hoy" de la demo es fija (`DEMO_TODAY`) y las métricas se calculan desde los datos. | F4 | `src/lib/dates.ts`, `src/lib/metrics.ts` | Tests de métricas | Hecho |

## 4. Requerimientos no funcionales (RNF)

Organizados según las características de calidad de **ISO/IEC 25010:2023** (ISO/IEC, 2023).

### Adecuación funcional

| ID | Descripción medible | Prioridad | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-001 | El 100 % de las métricas del panel se calculan desde los datos en `src/lib/metrics.ts`; ninguna está escrita a mano. | Must | Revisión de código y test unitario que cambia los datos y compara KPIs. | Hecho |
| RNF-002 | Los estados `blocked` y `overdue` se calculan siempre a partir de dependencias y `DEMO_TODAY`, nunca se guardan. | Must | Tests unitarios de `lib/` con casos de borde. | Hecho |
| RNF-003 | Todas las fechas de la interfaz se muestran como `DD/MM/AAAA`; números con punto de miles y coma decimal. | Must | Test unitario de los formateadores y revisión visual. | Hecho |

### Eficiencia de desempeño

| ID | Descripción medible | Prioridad | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-004 | Lighthouse Performance ≥ 85 en mobile para G1, N1 y A1 en el deploy de GitHub Pages. | Should | Lighthouse en la revisión de fase. | Pendiente |
| RNF-005 | El JavaScript inicial (gzip) no supera 300 KB; las rutas de cada rol se cargan de forma diferida. | Should | Reporte de build de Vite. | Hecho |
| RNF-006 | Los íconos se importan como SVG individuales; no se carga la fuente completa de Material Symbols. | Must | Revisión del bundle. | Hecho |
| RNF-007 | Las animaciones duran entre 150 y 300 ms y solo animan `transform` y `opacity`. | Must | Revisión de código. | Hecho, con excepción (D-99) |

### Compatibilidad

| ID | Descripción medible | Prioridad | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-008 | Funciona en las dos últimas versiones de Chrome, Edge, Firefox y Safari. | Should | Prueba manual de los flujos críticos. | Pendiente |
| RNF-009 | Usa `HashRouter` para que todas las rutas funcionen en GitHub Pages, incluida la recarga directa. | Must | Recargar rutas profundas en el deploy. | Hecho |

### Capacidad de interacción (usabilidad y accesibilidad)

Accesibilidad según **WCAG 2.2 nivel AA** (W3C, 2023), equivalente a ISO/IEC 40500:2025 (ISO/IEC, 2025). Detalle de reglas en la sección 2.10 de `CLAUDE.md`.

| ID | Descripción medible | Prioridad | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-010 | Contraste mínimo 4,5:1 en texto normal y 3:1 en texto grande, bordes de controles (`outline`) e indicadores de foco, en todas las combinaciones de tokens. | Must | Script de contraste sobre los tokens y axe en cada pantalla. | Hecho |
| RNF-011 | Todas las acciones se pueden hacer con teclado, en orden lógico, con foco siempre visible (anillo `primary` de 2 px) y nunca tapado por el header, toasts u otros elementos (2.4.11). | Must | Recorrido con teclado de cada flujo principal. | Pendiente |
| RNF-012 | El 100 % de los campos tiene etiqueta visible y permanente y texto de ayuda debajo con el formato y un ejemplo, asociado con `aria-describedby`; ningún placeholder reemplaza a una etiqueta o instrucción. | Must | axe y revisión de cada formulario. | Pendiente |
| RNF-013 | Ninguna pantalla tiene desborde horizontal en 320, 375, 768, 1024, 1280 y 1440 px, ni con zoom al 200 %. | Must | Test de Playwright en verde y capturas en `docs/screenshots/`. | Hecho |
| RNF-014 | Las áreas táctiles miden al menos 48 × 48 px en mobile y 24 × 24 px en desktop (2.5.8). | Must | Test de Playwright sobre elementos interactivos a 375 px y 1280 px. | Pendiente |
| RNF-015 | Las animaciones se reducen a solo opacidad, o se eliminan, con `prefers-reduced-motion` o la preferencia "reducir animaciones". | Must | Prueba con la emulación de reducción de movimiento. | Pendiente |
| RNF-016 | Cada lista vacía muestra qué va a aparecer y cómo empezar. | Must | Revisión de estados vacíos con datos limpios. | Hecho |
| RNF-017 | Los accesos de demo llevan al inicio de cualquier rol en 1 clic más la confirmación del paso MFA precargado, sin escribir nada. | Must | Prueba manual de los 4 roles. | Hecho |
| RNF-018 | No hay sombras en tarjetas en reposo ni fondos con degradé; solo se usan `--elevation-1` y `--elevation-2`. | Must | Búsqueda en el código (`shadow`, `gradient`) y revisión visual. | Hecho |
| RNF-042 | Los errores de formulario cumplen las 5 reglas de 2.10: no aparecen mientras se escribe por primera vez, se muestran en el campo con ícono y `aria-invalid`, son concretos, desaparecen al corregirse y nunca borran lo cargado (salvo contraseñas). | Must | Prueba manual con una lista de verificación por formulario. | Pendiente |
| RNF-043 | Los formularios largos (A3, A6, J3) muestran además un resumen de errores arriba con enlaces a cada campo y mueven el foco ahí. | Must | Prueba con teclado y lector de pantalla. | Pendiente |
| RNF-044 | Los campos usan `autocomplete` (`email`, `current-password`, `new-password`, `one-time-code`) y tipos de input adecuados; se permite pegar y usar gestores de contraseñas (3.3.8). | Must | Revisión de código e inspección del DOM. | Hecho |
| RNF-045 | Ningún flujo pide dos veces el mismo dato (3.3.7). | Must | Revisión de cada flujo. | Pendiente |
| RNF-046 | Toda acción de arrastrar tiene una alternativa de un solo clic (2.5.7). | Must | Prueba del constructor sin arrastrar. | Hecho |
| RNF-047 | Cada pantalla tiene landmarks, un único `h1`, encabezados sin saltos, enlace "Saltar al contenido" y `lang` según el idioma. | Must | axe y revisión de la estructura. | Hecho |
| RNF-048 | Toasts y estados se anuncian con `aria-live="polite"`; errores críticos con `role="alert"`. | Must | Prueba con NVDA o VoiceOver. | Pendiente |
| RNF-049 | Cada gráfico tiene título, resumen en texto del dato principal y la misma información en una tabla para lectores de pantalla (D-83). | Must | Revisión de A1 y demás gráficos. | Hecho |
| RNF-050 | Los estados se comunican con ícono y texto, nunca solo con color. | Must | Revisión en escala de grises. | Pendiente |
| RNF-051 | El acceso a la ayuda y a "¿Problemas para iniciar sesión?" está siempre en el mismo lugar (3.2.6). | Must | Revisión de las pantallas de acceso y del layout. | Hecho |
| RNF-052 | axe no reporta errores en ninguna pantalla, y login, recorrido del nuevo ingreso y constructor se prueban con un lector de pantalla. | Must | `@axe-core/playwright` en el test y prueba manual con NVDA o VoiceOver; hallazgos en `issues.md`. | Parcial: axe en verde; la prueba con lector de pantalla queda para líneas futuras (decisión de Lourdes, 11/11/2026) |
| RNF-053 | Todo texto usa un rol tipográfico de 2.1.2 (ningún tamaño suelto), mínimo 12 px para texto de lectura, 11 px solo en insignias, cifras tabulares en números y unidades `rem`. | Must | Búsqueda de tamaños fuera de los tokens. | Pendiente |
| RNF-055 | Los campos de fecha, número, código y correo no aceptan caracteres que no correspondan al dato, ni al escribir ni al pegar (máscaras), y las fechas se validan contra el calendario. Si se descarta un carácter, el lector de pantalla anuncia que no se aceptó y lee el valor final. | Must | Tests unitarios de `input-masks.ts`, `validation.ts` y `TextField`; prueba manual en `/styleguide`. | Hecho |
| RNF-054 | Hay un solo botón filled por región visible; todos los botones tienen los estados de 2.1.3 (reposo, hover, foco, presionado, deshabilitado y cargando) y los deshabilitados explican por qué. | Must | Revisión en `/styleguide` y en cada pantalla. | Pendiente |

### Fiabilidad

| ID | Descripción medible | Prioridad | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-019 | Todos los cambios persisten en `localStorage` al recargar. | Must | Prueba manual por función. | Pendiente |
| RNF-020 | "Restablecer demo" deja la aplicación igual a la primera visita. | Must | Prueba manual tras modificar datos de cada rol. | Pendiente |
| RNF-021 | Si `localStorage` tiene datos corruptos o de una versión anterior del esquema, la app recarga los datos semilla en lugar de romperse. | Should | Test unitario con datos inválidos. | Hecho |

### Seguridad

| ID | Descripción medible | Prioridad | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-022 | El repositorio no contiene secretos, claves de API ni datos personales reales; los correos usan `.demo`. | Must | Revisión y búsqueda de patrones antes de cada deploy. | Hecho |
| RNF-023 | Todo input se valida con Zod antes de guardarse. | Must | Revisión de código. | En curso (INC-018) |
| RNF-024 | No se usa `dangerouslySetInnerHTML` en ningún archivo. | Must | Regla de ESLint y búsqueda en el código. | Hecho |
| RNF-025 | Hay CSP en el `index.html` publicado que solo permite recursos propios (incluida la fuente Inter, alojada en el proyecto). | Must | Inspección del deploy; la consola no muestra violaciones. | Hecho |
| RNF-026 | `npm audit` corre en CI y el deploy falla con vulnerabilidades altas o críticas. | Must | Workflow de GitHub Actions. | Hecho |
| RNF-027 | Los enlaces externos usan `rel="noopener noreferrer"`. | Must | Regla de ESLint. | Hecho |
| RNF-028 | En `localStorage` no se guarda nada que simule una contraseña. | Must | Inspección del almacenamiento tras el login. | Hecho |
| RNF-029 | El 100 % de las decisiones de permisos en rutas y botones pasan por `can()`. | Must | Búsqueda de comparaciones con nombres de rol en componentes. | Hecho |

### Mantenibilidad

| ID | Descripción medible | Prioridad | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-030 | Ningún texto de interfaz está escrito directo en los componentes; todo vive en `src/locales/`. | Must | Regla de ESLint de i18n y revisión. | Pendiente |
| RNF-031 | Los colores (roles de M3 de 2.1.1), radios, espaciados y sombras se usan solo a través de tokens; no hay valores hexadecimales en los componentes y los colores de estado nunca se usan como decoración ni como series de gráficos. | Must | Búsqueda en el código. | Hecho |
| RNF-032 | Las funciones de `lib/` tienen tests unitarios y el build compila sin errores de TypeScript en modo estricto. | Must | CI. | Hecho |
| RNF-033 | Todos los íconos pasan por el componente `<Icon />`, con estilo Rounded, peso 300. | Must | Búsqueda de importaciones de íconos fuera de `<Icon />`. | Hecho |

### Flexibilidad

| ID | Descripción medible | Prioridad | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-034 | Agregar un rol o una acción requiere modificar solo `permissions.ts` y las rutas nuevas. | Should | Revisión de arquitectura. | Pendiente |
| RNF-035 | Los tokens están preparados para modo oscuro (pares claro y oscuro por rol de color). | Should | Styleguide con conmutador de prueba. | Pendiente |
| RNF-036 | Toda la interfaz está disponible en español e inglés. | Should (fase B) | Cambiar idioma y recorrer cada rol; script que compara las claves de `es.json` y `en.json` (2.508 en cada uno, sin textos sin traducir). | Hecho |

### Protección (privacidad, idioma y voz y tono)

| ID | Descripción medible | Prioridad | Cómo se verifica | Estado |
| --- | --- | --- | --- | --- |
| RNF-037 | Todos los datos son ficticios; no hay nombres, DNI ni CUIL de personas reales. | Must | Revisión de `src/data/`. | Hecho |
| RNF-038 | Los datos de ánimo nunca aparecen asociados a una persona en el panel general. | Must | Revisión de A1. | Hecho |
| RNF-039 | Todos los textos usan español latinoamericano neutro con tuteo; 0 casos de voseo o "usted". | Must | Script que busca formas de voseo (`-á`, `-é` imperativas, "vos") y "usted" en `es.json`. | Hecho |
| RNF-040 | Los textos usan el vocabulario fijo de la sección 2.9 y no contienen guiones largos (—). | Must | Script de búsqueda de términos prohibidos en `es.json`. | Hecho |
| RNF-041 | Como máximo un signo de exclamación por pantalla, solo para celebrar avances. | Should | Revisión manual de cada pantalla. | Pendiente |

---

## Referencias

Google. (s.f.). *Material Design 3*. https://m3.material.io/

International Organization for Standardization & International Electrotechnical Commission. (2023). *Systems and software engineering: Systems and software Quality Requirements and Evaluation (SQuaRE): Product quality model* (ISO/IEC 25010:2023). ISO.

International Organization for Standardization & International Electrotechnical Commission. (2025). *Information technology: W3C Web Content Accessibility Guidelines (WCAG) 2.2* (ISO/IEC 40500:2025). ISO.

World Wide Web Consortium. (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/
