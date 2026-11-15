# Documentación de Rumbo

Rumbo es una plataforma B2B de recorridos de ingreso (onboarding) corporativo. Este directorio reúne la documentación de producto, diseño y desarrollo del MVP. Se puede leer sin el código: está pensada para el case study del portfolio y para entrevistas técnicas.

> Estado: **versión 1.0, fases A y B completas** (40 pantallas). Última actualización: 15/11/2026.
> Proyecto de portfolio de Lourdes Pedaci, Experience Designer (Learning y UX/UI). Todos los datos son ficticios.

**[Ver la demo](https://lpedaci.github.io/rumbo-app/)** · **[Leer el case study](https://lpedaci.github.io/portfolio/casos/rumbo/)** · **[Sitio del sistema de diseño](https://lpedaci.github.io/rumbo-app/#/design-system)** · [README del repositorio](../README.md)

## En cifras

| Qué | Cuánto | Dónde |
| --- | --- | --- |
| Requerimientos funcionales | 89, todos hechos | [requirements.md](requirements.md) |
| Requerimientos no funcionales (ISO/IEC 25010:2023) | 57: 54 hechos y 3 parciales | [requirements.md](requirements.md) |
| Casos de uso | 14 | [use-cases.md](use-cases.md) |
| Decisiones de diseño registradas | 143 (D-01 a D-143) | [decisions.md](decisions.md) |
| Incidencias registradas | 41, todas resueltas o descartadas salvo INC-001 (avisos moderados de una dependencia de desarrollo) | [issues.md](issues.md) |
| Tests unitarios y de componentes | 380 (Vitest) | [review.md](review.md) |
| Pruebas de navegador | 614 en Chromium y 312 en WebKit y en Firefox (Playwright) | [review.md](review.md) |

Los requerimientos parciales y lo que falta verificar (la prueba con NVDA y en celulares reales) están en el [informe final](review.md).

## Índice

### Producto e investigación

| Documento | Qué contiene |
| --- | --- |
| [personas.md](personas.md) | Cuatro proto-personas (una por rol), rotuladas como hipótesis sin validar, con tabla de supuestos y plan de validación |
| [roles.md](roles.md) | Los cuatro roles y cómo se relacionan, la matriz de permisos (generada desde el código y verificada por un test) y qué datos ve cada rol |
| [information-architecture.md](information-architecture.md) | Inventario de contenidos, sistemas de organización, rotulado, navegación y búsqueda, mapa del sitio por rol, plantillas de página y plan de validación |
| [requirements.md](requirements.md) | Requerimientos funcionales y no funcionales, con prioridad MoSCoW, criterio de aceptación y estado |
| [use-cases.md](use-cases.md) | Casos de uso detallados y diagrama general de actores |
| [flows.md](flows.md) | Mapa de pantallas, diagrama de funciones, task flows, user flows, wireflows con capturas reales y diagramas de estados |

### Diseño

| Documento | Qué contiene |
| --- | --- |
| [design-system.md](design-system.md) | Tokens (color, tipografía, espaciado, forma, elevación, íconos, movimiento), componentes, patrones y estados de carga. Versión navegable: [sitio del sistema de diseño](https://lpedaci.github.io/rumbo-app/#/design-system) |
| [visual-audit.md](visual-audit.md) | Auditoría visual contra las referencias y el piloto rediseñado (G0, G1 y N1) antes de escalar el estilo |
| [redesign/](redesign/) | Capturas antes y después del rediseño piloto |
| [wireflows/](wireflows/) | Los tres wireflows (login con verificación en dos pasos, recorrido del nuevo ingreso y publicación de una plantilla), armados con capturas reales |
| [screenshots/](screenshots/) | Capturas de todas las pantallas en 6 anchos (320 a 1440 px), del test de desbordes. Se regeneran con `npm run test:e2e` |
| [readme/](readme/) | Imágenes del README: portada, figuras de arquitectura, fotos de las personas y pantallas principales. Se regeneran con `npm run og` |

### Seguridad y calidad

| Documento | Qué contiene |
| --- | --- |
| [security.md](security.md) | Seguridad en tres capas: lo simulado en la interfaz, lo aplicado de verdad en el front (CSP, validación, auditoría de dependencias) y la arquitectura de producción, con la capa de borde (Cloudflare), amenazas y mitigaciones |
| [review.md](review.md) | Informe final de las dos fases: qué se hizo, criterios de aceptación con evidencia, rendimiento, navegadores, qué falta, riesgos y próximos pasos |
| [review-fase-a.md](review-fase-a.md) | Revisión intermedia al cerrar la fase A (11/11/2026) |
| [perf/](perf/) | Resultados de Lighthouse contra el build de producción |

### Registro del proceso

| Documento | Qué contiene |
| --- | --- |
| [decisions.md](decisions.md) | Cada duda de la especificación, qué se decidió, por qué y si Lourdes lo confirmó |
| [issues.md](issues.md) | Registro de incidencias: errores y problemas, con cómo se reprodujeron y cómo se resolvieron |
| [progress.md](progress.md) | Avance paso a paso del plan de trabajo y de los ajustes posteriores |

## Cómo leer esta documentación

1. Empieza por **personas.md** para entender a quién sirve el producto.
2. Sigue con **roles.md** para ver quién puede hacer qué, e **information-architecture.md** para ver cómo se organiza y se nombra el contenido.
3. **requirements.md** traduce eso en requisitos verificables.
4. **use-cases.md** y **flows.md** muestran cómo se recorren esos requisitos en la práctica.
5. **design-system.md** y **security.md** explican cómo se construyó; **review.md** resume el resultado y la evidencia.
6. **decisions.md** cuenta el porqué de cada cambio: es la mejor fuente para las preguntas de una entrevista.

## Convenciones

- IDs estables: `RF-001`, `RNF-001`, `CU-01`, `D-01`, `INC-001`. Las funciones van de `F0` a `F17` y las pantallas usan los IDs de la sección 6 de `CLAUDE.md` (G1, A1, J1, N1, S1...).
- Los diagramas están en **Mermaid**; GitHub los muestra como gráficos. Las figuras de arquitectura y los wireflows se exportan como imagen desde la app.
- Fechas en formato `DD/MM/AAAA`.
- Las fuentes (estándares y autores) se citan en formato **APA 7**, con una lista de referencias al final de cada documento.
- Si un cambio de código altera un requisito, un flujo o un caso de uso, la documentación se actualiza en el mismo paso.

## Créditos

- **Diseño y desarrollo:** Lourdes Pedaci, Experience Designer (Learning y UX/UI).
- **Fotos de personas:** Magnific (magnific.com, antes Freepik), con licencia confirmada por Lourdes para un portfolio público. Detalle de cada archivo en `src/assets/avatars/SOURCE.md`.
- **Íconos:** Material Symbols (Google), licencia Apache 2.0.
- **Tipografía:** Inter, SIL Open Font License.
- Nortia S.A., sus personas y sus datos son ficticios.
