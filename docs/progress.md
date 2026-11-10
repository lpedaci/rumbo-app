# Avance del proyecto

Se actualiza al terminar cada paso de la sección 10 de `CLAUDE.md`.

## Fase A: núcleo

| Paso | Descripción | Estado | Fecha |
| --- | --- | --- | --- |
| 0 | Documentación base | Hecho (revisado por Lourdes) | 10/11/2026 |
| 1 | Setup (Vite, TS, Tailwind, shadcn/ui, router, i18n, deploy) | Hecho | 10/11/2026 |
| 2 | Tokens M3, `<Icon />`, `<BentoCard />`, styleguide, test de desbordes | Pendiente | |
| 3 | Datos semilla, tipos, stores y cálculos con tests | Pendiente | |
| 4 | Seguridad base y layout (G1 a G7) | Pendiente | |
| 5 | Nuevo ingreso: N1, N2 | Pendiente | |
| 6 | Plantillas: A5, A6, A7 | Pendiente | |
| 7 | Ingresos: A2, A3, A4 | Pendiente | |
| 8 | Jefe: J1, J2, J3 y N3 | Pendiente | |
| 9 | Panel A1 con alertas | Pendiente | |
| 10 | Sistemas: S1, S2, S3 | Pendiente | |
| 11 | CSP, `npm audit` en CI y `docs/security.md` | Pendiente | |
| 12 | Pulido de fase A | Pendiente | |
| 13 | Revisión intermedia (`docs/review-fase-a.md`) | Pendiente | |

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
