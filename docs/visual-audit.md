# Auditoría visual frente a las referencias

> Fecha: 10/11/2026. Proceso de la sección 2.2.1 de `CLAUDE.md`, antes del paso 7.
> Capturas "antes" en `docs/redesign/before/` y "después" en `docs/redesign/after/`.

## Diagnóstico general

La primera versión cumple las reglas de 2.1 a 2.10, pero se ve como una plantilla genérica:

- **Sin capas:** el fondo (`#F6F8F9`) y las tarjetas blancas casi no se diferencian; todo parece una sola hoja.
- **Jerarquía plana:** el título de cada pantalla es del mismo peso visual que los títulos de tarjeta. No hay un saludo ni un número que llame la atención primero.
- **Datos sin forma:** el progreso se muestra con barras finas y porcentajes sueltos; no hay sparklines, íconos en contenedores ni píldoras de variación.
- **Personas sin color:** los avatares usan el mismo tono rosado para todos, sin relación con el rol.
- **Acento ausente:** casi todo es petróleo o gris; el ciruela (`tertiary`) no aparece.
- **G1 vacío:** el login es una columna angosta sobre blanco, con la mitad derecha de la pantalla vacía.
- **G0 sin protagonista:** el hero es solo texto, y la vista previa del producto es una tarjeta chica.

## Referencia por referencia

| Referencia | Patrones visuales concretos | Cómo está hoy en Rumbo | Qué cambia |
| --- | --- | --- | --- |
| `9d0f172e` (panel con saludo) | Saludo grande ("Good Afternoon, Dan!") con una línea de contexto; fila de 4 KPIs con ícono en contenedor de color arriba a la izquierda y variación en píldora arriba a la derecha; número de ~28 px; gráfico de área grande con relleno suave; dona con leyenda; tabla inferior con estados en píldora. Sidebar blanca con ítem activo en píldora sólida. | N1 tiene "Hola, Sofía" en 14 px gris arriba del título; no hay KPIs. | Saludo en `headline-small` como título de la pantalla, con la línea de contexto debajo. Fila de KPIs con ícono en contenedor, número `display-small` y píldora. Ítem activo en píldora `primary-container`. |
| `ad2d9e23` (panel con sparklines) | Fondo tintado con tarjetas blancas muy redondeadas (~20 px); cada KPI con ícono, etiqueta, número grande, píldora de variación verde o roja y **sparkline** arriba a la derecha; tooltip oscuro flotante sobre el gráfico; riel de íconos compacto; tarjeta oscura destacada con barras segmentadas. | Fondo casi blanco, tarjetas de 16 px de radio sin diferenciación; sin sparklines; tooltip de gráficos sin definir. | `surface` pasa a `#EDF3F4` (tintado). Radio de tarjetas a 20 px. Componente `Sparkline` y `KpiCard`. Token `inverse-surface` `#1F2A30` para el tooltip de gráficos. |
| `e97bf4eb` (login en dos columnas) | Formulario a la izquierda con logo, título, subtítulo, botones sociales lado a lado y campos; a la derecha un panel tintado que muestra el producto real (KPIs y gráfico) recortado por el borde. | Columna centrada de 448 px sobre blanco; mitad derecha vacía. | Dos columnas desde 1024 px: formulario a la izquierda y panel tintado (`primary-container` plano, sin degradé) con una frase de valor y una vista previa compuesta con componentes reales. En mobile, solo el formulario. Los botones SSO quedan uno debajo del otro (textos largos en español, igual prominencia). |
| `e3243345` (usuarios) | KPIs con sparkline arriba; tabla aireada con avatar + nombre, columnas grises, estados en píldoras pastel; filtros como selects redondeados. | Se aplicará en A2, A9 y S1 (pasos 7 y 10). | Avatares por rol y píldoras con ícono ya disponibles en el sistema; las tablas usan el nuevo radio y fondo. |
| `original-cf59fe35` (tarjeta de progreso) | Tarjeta blanca flotante, centrada: ícono de marca, título, texto breve, **barra segmentada** (unas 30 barritas verticales redondeadas), checklist en filas con ícono de estado y chevron dentro de un contenedor con borde. | N1 usa una barra lineal fina y porcentajes por etapa; G0 muestra una checklist simple. | Componente `SegmentedProgress` (una barrita por tarea, `primary` hechas, `outline-variant` pendientes, sin degradé) y tarjeta de bienvenida en N1 con ícono, título, texto, barra segmentada y checklist de "Lo próximo" con chevron. |
| `original-d624f662` (video) | Modal de 3 pasos sobre la app atenuada; zona ilustrativa arriba con mini piezas de interfaz (campo con check, perfil que se tilda, tarjeta de resultado con elementos flotantes); puntos de progreso; título; descripción de 2 líneas; "Anterior" outlined (atenuado en el primer paso) y "Continuar" filled; en el último paso el botón cambia a una frase de cierre. La ilustración entra con fundido y leve escala; los checks aparecen escalonados. | No existe. | `GuidedWelcome` para Sofía: 3 pasos con miniaturas de componentes reales (tarjeta de recorrido, tarea que se tilda, check-in). Zona ilustrativa en `surface-container` plano (el video usa un difuminado: acá no). "Anterior" deshabilitado en el primer paso con texto. Cierre "Empezar mi recorrido". Respeta reducir animaciones. |
| `7fa40cfb` (catálogo de plantillas) | Doble barra lateral: riel de íconos fino y menú expandido con secciones, submenús y persona usuaria abajo; encabezado con buscador y acción principal; migas de pan; botón "Filtros"; **grilla de tarjetas** con título, chips de categoría, objetivo con ícono, descripción y botón "View template"; la primera tarjeta es "Create template" con borde punteado. | Sidebar única con fondo gris; A5 es una tabla. | Navegación de escritorio en dos niveles: riel con el logo, ayuda, seguridad y cerrar sesión, y menú expandido con el espacio del rol, sus secciones y la persona usuaria abajo. A5 como catálogo de tarjetas: queda para después de la aprobación del piloto. |

