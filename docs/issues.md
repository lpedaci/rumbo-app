# Registro de incidencias

Problemas encontrados durante el desarrollo, el test de desbordes, la revisión de accesibilidad y las pruebas manuales. Las elecciones ante dudas van en [decisions.md](decisions.md), no acá.

**Severidad:** crítica (bloquea la demo), alta (rompe un flujo), media (funciona con un problema visible), baja (detalle).
**Estado:** abierta, en curso, resuelta, descartada.

| ID | Fecha | Descripción | Severidad | Pantalla / función | Cómo reproducirla | Estado | Solución | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INC-001 | 10/11/2026 | `npm audit` informa 10 vulnerabilidades **moderadas** en `minimatch` 10.2.6 (GHSA-g3hv-75wg-m249), que llega a través de `eslint` 10 y `typescript-eslint`. Son dependencias de desarrollo: no llegan al build publicado (`npm audit --omit=dev` da 0). | Baja | Herramientas de lint | `npm audit` | Abierta | El CI solo falla con altas o críticas, así que no bloquea el deploy. La única corrección disponible es bajar a ESLint 9 (cambio incompatible). Revisar en cada paso si `eslint` o `typescript-eslint` publican una versión con `minimatch` corregido. | |
