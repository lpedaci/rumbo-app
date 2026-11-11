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
| 7 | Ingresos: A2, A3, A4 | Pendiente | |
| 8 | Jefe: J1, J2, J3 y N3 | Pendiente | |
| 9 | Panel A1 con alertas | Pendiente | |
| 10 | Sistemas: S1, S2, S3 | Pendiente | |
| 11 | CSP, `npm audit` en CI y `docs/security.md` | Pendiente | |
| 12 | Pulido de fase A | Pendiente | |
| 13 | Revisión intermedia (`docs/review-fase-a.md`) | Pendiente | |

## Rediseño visual (2.2.1): piloto, pendiente de aprobación

**Por qué:** Lourdes pidió el rediseño de la sección 2.2.1 antes del paso 7: la primera versión se veía básica y no tomaba lo de `/design-references/`.

**Qué se hizo**
- **Auditoría:** `docs/visual-audit.md`, referencia por referencia, con lo que hay que cambiar. Capturas en `docs/redesign/before/` y `docs/redesign/after/`.
- **Tokens:** `surface` tintado (`#EDF3F4`), `inverse-surface` `#1F2A30` para los tooltips de gráficos, radio de tarjeta de 20 px, padding de tarjeta de 24 px en desktop y rol tipográfico `display-medium`.
- **Componentes nuevos:** `IconTile`, `Sparkline`, `KpiCard`, `SegmentedProgress`; avatares con color por rol; barra de progreso gruesa (`size="lg"`); ícono opcional en `BentoCard`. Todos en `/styleguide`.
- **G6:** navegación de escritorio en dos niveles (riel con logo, bienvenida, "Mi seguridad" y "Cerrar sesión"; menú del espacio del rol con la persona abajo); en tablet, riel de íconos; ítem activo en píldora `primary-container`.
- **G0:** hero a dos columnas con titular grande, botones y vista previa compuesta con datos reales (KPIs con sparkline, gráfico de tareas por semana con tooltip oscuro y tarjeta de recorrido con barra segmentada); tarjetas de rol con banda de color; enlaces al case study y la documentación en el encabezado.
- **G1:** login en dos columnas con panel tintado, frase de valor y la vista previa del producto (solo desde 1024 px).
- **N1:** saludo como título, fila de 4 KPIs, tarjeta "Tu recorrido de ingreso" con barra segmentada y "Lo próximo" como checklist con chevron, avance por etapa con barras gruesas, check-in con acento ciruela y contactos con avatar por rol.
- **Bienvenida guiada de Sofía:** 3 pasos con ilustraciones hechas con componentes reales, puntos de progreso, "Saltar", "Anterior" y "Continuar", y cierre "Empezar mi recorrido".
- **Router:** migración a `createHashRouter` y `useBlocker` en el editor de plantillas (D-53).

**Verificación:** `tsc`, ESLint, 203 tests y 207 casos de Playwright en verde (desbordes en los 6 anchos y axe, incluida la bienvenida abierta).

**Pendiente:** aprobación de Lourdes. Después, aplicar el estilo a A5 (catálogo de tarjetas), A6, A7, N2 y G2 a G5, y seguir con el paso 7.

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
- **G1:** login limpio con "Usa tu cuenta de trabajo de Nortia". Con `?demo=…` muestra "Vas a entrar como…", "Continuar como…" y "Cambiar recorrido". El aviso de demo quedó en una línea.
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
