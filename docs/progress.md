# Avance del proyecto

Se actualiza al terminar cada paso de la sección 10 de `CLAUDE.md`.

## Fase A: núcleo

| Paso | Descripción | Estado | Fecha |
| --- | --- | --- | --- |
| 0 | Documentación base | Hecho (revisado por Lourdes) | 10/11/2026 |
| 1 | Setup (Vite, TS, Tailwind, shadcn/ui, router, i18n, deploy) | Hecho | 10/11/2026 |
| 2 | Tokens M3, `<Icon />`, `<BentoCard />`, styleguide, test de desbordes | Hecho | 10/11/2026 |
| 3 | Datos semilla, tipos, stores y cálculos con tests | Hecho | 10/11/2026 |
| 4 | Seguridad base y layout (G0 a G7) | Hecho (con el ajuste de G0) | 10/11/2026 |
| 5 | Nuevo ingreso: N1, N2 | Hecho | 10/11/2026 |
| 6 | Plantillas: A5, A6, A7 | Hecho | 10/11/2026 |
| 7 | Ingresos: A2, A3, A4 | Hecho | 11/11/2026 |
| 8 | Jefe: J1, J2, J3 y N3 | Hecho | 11/11/2026 |
| 9 | Panel A1 con alertas | Hecho | 11/11/2026 |
| 10 | Sistemas: S1, S2, S3 | Hecho | 11/11/2026 |
| 11 | CSP, `npm audit` en CI y `docs/security.md` | Hecho | 11/11/2026 |
| 12 | Pulido de fase A | Hecho | 11/11/2026 |
| 13 | Revisión intermedia (`docs/review-fase-a.md`) | Hecho | 11/11/2026 |

## Rediseño visual (2.2.1): piloto

**Por qué:** Lourdes pidió el rediseño de la sección 2.2.1 antes del paso 7: la primera versión se veía básica y no tomaba lo de `/design-references/`.

**Qué se hizo**
- **Auditoría:** `docs/visual-audit.md`, referencia por referencia, con lo que hay que cambiar. Capturas en `docs/redesign/before/` y `docs/redesign/after/`.
- **Tokens:** `surface` tintado (`#EDF3F4`), `inverse-surface` `#1F2A30` para los tooltips de gráficos, radio de tarjeta de 20 px, padding de tarjeta de 24 px en desktop y rol tipográfico `display-medium`.
- **Componentes nuevos:** `IconTile`, `Sparkline`, `KpiCard`, `SegmentedProgress`; avatares con color por rol; barra de progreso gruesa (`size="lg"`); ícono opcional en `BentoCard`. Todos en `/styleguide`.
- **G6:** barra lateral flotante a todo el alto con el botón para plegar arriba, ítems del rol y cuenta abajo; barra superior sin franja con logo, "Ver como", Ayuda, Notificaciones y la persona; en mobile, panel lateral desde el botón de menú y barras con solo íconos (D-57, D-58, D-60, D-62).
- **G0:** página de producto B2B (D-70, D-71): barra flotante con enlaces a secciones, hero centrado con el producto en un marco, el problema, la solución en bento, una sección alternada por rol con la miniatura de su pantalla, banda de cifras calculadas, tres pasos para empezar, preguntas frecuentes y pie organizado por tareas. **Error inesperado:** página propia con salidas (D-71). **N2:** aviso de tarea bloqueada con qué hacer, responsable y vencimiento (D-69). **Accesos:** ritmo de 8 px entre secciones (D-69).
- **G1:** login en dos columnas con panel tintado, frase de valor y la vista previa del producto (solo desde 1024 px).
- **Ajustes D-64 y D-65:** contenido al 80 % del ancho en desktop, logo en una línea, persona como avatar, filas de tarea con columnas de fecha y estado, hover sin subrayado y detalle de tarea (N2) con chips y lista de detalles.
- **N1:** encabezado de saludo con fecha, nombre en color y chips de contexto (D-67); fondo gris, fotos y colores por rol, barra superior flotante (D-69); fila de KPIs como `ad2d9e23` (D-63), en una sola línea desde tablet (D-68); "Tu recorrido de ingreso" con la línea de tiempo por etapas, la frase de estado, "Ver como tabla" y "Lo próximo" (D-61); check-in con los hitos a conversar, a toda la fila en tablet con dos columnas internas (D-68); contactos en filas compactas con detalle al tocar; recorrido completo con las tareas hechas plegadas (D-59).
- **Bienvenida guiada de Sofía:** 3 pasos con ilustraciones hechas con componentes reales, puntos de progreso, "Saltar", "Anterior" y "Continuar", y cierre "Empezar mi recorrido".
- **Router:** migración a `createHashRouter` y `useBlocker` en el editor de plantillas (D-53).

**Verificación:** `tsc`, ESLint, 208 tests y 207 casos de Playwright en verde (desbordes en los 6 anchos y axe, incluida la bienvenida abierta). Recorrido manual a 375, 1280, 1680 y 1844 px.

**Pendiente:** aplicar el estilo a A5 (catálogo de tarjetas), A6, A7 y G2 a G5 (N2 ya está), y seguir con el paso 7. D-63 conviene confirmarla.

## Paso 6: plantillas (A5, A6 y A7)

**Qué se hizo**
- **A5 · Plantillas (`/admin/templates`):** tabla con plantilla y puesto, área, cantidad de tareas, cantidad de ingresos que la usan y última edición; en mobile, una tarjeta por plantilla. Menú por fila: editar, ver vista previa, duplicar y eliminar. Eliminar pide confirmación y no está disponible para plantillas en uso, con el motivo en el mismo menú (D-49). Estado vacío con la acción para empezar.
- **A6 · Editor (`/admin/templates/:id` y `/admin/templates/new`):** datos de la plantilla (nombre, puesto y área) y tareas por etapa, con el rango de días de cada una. Las tareas se reordenan arrastrando su manija (mouse, touch o teclado, con anuncios para lectores de pantalla) y, como alternativa de un solo clic (WCAG 2.5.7), desde el menú de la tarea: "Subir", "Bajar" y "Mover a etapa…". Al mover a otra etapa, el plazo se ajusta al día más cercano de esa etapa y se avisa (D-47).
- **Formulario de tarea:** título, descripción, tipo, responsable, etapa, plazo (máscara de enteros con signo, rango -30 a 90 y además el rango de la etapa) y dependencias. Las opciones que formarían una dependencia circular aparecen deshabilitadas con el motivo; las que vencen después también. Si al cambiar el plazo una dependencia elegida queda posterior, se marca como error y no se borra.
- **Guardar:** valida los datos y las reglas de la plantilla (al menos una tarea, plazos dentro de su etapa, sin ciclos ni dependencias posteriores) y, si algo falla, muestra un resumen arriba con enlaces a cada problema y mueve el foco ahí. Guardar registra `template.create` o `template.update` en la auditoría. Los recorridos existentes no cambian, porque cada ingreso copia las tareas (D-51).
- **Cambios sin guardar:** aviso visible, confirmación al volver al listado y aviso del navegador al cerrar o recargar (D-50).
- **A7 · Vista previa (`/admin/templates/:id/preview`):** el recorrido como lo ve el nuevo ingreso, con fechas calculadas desde una fecha de ingreso de ejemplo editable (13/10/2026 por defecto) y las tareas bloqueadas con su motivo. No se puede completar nada.
- **Recorridos nuevos:** se ordenan por etapa y por el orden que define RRHH en el constructor (D-52). Con los datos semilla el resultado es el mismo que antes.
- **Componentes:** `Select` nativo con etiqueta y texto de ayuda; los ítems de menú deshabilitados ahora pueden explicar por qué. Se agregó dnd-kit (versiones fijas) y los íconos `drive_file_move`, `link`, `save` y `layers`.

