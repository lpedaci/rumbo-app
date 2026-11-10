# Registro de incidencias

Problemas encontrados durante el desarrollo, el test de desbordes, la revisión de accesibilidad y las pruebas manuales. Las elecciones ante dudas van en [decisions.md](decisions.md), no acá.

**Severidad:** crítica (bloquea la demo), alta (rompe un flujo), media (funciona con un problema visible), baja (detalle).
**Estado:** abierta, en curso, resuelta, descartada.

| ID | Fecha | Descripción | Severidad | Pantalla / función | Cómo reproducirla | Estado | Solución | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INC-001 | 10/11/2026 | `npm audit` informa 10 vulnerabilidades **moderadas** en `minimatch` 10.2.6 (GHSA-g3hv-75wg-m249), que llega a través de `eslint` 10 y `typescript-eslint`. Son dependencias de desarrollo: no llegan al build publicado (`npm audit --omit=dev` da 0). | Baja | Herramientas de lint | `npm audit` | Abierta | El CI solo falla con altas o críticas, así que no bloquea el deploy. La única corrección disponible es bajar a ESLint 9 (cambio incompatible). Revisar en cada paso si `eslint` o `typescript-eslint` publican una versión con `minimatch` corregido. | |
| INC-002 | 10/11/2026 | Los botones `filled` y `danger` mostraban el texto en `on-surface` (oscuro) en lugar de blanco: 3,04:1 sobre `primary`. `tailwind-merge` no conocía los roles tipográficos propios, leía `text-label-large` como un color y borraba `text-on-primary`. | Alta | Button (todas las pantallas) | axe en `/styleguide` y en el 404 | Resuelta | Se configuró `tailwind-merge` con los roles de M3 como tamaños de fuente (`src/lib/utils.ts`) y se agregó un test unitario. | Paso 2 |
| INC-003 | 10/11/2026 | El texto de ayuda de un campo deshabilitado se atenuaba al 38 %: 2,4:1. | Media | TextField | axe en `/styleguide` | Resuelta | El texto de ayuda mantiene `on-surface-variant` aunque el campo esté deshabilitado, porque explica por qué lo está. | Paso 2 |
| INC-004 | 10/11/2026 | El botón segmentado se estiraba al ancho completo dentro de contenedores en columna, y el botón en estado "cargando" se veía gris, como deshabilitado. | Baja | SegmentedButton, Button | Revisión visual de las capturas | Resuelta | `w-fit self-start` en el segmentado; el estado de carga mantiene el color y solo bloquea los clics. | Paso 2 |