## Decisiones de la adaptación

- **Sin degradés:** las referencias usan halos y difuminados de color (`e97bf4eb`, `ad2d9e23`, el video). Acá se reemplazan por superficies planas (`primary-container`, `surface-container`).
- **Sin fotos:** avatares con iniciales sobre el contenedor de color de cada rol.
- **Colores de marca de las referencias** (violeta, azul, rosa) → roles de 2.1.1: petróleo para la acción, ciruela para acentos y logros.
- **Sombras:** las tarjetas en reposo siguen sin sombra; la separación viene del fondo tintado. Las miniaturas flotantes de G0, G1 y la bienvenida guiada usan `--elevation-1`, porque representan elementos superpuestos.
- **Botones SSO:** se mantienen apilados y con el mismo peso (regla de Google de igual prominencia); la referencia los pone lado a lado, pero en español los textos no entran a 320 px.

## Piloto

| Pantalla | Cambios |
| --- | --- |
| Tokens y `/styleguide` | `surface` tintado, `inverse-surface` para tooltips, radio de tarjeta 20 px, avatares por rol, barra de progreso más gruesa, `SegmentedProgress`, `Sparkline`, `KpiCard`, `IconTile`. |
| G6, layout | Barra superior con menú, logo, "Ver como", Ayuda, Notificaciones y la persona; barra lateral plegable a íconos; activo en píldora sólida; en mobile, panel lateral y barras con solo íconos (D-57, D-58). |
| G0 | Hero a dos columnas con titular `display-medium`, botones y vista previa compuesta (KPIs con sparkline, gráfico de avance y tarjeta de recorrido con barra segmentada). Tarjetas de rol más grandes con avatar de color. Enlaces al case study y la documentación también en el encabezado. |
| G1 | Dos columnas con panel tintado y vista previa del producto. |
| N1 | Saludo como título, fila de KPIs personales, tarjeta de bienvenida con barra segmentada y checklist, y bienvenida guiada de 3 pasos al primer ingreso. |
