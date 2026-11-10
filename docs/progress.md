# Avance del proyecto

Se actualiza al terminar cada paso de la sección 10 de `CLAUDE.md`.

## Fase A: núcleo

| Paso | Descripción | Estado | Fecha |
| --- | --- | --- | --- |
| 0 | Documentación base | Hecho (revisado por Lourdes) | 10/11/2026 |
| 1 | Setup (Vite, TS, Tailwind, shadcn/ui, router, i18n, deploy) | Hecho | 10/11/2026 |
| 2 | Tokens M3, `<Icon />`, `<BentoCard />`, styleguide, test de desbordes | Hecho | 10/11/2026 |
| 3 | Datos semilla, tipos, stores y cálculos con tests | Hecho | 10/11/2026 |
| 4 | Seguridad base y layout (G1 a G7) | Hecho | 10/11/2026 |
| 5 | Nuevo ingreso: N1, N2 | Pendiente | |
| 6 | Plantillas: A5, A6, A7 | Pendiente | |
| 7 | Ingresos: A2, A3, A4 | Pendiente | |
| 8 | Jefe: J1, J2, J3 y N3 | Pendiente | |
| 9 | Panel A1 con alertas | Pendiente | |
| 10 | Sistemas: S1, S2, S3 | Pendiente | |
| 11 | CSP, `npm audit` en CI y `docs/security.md` | Pendiente | |
| 12 | Pulido de fase A | Pendiente | |
| 13 | Revisión intermedia (`docs/review-fase-a.md`) | Pendiente | |

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