**Verificación**
- `tsc`, ESLint y 197 tests en verde. Los nuevos cubren las reglas del constructor (`templates.ts`) y, en pantalla, el listado, la eliminación bloqueada, el duplicado, "Bajar" y guardar, el error de rango de la etapa, la dependencia circular deshabilitada, el resumen de errores y la vista previa.
- Playwright: 198 casos en verde (desbordes en los 6 anchos y axe), con 4 pantallas nuevas.
- En el navegador: arrastre con teclado (Espacio, flechas, Espacio) con anuncio de posición, y formulario de tarea con máscara y error de rango que desaparece al cambiar de etapa.

**Pendiente:** el arrastre entre etapas se hace desde el menú (D-48). Falta la prueba con lector de pantalla real (NVDA) del constructor, prevista en el pulido de fase A.

## Paso 5: nuevo ingreso (N1 y N2)

**Qué se hizo**
- **N1 · Mi recorrido (`/me`):** grilla bento con "Lo próximo" (las 3 tareas más urgentes que dependen de la persona), "Tu avance" (porcentaje general y barra por etapa, con la etapa actual marcada), "Tu próximo check-in", "Tus contactos clave" (jefe directo, buddy y referente de RRHH, con correo) y el recorrido completo agrupado por etapa.
- **Filas de tarea:** título, tipo, responsable ("Te toca a ti" o "Responsable: …"), fecha límite con texto relativo ("Vence mañana", "Venció hace 14 días") y estado en píldora con ícono y texto. Las bloqueadas muestran "Primero completa: …" y un candado en lugar del control. Los cursos llevan "Abrir curso" en lugar del check.
- **Completar:** solo las tareas propias (`canCompleteTask` en `permissions.ts`). El check se dibuja con una transición de recorte; las tareas desbloqueadas se resaltan 1,6 s y se anuncian en un toast. Al cerrar una etapa, "¡Completaste …!" (única exclamación).
- **N2 · Detalle (`/me/tasks/:id`):** descripción, contenido simulado (lecciones del curso o material según el tipo), aviso de bloqueo con enlaces a las tareas que bloquean, aviso cuando la tarea es de otra área y tarjeta de estado. Una tarea de otro recorrido muestra "No encontramos esta página" (mínimo privilegio).
- **D-44 en los datos semilla:** la tarea de sistemas pasó a "Crear cuenta de trabajo y correo". Se subió la versión del esquema de datos a 3 para que los navegadores con datos guardados reciban el texto nuevo, y un test revisa también los datos semilla.

**Verificación**
- `tsc`, ESLint y 175 tests unitarios y de componentes en verde. Los tests nuevos cubren `canCompleteTask` y `relativeDue`, y en N1 y N2 el desbloqueo por dependencia, el bloqueo con enlace, el curso y el acceso a tareas ajenas.
- Playwright: 162 casos en verde, con desbordes en los 6 anchos y axe sin errores, incluidas 4 pantallas nuevas (N1 y N2 bloqueada, curso y vencida). Capturas en `docs/screenshots/`.
- Recorrido manual como Sofía a 1280 y 375 px: al completar "Primer análisis guiado" se desbloquea y resalta "Presentar resultados al equipo".

**Pendiente:** la autoevaluación del check-in (N3) llega en el paso 8; hasta entonces, el botón del check-in abre la pantalla "en construcción".

## Paso 4, ajuste: inicio de la demo (G0) y login limpio

**Por qué:** Lourdes actualizó F0 en `CLAUDE.md` para separar la capa de portfolio del producto (D-40).

**Qué se hizo**
- **G0 en `/`:** frase de valor, explicación de la demo, vista previa del producto (desde 768 px), 4 recorridos con 3 puntos concretos cada uno, enlace a la documentación y "Restablecer demo". El enlace al case study espera su URL (D-41).
- **G1:** login limpio con "Usa tu cuenta de trabajo de Nortia". Con `?demo=…` mostraba "Vas a entrar como…" (reemplazado por D-66: SSO con la cuenta ficticia de la persona y correo precargado). El aviso de demo quedó en una línea.
- **Botones de SSO:** logos oficiales sin modificar en `src/assets/brands/`, con nota de origen (D-42), los textos "Continuar con Microsoft" y "Continuar con Google" y el mismo componente para los dos.
- **G2:** simulación neutra y rotulada, que menciona que en producción la página llevaría la marca de Nortia. Tiene un botón "Continuar", y sin rol preseleccionado agrega la elección de cuenta de demo (D-43).
- El logo de las pantallas de acceso vuelve a G0. Restablecer la demo desde el menú de usuario también vuelve a G0.

**Verificación**
- `npm test`: 163/163, con tests nuevos de G0, del login limpio y del rol preseleccionado.
- `npm run test:e2e`: 135/135. Son 15 pantallas en 6 anchos sin desborde, axe sin violaciones y un único `h1`.
- Recorrido manual: G0, "Recorrer como Carla", login con aviso, G2, "Continuar", G3 con código precargado y A1.

**Pendiente**
- D-41 (URL del case study) y D-44 (unificar "cuenta de trabajo" en G4).

## Paso 4: seguridad base y layout (G1 a G7)

**Qué se hizo**
- `lib/permissions.ts`: matriz rol × acción con alcances (todo, equipo, propio), `can()`, `visibleHires()`, inicio de cada rol y permiso por ruta. La tabla de `docs/roles.md` se genera desde ahí y un test verifica que coincidan (D-08).
- Store de sesión: sesión simulada, inicio de sesión en curso, ruta a la que volver, dispositivos recordados y MFA opcional.
- `features/auth/auth-service.ts`: contraseña de demo, error genérico, bloqueo a los 5 intentos (también para correos inexistentes, D-37), SSO simulado, MFA con código y código de respaldo, recordar dispositivo, cambio forzado de contraseña (D-32), cerrar sesión, cambio de rol (D-35), restablecer demo y solicitudes de acceso. Todo queda en la auditoría.
- Pantallas:
  - **G1 Login:** SSO primero, correo y contraseña, 4 accesos de demo, aviso de demo, mensajes al cerrar sesión, "¿Problemas para iniciar sesión?" y "Restablecer demo" siempre en el mismo lugar.
  - **G2 SSO simulado:** redirección y elección de cuenta. Los accesos de demo avanzan solos.
  - **G3 Verificación en dos pasos:** un solo campo que acepta pegado, código precargado en la demo, código de respaldo y "Recordar este dispositivo".
  - **Contraseña nueva:** requisitos tildados en vivo e indicador de seguridad, con un solo campo y "Mostrar contraseña" (WCAG 3.3.7).
  - **G4 Problemas para iniciar sesión:** canales de la mesa de ayuda, aclaración sobre SSO, formulario, error de servidor simulado con `#error` (D-36), confirmación igual exista o no el correo, y "Ver como sistemas (demo)".
  - **G5 Mi seguridad:** cuenta, MFA obligatorio u opcional según el rol y dispositivos recordados.
  - **G6 Layout:** header con selector "Ver como" y menú de usuario, sidebar completo (≥ 1280 px), riel de íconos (768 a 1279 px) y menú inferior (< 768 px). Aviso de sesión por vencer al minuto 13 y cierre al 15, con control de demo para verlo.
  - **G7:** acceso no permitido (registrado en la auditoría) y página no encontrada.
