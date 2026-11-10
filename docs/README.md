# Documentación de Rumbo

Rumbo es una plataforma B2B de recorridos de ingreso (onboarding) corporativo. Este directorio reúne la documentación de producto y de diseño del MVP. Se puede leer sin el código: está pensada para el case study del portfolio y para entrevistas técnicas.

> Estado: **borrador para revisión, versión 2** (paso 0 de la sección 10 de `CLAUDE.md`, ajustado a la spec actualizada). Fecha: 10/11/2026.
> Proyecto de portfolio de Lourdes Pedaci, Learning Experience Designer. Todos los datos son ficticios.

## Índice

| Documento | Qué contiene |
| --- | --- |
| [personas.md](personas.md) | Cuatro proto-personas (una por rol), con tabla de supuestos y plan de validación |
| [roles.md](roles.md) | Organización de los cuatro roles, relaciones entre ellos, matriz de permisos y mínimo privilegio |
| [information-architecture.md](information-architecture.md) | Inventario de contenidos, sistemas de organización, rotulado, navegación y búsqueda, mapa del sitio por rol, plantillas de página y plan de validación |
| [requirements.md](requirements.md) | Requerimientos funcionales (RF) y no funcionales (RNF, ISO/IEC 25010:2023), con prioridad MoSCoW |
| [use-cases.md](use-cases.md) | Casos de uso detallados y diagrama general de actores |
| [flows.md](flows.md) | Mapa de pantallas, diagrama de funciones, task flows, user flows, wireflows (pendientes de capturas) y diagramas de estados |
| [decisions.md](decisions.md) | Dudas encontradas en la especificación y cómo se resolvieron |
| [issues.md](issues.md) | Registro de incidencias (errores y problemas) |
| [progress.md](progress.md) | Avance por paso del plan de trabajo |
| `design-system.md` | Sistema de diseño implementado, igual a `/styleguide`. Se redacta en el paso 2 |
| `security.md` | Arquitectura de seguridad de producción. Se redacta en el paso 11 |
| `screenshots/` | Capturas del test de desbordes en 6 anchos (320 a 1440 px). Se generan desde el paso 2 |

## Cómo leer esta documentación

1. Empieza por **personas.md** para entender a quién sirve el producto.
2. Sigue con **roles.md** para ver quién puede hacer qué, e **information-architecture.md** para ver cómo se organiza y se nombra el contenido.
3. **requirements.md** traduce eso en requisitos verificables.
4. **use-cases.md** y **flows.md** muestran cómo se recorren esos requisitos en la práctica.

## Convenciones

- IDs estables: `RF-001`, `RNF-001`, `CU-01`, `INC-001`. Las funciones van de `F0` a `F17` y las pantallas usan los IDs de la sección 6 de `CLAUDE.md` (G1, A1, J1, N1, S1...).
- Los diagramas están en **Mermaid**; GitHub los muestra como gráficos.
- Fechas en formato `DD/MM/AAAA`.
- Las fuentes (estándares y autores) se citan en formato **APA 7**, con una lista de referencias al final de cada documento.
- Si un cambio de código altera un requisito, un flujo o un caso de uso, la documentación se actualiza en el mismo paso.