- Rutas de los 4 roles con pantallas provisorias hasta su paso (D-38) y carga diferida por rutas (INC-006).
- Componentes nuevos: InlineAlert, TextArea, Checkbox, RadioGroup, DropdownMenu, Avatar, Card, PageHeader y Logo.

**Verificación**
- `npm test`: 160/160, con 22 tests nuevos de autenticación y permisos y uno de sincronización entre `roles.md` y el código.
- `npm run test:e2e`: 108/108. Son 12 pantallas en 6 anchos sin desborde, axe sin violaciones a 375 y 1280 px, y un único `h1`.
- Recorrido manual en el navegador:
  - Login de demo de Sofía (SSO, MFA y "Mi recorrido").
  - Cambio de rol a Sistemas.
  - Aviso de sesión: el foco cae en "Seguir conectado" y Enter extiende la sesión.
  - Acceso denegado a `/admin` registrado en la auditoría.
  - G4 con `#error`, "Reintentar", confirmación IT-2026-0142 y "Ver como sistemas", que abre la solicitud como Diego.

**Pendiente**
- RF-010 queda parcial hasta que S2 exista (paso 10).
- INC-006: bajar el peso del JS inicial en el paso 12.

**Problemas encontrados**
- INC-006 a INC-010.

## Paso 3: datos, reglas de negocio y store

**Qué se hizo**
- Tipos del modelo de datos de la fase A (`src/types/domain.ts`).
- `lib/dates.ts`: `DEMO_TODAY = 2026-11-10`, cálculo de fechas, etapas según el plazo, formatos DD/MM/AAAA y números con punto y coma.
- `lib/journey.ts`: `dueDate`, estados derivados (`blocked` y `overdue`, nunca guardados), tareas que bloquean, "Lo próximo", progreso general y por etapa, estado del ingreso, desbloqueo al completar y validación de dependencias del constructor (ciclos, dependencias con plazo posterior, referencias inexistentes).
- `lib/metrics.ts`: KPIs, avance por ingreso y por cohorte, atrasos por responsable (atribuidos a quien bloquea, D-30), alertas y ánimo agregado.
- Datos semilla en `src/data/`: 18 personas, 3 plantillas (18, 16 y 14 tareas), 11 ingresos, 52 eventos de auditoría, 6 solicitudes de acceso, una cuenta bloqueada y las políticas. `seed.ts` genera las tareas y los check-ins (D-29).
- Store de Zustand persistido en `localStorage`, con versión de esquema, recuperación ante datos corruptos y `resetData()`. Por ahora tiene las acciones `logAudit` y `completeTask`; el resto se agrega con cada pantalla.

**Cómo queda la demo con la semilla**
- 6 ingresos activos, 2 próximos a ingresar y 3 finalizados.
- 86 % de tareas a tiempo, 5 recorridos con atraso y 75 % de avance promedio.
- IT es el cuello de botella: 7 tareas atrasadas, contra 3 de la persona nueva y 1 del jefe.
- Alertas: el check-in escalado de Valentina, tareas bloqueadas de Lucas (42 días) y de Agustina (13 días), y los check-ins vencidos de Camila y Valentina.
- Sofía, el día 28: 72 % de avance, una lectura vencida, "Primer análisis guiado" en curso, que vence hoy, y el check-in de 30 días pendiente para el 12/11/2026.

**Verificación**
- `npm test`: 133/133. Incluye un test de integridad que verifica cada requisito de "Datos semilla" de la sección 7: cantidades, Sofía en el mes 1, atrasos, bloqueos, escalamiento, auditoría, solicitudes y políticas.

**Pendiente**
- Nada: D-30 quedó confirmada e incorporada en F4.

## Paso 2: sistema de diseño

**Qué se hizo**
- `src/styles/tokens.css`: roles de color de M3 (incluidos los personalizados de estado), superficies, series de gráficos, forma, espaciado de layout, dos niveles de elevación, movimiento y capas de estado. Roles oscuros preparados, sin activar.
- Tema de Tailwind limitado a los tokens: no existen paletas, tamaños de texto, radios ni sombras por defecto.
- Inter alojada en el proyecto. 11 roles tipográficos de M3 como utilidades (`text-title-medium`, etc.).
- `<Icon />` con 90 íconos Material Symbols Rounded 300, generados por script (`npm run icons`).
- Componentes base: Button, IconButton, Tooltip, TextField, StatusPill, FilterChip, SegmentedButton, ProgressBar, Skeleton, BentoGrid, BentoCard, Table, Dialog, ConfirmDialog y Toaster.
- Animaciones con Motion y reducción de movimiento (sistema y preferencia de la app).
- `/styleguide`, solo en desarrollo, con todos los tokens y componentes.
- Playwright: test de desbordes (3 pantallas × 6 anchos, capturas en `docs/screenshots/`) y axe (WCAG 2.2 AA) a 375 y 1280 px.
- `docs/design-system.md` con los valores implementados.

**Verificación**
- `npm test`: 59/59 (incluye 51 de contraste de tokens; la serie de gráficos 4 se reemplazó por `#B9779D`, D-22). `npm run test:e2e`: 27/27. Lint y build sin errores.
- JS inicial: 149 KB gzip (límite de RNF-005: 300 KB). `/styleguide` no está en el build.
- Capturas revisadas a 375 y 1280 px.

**Pendiente**
- El patrón de tablas como tarjetas en mobile se implementa con los listados (paso 7). La validación de formularios con React Hook Form y Zod, desde el paso 4.

**Ajuste pedido por Lourdes: validación de campos**
- Máscaras de entrada (fecha, entero, código, sin espacios) integradas en `TextField`, y esquemas de Zod con mensajes concretos.
- Formulario de ejemplo con React Hook Form en `/styleguide`. Probado en el navegador con teclado real: letras bloqueadas, fecha inexistente marcada, error que desaparece al corregir.
- Aviso para lectores de pantalla cuando una máscara descarta un carácter, con el valor final (D-28), como pide la sección 2.10 actualizada.
- `CLAUDE.md` actualizado por Lourdes (máscaras en 2.10 y rango del plazo en F2) y verificado contra lo implementado. Se restauró en 2.1.1 la serie de gráficos 4 `#B9779D`, confirmada en D-22.
- `npm test`: 83/83.

**Problemas encontrados**
- INC-002 a INC-005, todos resueltos.

## Paso 1: setup

**Qué se hizo**
- Proyecto Vite 8 + React 18.3.1 + TypeScript 6 (modo estricto), con alias `@/` hacia `src/`.
- Tailwind CSS 4 (plugin de Vite) y `tw-animate-css`. Base de shadcn/ui: `components.json` y utilidad `cn()`. Los componentes se agregan en el paso 2, ya adaptados a M3.
- React Router 7 con `HashRouter`: la ruta `/` muestra una página provisoria y cualquier otra ruta, un 404 provisorio.
- react-i18next con `src/locales/es.json` y `en.json`. Español por defecto y `<html lang>` sincronizado con el idioma.
- Accesibilidad mínima desde el inicio: enlace "Saltar al contenido", landmark `main`, un único `h1` y `prefers-reduced-motion`.
- Vitest + Testing Library: 6 tests (estructura, 404, mismas claves en ambos idiomas, sin voseo, "usted" ni guiones largos, `lang` dinámico).
- ESLint 10 con `typescript-eslint` y `react-hooks`. Prohíbe `dangerouslySetInnerHTML` y `eval`.
- Workflow `.github/workflows/deploy.yml`: `npm ci`, `npm audit --audit-level=high`, lint, tests, build y deploy a GitHub Pages.
- Dependencias con versión exacta (`.npmrc` con `save-exact`) y `package-lock.json`.
- Repositorio público [lpedaci/rumbo-app](https://github.com/lpedaci/rumbo-app), rama `main`. `design-references/` queda fuera del repo (capturas de terceros, solo de uso local).
- Demo publicada: https://lpedaci.github.io/rumbo-app/

**Verificación**
- `npm run lint`, `npm test` (6/6) y `npm run build` sin errores. JS inicial: 77 KB gzip.
- Build de producción revisado en el navegador: inicio y 404 se ven bien, `lang="es"`, sin errores de consola y sin desborde horizontal a 320 px.

**Pendiente**
- CSP: paso 11 (D-20).

**Problemas encontrados**
- El primer deploy publicó la rama `main` sin compilar (página en blanco) porque Pages estaba en "Deploy from a branch". Se resolvió cambiando la fuente a GitHub Actions.
- INC-001: vulnerabilidades moderadas en herramientas de lint (solo desarrollo).

## Paso 0: documentación base

**Qué se hizo (versión 1)**
- Índice, proto-personas, roles y matriz de permisos propuesta, requerimientos, casos de uso, flujos y diagramas de estados, decisiones e incidencias.

**Qué se hizo (versión 2, tras la actualización de `CLAUDE.md`)**
- `decisions.md`: 5 decisiones quedaron resueltas en la spec (paleta, tipografía, `DEMO_TODAY`, límites de etapas, `lockoutMinutes`). Se agregaron D-12 a D-16.
- `requirements.md`: accesibilidad llevada a WCAG 2.2 AA (13 RNF nuevos o reescritos), ancho mínimo de 320 px, áreas táctiles de 48 px, roles tipográficos y jerarquía de botones, error de servidor simulado (RF-086) y referencias APA.
- `flows.md`: reorganizado por tipo de diagrama, con 10 task flows lineales, 5 user flows con decisiones y la definición de 3 wireflows.
- `information-architecture.md`: documento nuevo con los cuatro sistemas, mapa del sitio, plantillas de página y plan de validación.
- `personas.md`: referencia APA a *Lean UX*.

**Pendiente**
- Revisión de Lourdes antes del paso 1.
- Confirmar D-09 (quién marca las tareas del buddy y de otras áreas).
- Corregir en `CLAUDE.md` la sección 2.7 (44 px y "5 anchos"), ver D-12 y D-13.
- Wireflows con capturas: pasos 4 a 6. `design-system.md`: paso 2.

**Problemas encontrados**
- Ninguno. Las ambigüedades de la especificación están en `decisions.md`.

## Indexación, difusión y pantallas de acceso (D-76), 11/11/2026

- G2 y G3 entran sin scroll en pantallas de laptop (columna más ancha, centrada y compacta en pantallas bajas).
- Metadatos para buscadores y redes, tarjeta OG generada con `npm run og`, `robots.txt`, `sitemap.xml`, manifiesto e íconos.

## Paso 7: ingresos (A2, A3, A4), 11/11/2026

**Qué se hizo**
- **A2 Ingresos:** listado con filtros por estado (con cantidades) y por área, tabla desde 768 px (persona, ingreso, estado, avance, atrasos, próximo check-in) y tarjetas en mobile; estados vacíos con "Quitar filtros".
- **A3 Alta de ingreso:** formulario con validación al salir del campo, autocompletado desde la plantilla y un resumen del recorrido antes de guardar (cuenta de trabajo, tareas y rango de fechas, check-ins, estado). Al guardar genera el recorrido (`dueDate = startDate + offsetDays`), registra `hire.create` en la auditoría y abre la ficha.
- **A4 Ficha del ingreso:** KPIs (avance, vencidas, etapa, próximo check-in con cuenta regresiva), recorrido por etapa donde RRHH completa tareas de cualquier responsable, datos del ingreso e historial de check-ins con autoevaluación, hitos y escalamientos.
- Lógica en `src/lib/hires.ts` con tests; acción `addHire` en el store; tests de componentes; A2 a A4 en las pruebas de desbordes y axe.

**Pendiente**
- Paso 8: J1, J2, J3 y N3.

## Paso 8: jefe directo y check-ins (J1, J2, J3, N3), 11/11/2026

- **J1 Mi equipo:** saludo con contexto, KPIs (en onboarding, check-ins próximos, autoevaluaciones listas, tareas propias), tarjetas por persona con avance, atrasos y próximo check-in con cuenta regresiva, y "Hacer check-in" cuando corresponde.
- **J2 Detalle del ingreso:** la ficha de A4 adaptada al jefe (vuelta a su equipo, solo sus tareas, acceso al check-in).
- **J3 Check-in:** hitos con resultado, comentarios y próximos pasos; un hito no cumplido pide reprogramar o escalar a RRHH, que genera la alerta del panel y queda en la auditoría.
- **N3 Autoevaluación:** cómo se siente y un comentario breve; editable hasta el check-in.
- Lógica en `src/lib/checkins.ts`, acciones `submitSelfReview` y `completeCheckin` en el store, componente `ChoiceGroup`, tests de componentes y J1 a N3 en las pruebas de desbordes y axe.

**Pendiente:** paso 9 (A1, panel de seguimiento con alertas) y paso 10 (S1 a S3).

## Ajustes D-83 y D-84, 11/11/2026

- Contactos clave completos en desktop, sin "Ver como tabla" (la tabla queda para lectores de pantalla) y chips `RefChip` para las referencias a otras secciones (N1, G0, pantallas en construcción).
- Fechas de las filas de tareas jerarquizadas en N1, A4, J2 y A7, y "Lo próximo" sin datos repetidos.
- Martín pasa a llamarse Martín Rossi; Nicolás Acosta tiene foto. Versión de datos guardados 4.

## Ajustes D-85, 11/11/2026

- Pie de acciones dentro de la tarjeta en N3, J3 y A3 (`FormFooter`).
- Check-ins de la ficha (A4, J2) como línea de tiempo con el próximo destacado y el detalle plegado.
- Escala de ánimo en lista para formularios angostos; "Te toca a ti" según quién mira la ficha.

## Paso 9: panel de seguimiento A1, 11/11/2026

- **Saludo** con los chips de contexto: ingresos en curso, por ingresar, alertas (resaltado) y ánimo promedio agregado.
- **KPIs** de F4 (ingresos activos, tareas a tiempo, recorridos con atraso, avance promedio), calculados en `src/lib/metrics.ts`.
- **Avance de los recorridos** (gráfico principal, Recharts): por cohorte como área con relleno plano al 12 % y tooltip oscuro, o por ingreso como barras con la persona; resumen en texto y tabla para lectores de pantalla.
- **Alertas** de la más urgente a la menos: check-ins escalados, tareas bloqueadas (con a quién esperan), check-ins atrasados y tareas vencidas; cada una abre la ficha (A4).
- **Dónde se traban:** tareas vencidas por responsable, atribuidas a quien bloquea (D-30), con el principal cuello de botella en ciruela.
- **Próximos ingresos:** cuenta regresiva y avance del preingreso.
- Recharts 2.15.4 instalado con versión fija; `npm audit --audit-level=high` sigue en verde. Test de componente del panel (KPIs que cambian con los datos, alertas, cambio de vista).

**Pendiente:** paso 10 (S1 a S3, admin de sistemas).

## Paso 10: admin de sistemas (S1, S2, S3), 11/11/2026

- **S1 Bandeja de solicitudes:** saludo de Diego con solicitudes abiertas y cuentas bloqueadas, KPIs (nuevas, en verificación, cuentas bloqueadas, resueltas), filtros por estado (chips desde 640 px, menú en celulares) y tabla con número, persona, motivo, fecha y estado; las abiertas primero. Filas compactas por debajo de 1024 px.
- **S2 Detalle:** dos pasos. 1) Verificar la identidad con los datos de la ficha (llamada al celular registrado o validación con el jefe directo), nunca con datos de la solicitud; 2) restablecer el acceso (desbloquear, forzar cambio de contraseña o restablecer la verificación en dos pasos), habilitado solo con la identidad verificada, o rechazar con motivo obligatorio. Al costado: quién la pide, estado de la cuenta e historial de la auditoría.
- **S3 Seguridad y auditoría:** pestañas de cuentas bloqueadas (desbloqueo directo con confirmación), auditoría (filtros por usuario, tipo y período, exportación a CSV que queda registrada), matriz de permisos generada desde `permissions.ts` y políticas vigentes.
- Lógica en `src/lib/access.ts` y acciones del store (`startVerification`, `verifyIdentity`, `resolveAccessRequest`, `rejectAccessRequest`, `unlockAccount`), cada una con su evento de auditoría. Tests de reglas, store y pantallas; S2 y S3 en las pruebas de desbordes y axe.
- Con este paso todas las pantallas de la fase A tienen su versión funcional.

**Pendiente:** paso 11 (seguridad real del front y `docs/security.md`), paso 12 (pulido) y paso 13 (revisión intermedia).

## Paso 11: seguridad real del front y docs/security.md, 11/11/2026

- **CSP** en el build como `<meta>` (plugin de Vite, solo en producción): solo recursos propios, scripts estrictos y estilos en línea permitidos por Radix, Motion y Recharts. Verificada con `vite preview`: sin violaciones al recorrer pantallas y abrir menús y diálogos.
- **Referrer policy** `strict-origin-when-cross-origin` en el build.
- **CI:** nuevo control que falla si el build sale sin CSP; `npm audit --audit-level=high` ya estaba.
- **`docs/security.md`:** las tres capas, amenazas y mitigaciones, diagrama del inicio de sesión en producción y referencias APA.

**Pendiente:** paso 12 (pulido de fase A) y paso 13 (revisión intermedia).

## Web del sistema de diseño y README, 11/11/2026 (D-98)

- Sitio público del sistema de diseño en `/#/design-system`, construido con los tokens y componentes reales; enlace en el pie de G0 y en el README.
- README con el hero capturado con todo cargado, sin capturas por rol, con un diagrama de contexto C4 y las figuras de niveles de tokens y de capas exportadas desde el sitio.
- Las capturas de página completa de `docs/screenshots/` ahora muestran las secciones que aparecen al hacer scroll.

## Paso 12: pulido de fase A, 11/11/2026 (D-99)

- **Rendimiento:** pantallas de los pasos 7 a 10 cargadas bajo demanda e inglés bajo demanda; JS inicial de 481 a 280 KB comprimido (RNF-005).
- **Validación:** los formularios que quedaban (J3, N3, S2, contraseña nueva) usan esquemas de Zod (INC-018).
- **Accesibilidad:** toasts arriba al centro en desktop para no tapar acciones ni el foco (2.4.11).
- **Estados vacíos y "Restablecer demo":** revisados en todas las listas; restablecer está en el pie de G0 y en el menú de usuario.
- **Requerimientos:** los de la fase A construidos y verificados pasan a "Hecho" en `requirements.md`; lo que necesita prueba manual (lector de pantalla, navegadores, Lighthouse) queda para la revisión intermedia.

**Pendiente:** paso 13 (revisión intermedia, `docs/review-fase-a.md`).

## Paso 13: revisión intermedia, 11/11/2026

- `docs/review-fase-a.md` con la estructura de la sección 13: fase A al 95 % (funciones completas), fase B al 10 %.
- Pendientes de la fase A: wireflows con capturas y verificaciones manuales (teclado, lector de pantalla, Lighthouse, Firefox y Safari).
- Confirmaciones pendientes de Lourdes: licencia de las fotos nuevas (D-93), crédito en el case study (D-92), criterios de D-53, D-95 y D-99.

## Cierre de la fase A, 11/11/2026 (D-100)

- Wireflows con capturas en `docs/flows.md`: inicio de sesión con MFA, recorrido del nuevo ingreso y crear y guardar una plantilla.
- Licencia de las cinco fotos nuevas confirmada (D-93); el crédito para el case study queda redactado en `docs/README.md`.
- La prueba con lector de pantalla pasa a líneas futuras.
- **Fase A cerrada.** Siguiente: fase B, empezando por F7 (notificaciones).

## Encabezado de la barra lateral, 11/11/2026 (D-101)

- Rótulo "Menú" arriba de la barra lateral expandida, junto al botón de plegar. El logo se mantiene en la barra superior.

## Pie de G0 con la autoría y los perfiles, 11/11/2026 (D-102)

- "Diseño y desarrollo: Lourdes Pedaci…" con botones de ícono a LinkedIn, portfolio y GitHub; copyright centrado abajo.

## Componentes por contenedor y pies con autoría, 11/11/2026 (D-103)

- `FormFooter` y `TaskRow` con container queries; el test de Playwright detecta textos aplastados y botones fuera de su tarjeta.
- Autoría en una línea con LinkedIn, portfolio y GitHub (`AuthorLinks`) en el pie de G0 y del sitio del sistema de diseño.
- Títulos e introducciones del sitio del sistema de diseño a todo el ancho.

## Volver arriba y menú de secciones, 11/11/2026 (D-104)

- Botón "Volver arriba" en G0, el sitio del sistema de diseño y la app.
- Sitio del sistema de diseño: barra fija "Secciones | sección actual" con panel lateral del índice en tablet y mobile.

## Paso 14 · F7 Notificaciones, 11/11/2026 (D-105)

- Motor de eventos en `src/lib/notifications.ts`: tipos con su ícono, categoría y canal; avisos generados al completar tareas, autoevaluaciones, check-ins, solicitudes de acceso y altas; semilla derivada de los datos de demo con ids estables.
- Store: `notifications` persistidas (esquema 6), "Marcar como leída / no leída" y "Marcar todas como leídas".
- Campana en la barra superior con contador de no leídas y panel con los 5 más nuevos; en celulares lleva a G9. Toast para los avisos que llegan durante la sesión.
- G9 (`/notifications`): filtros "Todas / No leídas" y por tipo, grupos Hoy, Últimos 7 días y Anteriores, y vista previa del correo simulado.
- Permiso `notification:view` (cada persona ve solo las suyas), tests unitarios del motor y G9 en el test de Playwright (desbordes y axe) para nuevo ingreso y sistemas.
- Pendiente: preferencias por tipo y canal (F17) y notificaciones de comentarios (F9), privacidad (F10) y aprobaciones (F14) cuando existan esas funciones.

## Paso 15 · F8 Versiones de plantillas, 11/11/2026 (D-108)

- Modelo: `Template.versions` (publicadas, con nota) y `Template.tasks` como borrador; estado derivado; `Hire.templateVersion`. Esquema de datos 7.
- A6: "Guardar borrador" y "Publicar" con resumen de cambios y nota obligatoria; el estado y los ingresos que usan la plantilla en el encabezado.
- A8 (`/admin/templates/:id/versions`): historial, comparación entre versiones o con el borrador y "Restaurar como borrador".
- A5 muestra el estado de cada plantilla; A3 solo ofrece plantillas publicadas (con su versión); A4 muestra la versión del recorrido y aclara si hay una más nueva.
- Auditoría: `template.publish` y `template.restore`. Tests de publicación y restauración, y A8 en Playwright.
- También: correos completos en todo el producto (D-110) y más aire en los encabezados de página (D-111).

## Paso 16 · F9 Comentarios en tareas, 11/11/2026 (D-112)

- Modelo `Comment` (con `hireId`), semilla en 4 tareas y esquema de datos 8. Store: comentar, editar (marca "editado") y borrar (marca "Comentario eliminado").
- `CommentThread`: hilo en lista con divisores, texto plano con las menciones resaltadas, chips "Mencionar a…", validación con Zod y acciones del autor en un menú.
- N2: tarjeta "Comentarios"; J2 y A4: botón con la cantidad en cada tarea que abre el hilo en un diálogo, también desde las notificaciones.
- Avisos "Te mencionaron" y "Comentario nuevo" (F7) y permiso `comment:write`.
- Tests del motor y de N2, y el diálogo en el test de Playwright.

## Paso 17 · F10 Privacidad y datos personales, 11/11/2026 (D-113)

- Modelo: `ConsentRecord`, `PrivacyRequest`, identificadores ficticios en `Person` (DNI, CUIL, CBU) y retención en `SecurityPolicy`. Esquema de datos 9.
- G8 (`/consent`): aviso en 4 pasos con casilla obligatoria; la app redirige ahí a quien no aceptó la versión vigente y después vuelve a la pantalla pedida.
- G10 (`/account/privacy`): aviso aceptado y su texto, datos propios con identificadores ocultos y solicitudes de acceso, rectificación o supresión con plazo legal.
- A12 (`/admin/privacy-requests`): bandeja de RRHH con filtros, plazo en palabras (vencidas en rojo) y detalle para tomar, responder o rechazar con una respuesta escrita.
- `MaskedValue`: dato oculto con "Mostrar" para RRHH, con motivo y auditoría (`pii.reveal`), en la ficha del ingreso.
- Retención en la pantalla de políticas de sistemas y fecha de anonimización en los ingresos finalizados.
- Avisos: "Solicitud de datos nueva" a RRHH y "RRHH respondió tu solicitud" a la persona. Permisos `privacy:own`, `privacy_request:manage` y `pii:reveal`.
- Tests de reglas, del aviso, de solicitudes y del revelado; G8, G10 y A12 en Playwright con axe.
- Plazos legales confirmados por Lourdes y llevados a `src/app/legal.ts` (`PRIVACY_DEADLINES`); la semilla y los textos los toman de ahí. Tests con una solicitud creada un viernes y de que ningún plazo en días hábiles caiga en fin de semana.

## Paso 18 · F11 Sesiones y alertas de inicio de sesión, 11/11/2026 (D-114)

- Modelo `DeviceSession` y `LoginAlert`, semilla con sesiones por persona y una alerta pendiente para Sofía (esquema de datos 10).
- "Mi seguridad": "¿Fuiste tú?" con "Sí, fui yo" y "No fui yo", sesiones activas con "Esta sesión", "Cerrar esta sesión" y "Cerrar las demás sesiones".
- "No fui yo": cierra la sesión, crea la solicitud urgente para sistemas (primera en S1, píldora "Urgente") y avisa a sistemas.
- S3: pestaña "Sesiones" con las sesiones de la organización y "Forzar cierre". Permiso `session:manage`.
- Avisos "¿Fuiste tú?" e "Inicio de sesión no reconocido"; eventos de auditoría de sesiones y alertas. Tests de las tres acciones y del cierre forzado.

## Paso 19 · F15 Personas y catálogos, 11/11/2026 (D-116)

- Catálogos de áreas y puestos (con plantilla y accesos sugeridos) y personas enlazadas a ellos; modelo `ApprovalRequest` (esquema de datos 11).
- A9 (`/admin/people`): pestañas Personas, Áreas y Puestos; búsqueda y filtros por área, rol y estado; "Dar de alta una persona".
- A10 (`/admin/people/:id`): encabezado de ficha, datos laborales editables con identificadores ocultos, rol en Rumbo (los roles de RRHH y sistemas piden aprobación de sistemas) e historial de cambios desde la auditoría.
- Permisos `person:manage` y `catalog:edit`; aviso "Cambio de rol por aprobar" a sistemas. Tests de reglas, catálogos y pantallas; A9 y A10 en Playwright.
- Pendiente: aprobar o rechazar los cambios en S7 (F14).
- Prueba manual en el navegador de catálogos y alta de persona: agregar, renombrar (con cambio en todas las personas del área) y eliminar áreas; agregar puestos con plantilla y accesos; alta de persona con correo y legajo automáticos; cambio de rol. Correcciones: el foco va al primer campo con error en los diálogos, Enter envía los formularios de varios campos, el historial y la auditoría muestran los roles por su nombre y el cambio de rol guarda el motivo. Se registró INC-021 (fechas de la sesión después de las 21 h).

## Paso 20 · F12 Ciclo de vida de accesos, 11/11/2026 (D-117)

- Modelo `LifecycleEvent` con tareas de accesos (`grant` o `revoke`), reglas en `src/lib/lifecycle.ts` (alta, cambio y baja a partir del catálogo de puestos, estado programado, en curso o completo) y cuatro movimientos semilla (dos altas, un cambio de puesto y una baja).
- A11 (`/admin/lifecycle`): movimientos con avance, filtros por tipo, detalle en un diálogo y registro de cambios de puesto y bajas con validación, foco en el primer error y vista previa de los accesos que se generan.
- S4 (`/it/lifecycle`): una tarjeta por movimiento con "Marcar como hecho" en cada acceso, filtro de pendientes y enlace desde los avisos (`?event=`).
- El alta de ingreso (A3) crea su movimiento; la baja efectiva deshabilita la cuenta y cierra sus sesiones; avisos a sistemas y al jefe directo; auditoría de cada paso. Permisos `lifecycle:manage` y `access_task:complete`.
- Prueba manual en el navegador: baja de Bruno Castro (cuenta deshabilitada, avisos y auditoría), cambio de puesto programado de Valentina Ruiz, marcado de accesos como sistemas y vista de celular. Correcciones: no se ofrece a quien ya tiene una baja o un cambio por venir; en celulares "Marcar como hecho" va debajo del texto; sin "·" suelto al cortar la línea.
- INC-021 resuelta: las acciones de la sesión se fechan siempre en el día de la demo.
- Tests de reglas, store y pantallas; A11 y S4 en Playwright.

## Paso 21 · F14 Doble aprobación, 11/11/2026 (D-118)

- Reglas en `src/lib/approvals.ts`: quién no puede decidir (quien pidió, la persona afectada o una solicitud ya decidida), rangos de las políticas, un cambio pendiente por política y orden de la bandeja.
- S7 (`/it/approvals`): solicitudes con filtros (pendientes, resueltas, todas), detalle con qué cambia, quién lo pidió y por qué, y "Aprobar y aplicar" o "Rechazar" con nota obligatoria. Quien no puede decidir ve el motivo y solo "Cerrar".
- S3: "Proponer un cambio" en Políticas y la línea del cambio pendiente en cada política.
- Aprobar un cambio de rol lo aplica en la ficha (A10) y aprobar una política la cambia en toda la demo (bloqueo, contraseña o duración de la sesión). Avisos a sistemas y a quien pidió el cambio; auditoría de pedidos, decisiones, intentos denegados y cambios aplicados. Permisos `approval:decide` y `policy:propose`.
- Datos semilla: Ramiro Sosa como segunda persona de sistemas y tres solicitudes (dos pendientes y una rechazada).
- Prueba manual en el navegador: rechazo sin nota (error y foco), aprobación del rol de Julieta, propuesta de política con errores, cambio pendiente y bloqueo de la solicitud propia, vista de celular. Correcciones: el rol básico se lee "Acceso básico" como en Personas, las opciones de política empiezan con mayúscula y en celulares el estado va arriba del título.
- Tests de reglas, store y pantallas; S7 en Playwright.
- Pendiente: revelado masivo de datos sensibles por esta bandeja, con la exportación de F16.
- Ajuste pedido por Lourdes (12/11/2026, D-118 confirmada): la solicitud de contraseña ahora la pide Diego y espera a Ramiro; la fila dice "Esperando a Ramiro Sosa" y el detalle ofrece "Resolver como Ramiro Sosa (demo)", que decide en su nombre con la marca "decisión simulada en la demo" en la auditoría. `docs/security.md` aclara que en producción hacen falta al menos dos personas de sistemas. Corrección durante la prueba: un selector que devolvía un arreglo nuevo en cada render hacía caer la pantalla.

## Paso 22 · F13 Revisión de accesos, 12/11/2026 (D-120)

- Reglas en `src/lib/access-review.ts`: revisor de cada persona (jefe directo, RRHH o sistemas, nunca uno mismo), alcance con las cuentas admin siempre incluidas, filas por acceso del puesto y por rol de admin, estado derivado de cada fila (incluida la doble aprobación), avance por revisor, condiciones de cierre y resumen CSV.
- J4 (`/manager/access-review`, también para RRHH en `/admin/access-review` y para sistemas en `/it/access-review`): una sección por persona con "Mantener", "Revocar" (con motivo) y "Mantener los N pendientes"; las personas ya revisadas se pliegan.
- S5 (`/it/access-reviews`): campañas con avance, alcance y vencimiento, "Crear campaña" (nombre, fecha límite, alcance y vista previa de cuántos accesos y revisores) y un aviso cuando a sistemas le toca revisar.
- S6 (`/it/access-reviews/:id`): avance por revisor con el motivo de cada asignación y recordatorios, revocaciones para ejecutar o en aprobación, cierre y descarga del resumen.
- Revocar un rol de admin abre la doble aprobación (F14); avisos a cada revisor al crear la campaña y en los recordatorios; auditoría con el nombre de la campaña. Permisos `access_review:manage` y `access_review:review`.
- Prueba manual en el navegador: Martín revoca Jira de Agustina (con error de motivo vacío y foco), Carla pide quitar el rol de admin de Ramiro, Diego ejecuta una revocación y aprueba la de Ramiro, y la fila pasa a "Revocado". Correcciones: sin recordatorio a uno mismo, personas revisadas plegadas y la acción principal arriba en celulares.
- Tests de reglas, store y pantallas; J4, S5 y S6 en Playwright.

## Ajustes · Mínimo de dos personas de sistemas, roles como chips y hero de G0, 12/11/2026 (D-121, D-122)

- Regla de separación de funciones: sistemas nunca queda con menos de dos personas activas. Se aplica en la revocación de una campaña (fila "Revocación bloqueada"), el cambio de rol de A10 y la baja de A11, al pedir y al aprobar (S7 deshabilita "Aprobar y aplicar" con el motivo). Cada intento queda auditado como `denied`, con el motivo legible en S3 y en el historial de A10.
- Revisión del sistema de diseño: los roles que se muestran como dato van en `RoleChip` (S7, J4, S6 y G5, que tenía un chip propio); el texto del cambio pendiente en A10 lee "Acceso básico" como en Personas.
- G0: las tarjetas del hero solo desde 1280 px.
- Tests: la revocación del rol de Ramiro queda bloqueada, la nueva verificación al aprobar, el cambio de rol y la baja; y la revocación con tres personas en sistemas sí pasa a aprobación.
- Ajustes al sistema de diseño (D-123): detalle de movimientos de A11 con la anatomía de las ventanas de detalle; fecha efectiva en su línea en las filas de A11 y S4; "Te toca revisar" de S5 con `RefChip`. G0: tres pantallas chicas superpuestas y desvanecidas desde 640 px, en lugar de las tarjetas flotantes; en celulares, solo el texto. Se registró y resolvió INC-022 (capturas de Sofía con el aviso de privacidad).

## Ajustes · Jefa de RRHH y correos completos, 12/11/2026 (D-120 cerrada, D-125)

- Valeria Ortiz, Gerenta de Personas, en los datos como jefa directa de Carla (sin cuenta de demo, rol de jefe directo, sin permisos de admin). En la campaña, a Carla la revisa Valeria y en S6 sistemas puede usar "Resolver como Valeria Ortiz (demo)", auditado como decisión simulada.
- `EmailText`: correos completos en dos líneas antes de la "@" cuando no entran.
- Tests: revisora de Carla y de Valeria, y el atajo con su registro en la auditoría.

## Paso 23 · F16 Búsqueda, ayuda contextual y exportación, 12/11/2026

- Búsqueda global (D-126): `src/lib/search.ts` arma los resultados con los permisos de cada pantalla; diálogo rápido con `Ctrl+K` y `/` y G12 (`/search?q=`) con filtros por tipo. Tests por rol y de la página; G12 en Playwright.
- Ayuda contextual y bienvenidas (D-127): "Ayuda de esta pantalla" en el menú Ayuda para 27 pantallas y bienvenidas de tres pasos para RRHH, jefe y sistemas. Tests de ayuda y bienvenidas.
- A13 Reportes y exportaciones (D-128): cuatro listados en CSV con datos sensibles ocultos, exportación de personas sin ocultar con doble aprobación y de un solo uso, e Imprimir en A1, A4 y S6 con estilos de impresión. Tests de CSV, enmascarado, aprobación y uso único; A13 en Playwright.

## Paso 24 · F17 Preferencias e inglés completo, 12/11/2026

- G11 Preferencias (`/account/preferences`, permiso `preferences:own` para los cuatro roles), en el menú lateral y en el menú de usuario: idioma, zona horaria y formato de fecha, avisos por tipo (App, Correo, Ambos) y accesibilidad (reducir animaciones y alto contraste), con pie de formulario anclado (D-129).
- Las preferencias son de cada persona y se aplican al iniciar sesión y al cambiar de rol; las fechas, las horas y los números siguen lo elegido. El centro de notificaciones, los toasts y la vista previa del correo respetan los canales (F7).
- Inglés completo: las 2.508 claves de `es.json` tienen su traducción en `en.json`; los números pasan al formato de Estados Unidos en inglés.
- Tests de la lógica de preferencias, fechas, horas y números, y de G11 (guardar, aplicar y cambiar de rol); G11 en Playwright.
- Pendiente: pulido final, README e informe final (`docs/review.md`).

## Paso 25 · Pulido final, README e informe final, 12/11/2026

- Resumen de errores con enlaces a cada campo en A3, A6 y J3 (`ErrorSummary`, D-130, INC-024).
- Esquemas de Zod para S5, A11 y G11 (INC-026); RNF-023 completo.
- Áreas táctiles de 48 px en las casillas y en los logos de acceso; test nuevo `e2e/touch.spec.ts` a 375 px en todas las pantallas (INC-025).
- Tests nuevos: G4 a S2 con "Ver como sistemas (demo)" (RF-010), reducir animaciones (RNF-015) y validación de los formularios nuevos.
- Revisión de voz y tono sobre `es.json`: sin voseo ni usted, vocabulario fijo respetado y un solo signo de exclamación.
- Requerimientos no funcionales actualizados con su evidencia, o marcados como parciales o pendientes cuando no se pudieron verificar.
- README con las funciones de las dos fases, las 40 pantallas, capturas de las principales y el estado final.
- Informe final en `docs/review.md`.

## Paso 26 · Listo para el portfolio, 12/11/2026

- D-53: "Ver como" con cambios sin guardar en el editor pregunta con el mismo diálogo que toda salida: guardar borrador, descartar o quedarse; tests de las tres opciones (D-131).
- D-105 confirmada; CLAUDE.md con 7 a 11 notificaciones por persona generadas a partir de los datos.
- Carga: `PageSkeleton` mientras llega una pantalla, librerías pesadas en fragmentos propios, Zod fuera de la carga inicial. Ningún fragmento supera 500 kB.
- Lighthouse en G0, G1, N1 y A1, celular y escritorio, con resultados en `docs/perf/`.
- Firefox y WebKit en Playwright y en GitHub Actions; flujos con teclado (`e2e/keyboard.spec.ts`) y un botón principal por región (`e2e/filled-button.spec.ts`).
- `npm run check:console` para revisar la consola del build y de la demo publicada.

## Paso 27 · Versión 1.0.0, 12/11/2026

- RNF-045 revisado flujo por flujo; G4 recibe el correo y el motivo desde el login (D-132).
- G0: "Pantallas en esta versión" en 40; imagen para compartir con el hero actual; patrones de 2.2.1 numerados del 1 al 29 (D-133).
- Tag y release v1.0.0 en GitHub.

## Ajustes · Revisión de mobile, 12/11/2026 (D-134)

- Gráfico de avance de A1 más liviano en celulares; foto al lado del nombre en A4 y J2; tarjeta de plantilla con el título junto al ícono.
- A11 con una acción principal "Registrar un movimiento" y sus variantes en un menú; ancho máximo de los menús desplegables.
- Fecha de envío y plazo de respuesta en líneas separadas en las solicitudes de privacidad.

## Ajustes · Sin cuenta bancaria, 12/11/2026 (D-135)

- La plataforma deja de guardar el CBU: fuera de A4, A10, G10, A13, los datos semilla y el modelo. El enmascarado sigue con DNI y CUIL. Esquema de datos 18.

## Ajustes · Flujos por pasos de tamaño fijo, 12/11/2026 (D-136)

- G8 y la bienvenida guiada miden lo que su paso más largo; "Anterior" del primer paso conserva su lugar.

## Ajustes · Retratos nuevos, 12/11/2026 (D-137)

- Diez personas más con foto (Valeria, Ramiro, Agustina, Martina, Camila, Paula, Joaquín, Mateo, Lucas y Bruno): todas las de los datos.

## Ajustes · Desplazamiento al cambiar de pantalla, 12/11/2026 (D-138)

- Cada pantalla nueva abre desde arriba (`ScrollToTop`), con test de Playwright en los tres motores.

## Ajustes · README y pantallas de la portada, 12/11/2026 (D-139)

- README con funciones por área y fotos con anillo de rol; pantallas del hero de G0 capturadas desde la app con `npm run og`; imagen para compartir regenerada.

## Ajustes · Estados de carga, 12/11/2026 (D-140)

- Un esqueleto por plantilla de página, en el producto (al cargar y la primera vez que se abre cada pantalla) y en el sitio del sistema de diseño.

## Ajustes · Capa de borde, 12/11/2026 (D-141)

- `docs/security.md` documenta Cloudflare como capa de borde de producción (cabeceras, TLS, WAF, límites, bots, DDoS y acceso a entornos internos) y su tratamiento como subencargado de datos.
