# Rumbo · Plataforma de onboarding corporativo (MVP)

> Nombre de trabajo: **Rumbo** (provisorio, se puede cambiar).
> Autora: Lourdes Pedaci, Experience Designer (Learning y UX/UI).
> Este archivo es la especificación completa del proyecto. Leelo entero antes de empezar y volvé a consultarlo en cada paso.
> Proyecto de portfolio: prototipo navegable de alta fidelidad (nivel 2), con datos simulados y sin backend.

---

## 1. Qué es este proyecto

Una plataforma B2B donde RRHH o L&D diseña el recorrido de ingreso por puesto, el jefe directo acompaña con check-ins y la persona nueva sabe en todo momento qué hacer, con quién y para cuándo. RRHH mide el avance y detecta dónde se traban los recorridos.

El objetivo del proyecto es **mostrar en un portfolio** flujos complejos con varios roles, diseño instruccional aplicado a un proceso de negocio y dashboards con datos. No es un producto en producción.

### Principios

- **Prototipo funcional, no maqueta:** las pantallas deben responder (crear, editar, completar, aprobar) y los cambios deben persistir en `localStorage` durante la demo.
- **Sin backend:** todos los datos vienen de archivos JSON en `src/data/` y se manejan en el estado del cliente.
- **Seguridad de nivel corporativo, en tres capas:** (1) la experiencia de seguridad completa de una app corporativa, simulada en la interfaz (SSO, MFA, bloqueo por intentos, expiración de sesión, permisos por rol, auditoría); (2) buenas prácticas de seguridad reales en el front-end; (3) la arquitectura de seguridad de producción, documentada en `docs/security.md`. Ver sección 8.
- **Sin fricción para el visitante:** la seguridad simulada nunca debe frenar a quien recorre el portfolio. Los accesos de demo entran con un clic y los códigos de verificación se muestran en pantalla.
- **Selector de rol visible:** una vez dentro, el visitante del portfolio tiene que poder cambiar de rol en cualquier momento para recorrer el producto desde cada perspectiva.
- **Accesibilidad WCAG 2.2 AA** como mínimo, integrada desde el diseño y no como revisión al final. Ver sección 2.10.
- **Responsive verificado, sin desbordes:** todas las pantallas deben funcionar en mobile y desktop. Escritorio es prioridad para las vistas de admin y sistemas, pero ninguna pantalla puede romperse en mobile. Ver sección 2.7.

---

## 2. Sistema de diseño y referencias

### 2.1 Base: Material Design 3, personalizado
- El sistema visual se basa en **Material Design 3** (Google): roles de color, escala tipográfica, elevación, estados (hover, foco, presionado) y patrones de componentes. Es público y se puede usar sin problemas de licencia.
- **Se implementa con Tailwind + shadcn/ui**, no con una librería de Material: los fundamentos de M3 se traducen a tokens propios. Así el resultado no se ve como una app de Google por defecto.
- **Personalización obligatoria:** paleta y tipografía propias (definidas en 2.1.1), radios y densidad propios. Nada de logos, nombres ni elementos de marca de otras empresas, con dos excepciones: los logos oficiales de Microsoft y Google en los botones de inicio de sesión (ver F0) y las marcas de LinkedIn y GitHub en los enlaces a los perfiles de Lourdes en el pie de G0 (D-92, D-102).
- **Densidad:** interfaz de herramienta corporativa, con información densa pero clara y jerarquía fuerte, apta para trabajar muchas horas (tablas, listas, dashboards).
- Modo claro como principal; preparar los tokens para modo oscuro aunque no se implemente en la fase A.

### 2.1.1 Paleta: roles de color de Material 3 (definidos)

**Carácter:** fría, limpia y profesional. **No** usar fondos crema o beige, tonos tierra, terracota ni coral: la interfaz no debe parecerse a la de Claude ni a otras herramientas de IA. Fondos blancos y neutros grises fríos.

Los colores se nombran y usan con los **roles de Material 3** (cada rol tiene su color "on" para el texto o ícono que va encima). En M3, *secondary* es una versión apagada del primario para componentes de menor énfasis, y *tertiary* es el acento que contrasta: acá el tertiary es el complementario.

| Rol M3 | Base | Container | On-container | Uso |
| --- | --- | --- | --- | --- |
| `primary` (azul petróleo) | `#1F6F78` | `#D8EEF0` | `#0B3B40` | Acción principal, navegación activa, enlaces, anillo de foco |
| `secondary` (petróleo apagado) | `#4A6366` | `#CDE7EA` | `#05363A` | Botones tonales, chips de filtro seleccionados, elementos de menor énfasis |
| `tertiary` (ciruela, complementario) | `#9C3D74` | `#F6DCEA` | `#4A1435` | Acentos puntuales: logros, destacados, segunda serie de gráficos. Usar con moderación |
| `error` | `#B3261E` | `#F9DEDC` | `#5C1210` | Errores, vencidas, cuentas bloqueadas, acciones destructivas |
| `success` (color personalizado) | `#2E7D32` | `#DCEFDD` | `#123D15` | Completadas, confirmaciones, "al día" |
| `warning` (color personalizado) | `#8A5300` | `#FCEBC7` | `#4A2C00` | Por vencer, pendientes, bloqueadas por dependencias |
| `info` (color personalizado) | `#2457C5` | `#DCE6FB` | `#0F2A66` | Avisos informativos, ayuda, novedades |

`on-primary`, `on-secondary`, `on-tertiary`, `on-error` y los "on" de los colores personalizados son `#FFFFFF`. Material 3 solo define `error` como color de estado; `success`, `warning` e `info` se agregan como **colores personalizados** (*custom colors*), con la misma estructura de roles (base, on, container, on-container).

**Superficies y neutros (roles M3)**

| Rol M3 | Color | Uso |
| --- | --- | --- |
| `surface` | `#F1F3F5` | Fondo de la página: gris frío neutro, sin tinte de marca; las tarjetas blancas se despegan con su borde (D-69) |
| `surface-container-lowest` | `#FFFFFF` | Tarjetas bento, tablas, formularios |
| `surface-container` | `#EEF2F4` | Sidebar, encabezados de tabla, zonas agrupadas |
| `surface-container-high` | `#E4E9EC` | Hover de filas, elementos seleccionados neutros |
| `on-surface` | `#111827` | Texto principal |
| `on-surface-variant` | `#4B5563` | Texto secundario, íconos |
| `outline` | `#7D8793` | Bordes de campos de formulario y controles (3:1) |
| `outline-variant` | `#D5DBE0` | Bordes de tarjetas y divisores (decorativos) |

**Colores por rol** (D-69): identifican a las personas y sus roles; nunca indican estados.

| Rol | Base | Container | Uso |
| --- | --- | --- | --- |
| `role-hr` (RRHH) | `#1F6F78` | `#D8EEF0` | Anillo de la foto, barra y chip de la tarjeta de rol, contenedor de las iniciales |
| `role-manager` (jefe directo) | `#9C3D74` | `#F6DCEA` | Ídem |
| `role-hire` (nuevo ingreso) | `#6A4FC4` | `#E8E1FB` | Ídem |
| `role-it` (sistemas) | `#2457C5` | `#DCE6FB` | Ídem |

**Reglas de color**
- **Jerarquía por elevación tonal, no por sombra:** como propone M3, la profundidad se marca con los niveles de `surface-container`, no con sombras (ver 2.5).
- Contraste verificado: todas las bases pasan WCAG AA (mínimo 4,5:1) como texto sobre blanco y con texto blanco encima; los on-container superan 10:1; `outline` cumple 3:1.
- El color nunca es la única señal: los estados llevan además ícono y texto (por ejemplo, ícono de check + "Completada").
- Los colores de estado (`error`, `success`, `warning`, `info`) se usan **solo** para estados, nunca como decoración ni como series de gráficos.
- Series de gráficos, en este orden: `primary`, `tertiary`, `#5B8FA8` (petróleo claro), `#B9779D` (ciruela claro), `#6B7280` (gris). Todas cumplen al menos 3:1 contra el fondo blanco, como exige WCAG para elementos gráficos.
- Preparar los mismos roles para modo oscuro con Material Theme Builder, sin implementarlo en la fase A.

### 2.1.2 Tipografía: Inter con la escala de Material 3

- Inter para toda la interfaz, alojada en el propio proyecto (paquete `@fontsource-variable/inter`), no desde Google Fonts, para respetar la CSP.
- Se usan los **roles tipográficos de M3**, ajustados a la densidad de una herramienta corporativa. Ningún texto usa tamaños sueltos: siempre un rol.

| Rol M3 | Tamaño / interlineado | Peso | Uso en el producto |
| --- | --- | --- | --- |
| `display-small` (enfatizado) | 36 / 44 | 600 | Números grandes de KPIs desde 1280 px (en mobile y tablet, `headline-small`, D-63) y títulos de sección de G0 |
| `headline-small` (enfatizado) | 24 / 32 | 600 | Título de página (un único `h1` por pantalla) |
| `title-large` (enfatizado) | 22 / 28 | 600 | Título de sección (`h2`) |
| `title-medium` (enfatizado) | 16 / 24 | 600 | Título de tarjeta, de modal y de grupo (`h3`) |
| `title-small` | 14 / 20 | 500 | Subtítulos dentro de tarjetas, encabezados de tabla |
| `body-large` | 16 / 24 | 400 | Texto de lectura larga y texto base en mobile |
| `body-medium` | 14 / 20 | 400 | Texto base en desktop, celdas de tabla |
| `body-small` | 12 / 16 | 400 | Texto de ayuda de campos, metadatos, fechas |
| `label-large` | 14 / 20 | 500 | Botones, pestañas, ítems de navegación |
| `label-medium` | 12 / 16 | 500 | Etiquetas de campos, chips, píldoras de estado |
| `label-small` | 11 / 16 | 500 | Solo contadores e insignias (nunca texto de lectura) |

- Los tamaños e interlineados son los de la escala base de Material 3. Los títulos usan la variante **enfatizada** (más peso) que incorpora Material 3 Expressive, para que la jerarquía se lea bien con Inter.
- Jerarquía semántica correcta: los niveles de encabezado (`h1` a `h3`) siguen el orden sin saltos, independientemente del tamaño visual.
- Mínimo 12 px para cualquier texto que se lea; 11 px solo en insignias.
- Números de KPIs, tablas y fechas con cifras tabulares (`font-variant-numeric: tabular-nums`).
- Usar `rem` (no `px` fijos en el CSS final) para que el texto escale con la configuración del navegador.

### 2.1.3 Botones y jerarquía de acciones (Material 3 Expressive)

Material 3 Expressive (la actualización vigente de M3) mantiene los cinco estilos de botón y agrega tamaños (XS a XL), dos formas (redondeada tipo píldora o cuadrada con esquinas suaves), grupos de botones y botón dividido.

| Tipo M3 | Énfasis | Cuándo usarlo |
| --- | --- | --- |
| **Filled** (`primary`) | Máximo | La acción principal de la vista o del modal. **Uno solo por región visible** |
| **Filled tonal** (`secondary-container`) | Alto | Acción importante que no es la principal (por ejemplo, "Guardar borrador" junto a "Publicar") |
| **Outlined** | Medio | Acciones secundarias: "Cancelar", "Exportar", "Ver detalle" |
| **Text** | Bajo | Acciones terciarias, enlaces de acción dentro de tarjetas, "Saltar" en recorridos guiados |
| **Filled de error** (`error`) | Destructivo | Solo para confirmar una acción destructiva dentro del modal de confirmación |
| **Icon button** (estándar, tonal u outlined) | Según contexto | Acciones repetidas en filas o barras de herramientas; siempre con `aria-label` y tooltip |

- **Tamaños:** S (40 px de alto) por defecto; XS (32 px) solo en filas de tabla y barras de herramientas densas de desktop; M (56 px) solo para la acción principal de pantallas de un solo paso en mobile (por ejemplo, el login). No se usan L ni XL.
- **Forma:** una sola para todo el producto, **cuadrada con esquinas suaves**, coherente con las referencias. Sin animación de cambio de forma al presionar (para mantener la interfaz sobria; ver 2.6).
- **Área táctil:** como pide M3, al menos 48 × 48 px en mobile aunque el botón se vea más chico; en desktop, como mínimo los 24 × 24 px de WCAG 2.2.
- No se usan **Elevated buttons** (llevan sombra, contra la regla 2.5) ni **FAB** en la fase A. El botón de ayuda flotante previsto para el futuro asistente seguirá esta misma regla.
- **Grupos y botón dividido:** usar *button groups* para acciones relacionadas en barras de herramientas y *split button* cuando una acción tiene variantes (por ejemplo, "Publicar" con la opción "Publicar y asignar").
- Orden: en modales y formularios, la acción principal a la derecha y la de cancelar a su izquierda. En mobile, a ancho completo y la principal arriba.
- Estados obligatorios en todos los botones: reposo, hover, foco visible (anillo `primary` de 2 px con separación), presionado, deshabilitado y cargando (con indicador y texto "Guardando…", sin cambiar el ancho).
- Un botón deshabilitado debe explicar por qué (texto de ayuda cercano o tooltip accesible por teclado).
- Para filtros y alternativas excluyentes usar **segmented buttons** o **chips** de M3, no botones sueltos.
- **Separación entre botones:** al menos 12 px entre botones de ícono en mobile y 16 px desde 640 px, para que no se toquen por error (D-68).
- **Forma única también en la navegación y la barra superior:** sin botones en círculo; los de utilidad (Ayuda, Notificaciones) van sobre `surface-container` con esquinas suaves, y "Ver como" usa el botón outlined (D-62, D-69).

### 2.2 Referencias visuales
- Colección de referencia de Lourdes en Dribbble: https://dribbble.com/milu106ae8/collections/87da69f1-df85-4cf2-9bce-93de87a8363b/share
- Las capturas están en `/design-references/` y son la fuente principal. Abrí cada archivo antes de diseñar la pantalla relacionada. Qué tomar de cada uno:

| Archivo (empieza con) | Qué muestra | Usar para |
| --- | --- | --- |
| `9d0f172e` | Dashboard con saludo, fila de KPIs con variación, gráfico de área grande, gráfico de dona y tabla inferior | Dashboard de RRHH (A1), estructura saludo + KPIs + gráfico principal |
| `ad2d9e23` | Dashboard con sidebar de íconos, KPIs con sparklines, gráfico con tooltip oscuro flotante y tabla de uso | Dashboards en general, tooltips de gráficos, navegación lateral compacta |
| `e97bf4eb` | Login en dos columnas: formulario a la izquierda (SSO arriba, email y contraseña) y vista previa del producto a la derecha | Login (G1) |
| `e3243345` | Gestión de usuarios: KPIs arriba y tabla con avatar, email, fecha, ubicación y estados en píldoras de color | Listados (A2, A9, S1), píldoras de estado |
| `original-cf59fe35` | Tarjeta flotante "You're almost there!": ícono de marca arriba, título, texto breve, **barra de progreso segmentada** (muchas barritas verticales que se van completando) y checklist de pasos en filas con ícono de estado y chevron | Bloque de bienvenida y progreso de Mi recorrido (N1), "Lo próximo", progreso por etapa |
| `original-d624f662` (video) | Modal de configuración de perfil con pasos, checks, indicador de puntos y botones Anterior / Continuar, con transición entre pasos | Recorrido guiado (F16), aviso de privacidad (G8), flujos por pasos y referencia de animación |
| `7fa40cfb` | App con **doble barra lateral** (riel de íconos + menú expandido con secciones y submenús), encabezado con buscador y acción principal, migas de pan, botón "Filtros" y **catálogo de plantillas en grilla de tarjetas**: título, etiquetas en chips, objetivo con ícono, descripción y botón "Ver plantilla"; la primera tarjeta es "Crear plantilla" con borde punteado | Listado de plantillas (A5) como catálogo de tarjetas, navegación lateral, encabezado de las pantallas de admin, chips de categoría |

- **Rasgos comunes a respetar:** mucho espacio en blanco, superficies claras, un color de acento usado con moderación, gráficos de líneas suaves, tipografía sin serifa limpia, tablas aireadas con estados en píldoras.
- **Qué tomar de las referencias:** las funcionalidades y la modalidad visual (estructura de dashboards, tarjetas de KPI, tablas, navegación lateral, estados de progreso, pantallas de login y de onboarding).
- **Qué NO tomar:** **fondos con degradé.** Los fondos van en colores planos (superficies de M3). Si se necesita separar zonas, usar diferencias de superficie, bordes sutiles o elevación, nunca degradés.
- **Gráficos de área:** varias referencias rellenan el área bajo la línea con degradé. Acá el relleno va en un color plano con baja opacidad (por ejemplo, el color de la serie al 12 %), coherente con la regla de no usar degradés.
- No copiar ilustraciones, íconos ni textos de los shots de referencia: son de sus autores.
- **Fotos de personas:** las cuatro personas de demo (Carla, Martín, Sofía y Diego) y todas las personas de su entorno en los datos (Nicolás Acosta, Lucía Fernández, Federico Luna, Julieta Paz, Tomás Herrera, Valentina Ruiz, Valeria Ortiz, Ramiro Sosa, Agustina Vega, Martina López, Camila Torres, Paula Giménez, Joaquín Benítez, Mateo Romero, Lucas Ortiz y Bruno Castro; D-84, D-93, D-137) usan retratos elegidos por Lourdes, con licencia, guardados en `src/assets/avatars/` con su origen en `SOURCE.md`; el crédito ("Fotos de personas: Magnific") va en el case study, en `docs/README.md`, en `docs/design-system.md` y en `/styleguide`, no en el pie de G0 (D-92). Quien no tiene foto (por ejemplo, una persona dada de alta en la demo) usa iniciales sobre el contenedor de su rol. Nunca emojis. Los colores de botones de las referencias (azul, violeta) se reemplazan por los roles de 2.1.1 (D-69).

### 2.2.1 Dirección visual: que se vea propio, no genérico

La primera versión quedó demasiado básica y con aspecto de plantilla genérica. Las reglas de sobriedad (sin degradés, pocas sombras, paleta fría) **no significan una interfaz plana y sin personalidad**: la riqueza visual tiene que venir de la jerarquía, los datos, el color de acento y la composición, como en las referencias.

**Detalle del video `original-d624f662`** (8 segundos, flujo de 3 pasos dentro de un modal centrado sobre la app atenuada):
- Cada paso tiene arriba una **zona ilustrativa armada con mini piezas de interfaz** (un campo con un check que aparece, una tarjeta de perfil que se completa con filas que se van tildando, una tarjeta de resultado con elementos que flotan alrededor), debajo un **indicador de puntos**, el título, una descripción de dos líneas y los botones "Anterior" (outlined) y "Continuar" (filled). En el último paso el botón cambia a una frase de cierre ("Let's go!").
- La transición entre pasos: la ilustración del paso nuevo entra con fundido y leve escala, sus elementos aparecen escalonados (los checks hacen un pequeño rebote) y el texto cambia con fundido.
- "Anterior" está atenuado en el primer paso.

**Patrones concretos a incorporar** (tomados de `/design-references/`):
1. **Capas visibles:** fondo de página tintado (`surface`) con tarjetas blancas encima; la diferencia tiene que verse a simple vista.
2. **Encabezado de saludo en los inicios de cada rol** (`GreetingHeader`, D-67, D-82: `display-small` desde 768 px y más aire entre fecha, título y chips): arriba la fecha de hoy con ícono; el saludo con el nombre en `primary` ("Buenos días, **Sofía**", `headline-small`, único `h1`); debajo, chips con ícono y texto con el contexto (por ejemplo "Día 28 de 90", "Mes 1 · etapa actual"). El dato que pide atención va en `tertiary-container` ("Check-in en 2 días"). Números de KPI grandes (`display-small` desde 1280 px).
3. **KPIs con vida:** cada tarjeta lleva arriba el ícono en un contenedor de color y la **sparkline**; después la etiqueta, el número y la píldora de variación siempre debajo del número, con los datos alineados abajo (D-63). La fila pone tantas tarjetas como entren con un mínimo de 8,5 rem: 4 KPIs breves en una línea desde tablet, 2 por fila en mobile, y si una tarjeta tiene más contenido pasa sola a dos líneas (D-68). La sparkline solo se muestra si la tarjeta mide al menos 10,5 rem y nunca por debajo de 360 px de pantalla; la píldora pasa a dos líneas en lugar de cortarse (D-69).
4. **Gráficos protagonistas:** el gráfico principal ocupa una tarjeta grande, con relleno plano suave, ejes discretos y **tooltip oscuro** (`inverse-surface` de M3, `#1F2A30` con texto blanco).
5. **Navegación lateral (referencia `ad2d9e23`, D-57, D-58, D-60, D-101):** una sola barra blanca flotante, con esquinas redondeadas y a todo el alto. Arriba, el rótulo "Menú" (solo expandida) y el botón para plegarla a íconos; el logo queda en la barra superior (la elección queda guardada; plegada por defecto por debajo de 1280 px). Al medio, los ítems del rol con el activo en píldora sólida `primary` (ícono y texto blancos). Abajo, "Mi seguridad" y "Cerrar sesión". Íconos de Material Symbols.
6. **Personas con color:** cada rol tiene su color (`role-hr`, `role-manager`, `role-hire`, `role-it`, ver 2.1.1). Con foto, un anillo de 2 px del color del rol; sin foto, iniciales sobre el contenedor del rol. Igual en todo el producto (D-69).
7. **Tablas aireadas:** avatar + nombre + dato secundario en la primera columna, estados en píldoras de color con ícono, filas con hover.
8. **Progreso visible:** barras de progreso gruesas y redondeadas, checklist con íconos de estado, como en la tarjeta "You're almost there!".
9. **Bienvenida guiada como la del video:** al primer ingreso de cada rol, un modal de 3 o 4 pasos con zona ilustrativa hecha con **componentes reales de Rumbo en miniatura** (por ejemplo, para Sofía: su tarjeta de recorrido, una tarea que se tilda y su check-in), puntos de progreso, "Anterior" / "Continuar" y un cierre ("Empezar mi recorrido"). Se puede saltar y volver a ver desde el menú (F16). En "Anterior" del primer paso: oculto o deshabilitado con texto que no dependa solo del color. **Tamaño fijo** (D-136): todos los flujos por pasos (bienvenida, aviso de privacidad) miden lo que su paso más largo, y "Anterior" oculto conserva su lugar, para que la tarjeta o el modal no cambien de tamaño ni muevan los botones al avanzar. Respeta reducir animaciones.
10. **Línea de tiempo del recorrido** (reemplaza la barra segmentada en N1, D-61): un tramo por etapa relleno según sus tareas hechas y el marcador "Hoy · día N" en ciruela; bajo cada tramo, nombre, "N de M" y estado con ícono y texto. Arriba, una frase con la conclusión ("Vas al día" o "Tienes N tareas vencidas"); debajo, "Lo próximo". La barra segmentada de `original-cf59fe35` queda para vistas previas. La tabla equivalente queda solo para lectores de pantalla, sin botón visible (D-83).
11. **Catálogo de tarjetas para plantillas:** como `7fa40cfb`, A5 se muestra por defecto como **grilla de tarjetas** (nombre, puesto y área en chips, cantidad de tareas con ícono, ingresos que la usan, estado borrador o publicada, botón "Ver plantilla"), con la primera tarjeta "Crear plantilla" con borde punteado, y un selector para cambiar a vista de tabla.
12. **Barra superior** (D-60, D-64, D-69): barra blanca flotante con borde y radio `xl`, sobre el fondo gris: logo en una línea ("Rumbo | Nortia S.A."), "Ver como", divisores, Ayuda y Notificaciones sobre `surface-container`, y la persona con foto, nombre y correo desde 1024 px (solo la foto en pantallas menores). En mobile, la barra superior y el menú inferior muestran solo íconos, sin el logo (está en el panel lateral, D-79), y el botón de menú abre ese panel.
13. **Acento con intención:** el `tertiary` (ciruela) aparece en logros, destacados y la segunda serie de gráficos para dar contraste; no todo es petróleo.
14. **Listas y detalles estándar** (D-65): en una fila de tarea, a la izquierda el control o ícono; al medio el título y debajo "Tipo · Responsable"; a la derecha, en columnas desde 640 px, la fecha con "Vence en…" y el estado. Toda la fila es el enlace, sin subrayado. Las tareas hechas se pliegan en "Ver N tareas hechas" (D-59). En los detalles (N2), chips de estado, tipo y etapa, y una lista "Detalles" con etiqueta y valor en la misma fila. Jerarquía de la fecha (D-84): primero lo que hay que hacer ("Vence hoy", `label-medium`, en `error` si venció) y la fecha exacta en `body-small` gris debajo; por debajo de 640 px, solo "Vence…" junto al estado. En "Lo próximo", solo el vencimiento y el estado si suma (no "Vencida · fecha · Venció hace…").
15. **Referencias a otros lugares como chips** (D-83): cuando una frase nombra otra sección o un control ("Revísala en Lo próximo", "con Ver como", "Restablecer demo"), el nombre va en un chip `RefChip` con ícono; si el lugar está en la misma pantalla o en otra ruta, el chip es un enlace que lleva ahí y mueve el foco.
16. **Contactos clave completos en desktop** (D-83): desde 1024 px, cada contacto es una tarjeta con foto, chip de relación, nombre, puesto y correo; por debajo, la fila compacta que abre el detalle.
17. **Acciones de formulario ancladas** (D-85, D-86): los botones van en un pie dentro de la tarjeta del formulario (franja blanca con divisor y una nota opcional a la izquierda), nunca sueltos debajo.
18. **Check-ins como línea de tiempo** (D-85): en la ficha (A4, J2), 30/60/90 con marcadores; el próximo destacado con el estado de la autoevaluación y la acción del rol; los hechos con una línea de resultado ("2 de 3 hitos cumplidos") y el detalle plegado; los siguientes, solo la fecha. "Te toca a ti" se refiere siempre a quien mira la pantalla.
19. **Escalas de opciones responsivas** (D-85): la escala de 5 opciones pasa a una lista vertical cuando su contenedor mide menos de 32 rem.
20. **Alertas en tres líneas** (D-87): persona; qué pasa, con ícono del estado; y el detalle que lo explica (a quién espera, cuánto atraso). Todas las filas con el mismo ritmo.
21. **Ánimo solo agregado** (D-87): en A1 va como chip del saludo ("Ánimo promedio 3,8 de 5") y solo con 3 respuestas o más.
22. **Pestañas sin cortes** (D-90): en celulares, las pestañas de sección van en grilla (2 × 2), nunca cortadas ni con desplazamiento lateral.
23. **Frase del KPI al lado del número** (D-90) cuando entra; si no, debajo.
24. **Un toast a la vez** (D-90, D-99, D-109): del ancho de su mensaje (hasta 44 rem: una línea en desktop, dos en celulares); el nuevo reemplaza al anterior; en celulares aparece por encima del menú inferior y desde 768 px arriba al centro, debajo de la barra superior, para no tapar las acciones ni el foco.
25. **Verificación de identidad antes de restablecer un acceso** (D-90): solo con datos de la ficha (celular registrado o jefe directo), nunca con los que trae la solicitud.
26. **Aclaraciones dentro de la fila** (D-115): en las listas, la columna derecha es solo para el estado y la acción; una aclaración sobre la fila va como tercera línea debajo del título y los datos.
27. **Descripciones de encabezado con propósito** (D-111): la línea bajo el `h1` dice para qué sirve el apartado, al punto, sin repetir chips ni datos; 8 px entre título y descripción y 12 px bajo la línea superior; las acciones van al lado del título desde 1024 px.
28. **Encabezado de ficha único** (D-94): `DetailHeader` en todas las fichas de detalle (persona con foto y nombre si corresponde, chips con ícono y texto, `h1` y una línea de propósito). Las filas de las tablas se seleccionan completas, nunca con un texto subrayado.
29. **Aviso de tarea bloqueada** (D-69): sección en `warning-container` con candado, "Se habilita cuando esté hecha esta tarea" y una fila por tarea previa con tipo, título enlazado, responsable en chip ("Te toca a ti" resaltado), vencimiento e "Ir a la tarea".

**Pantallas que más lo necesitan:**
- **G0, inicio de la demo:** página de producto B2B (D-70); ver la estructura en F0.
- **G1, login:** dos columnas como la referencia `e97bf4eb`: formulario a la izquierda y, a la derecha, un panel con fondo tintado (sin degradé) con una vista previa del producto y una frase de valor. En mobile, solo el formulario. Ritmo de 8 px: 32 px entre secciones y 8 a 16 px dentro de cada una, igual que G2 a G4 (D-69); 24 px en pantallas de menos de 800 px de alto. Sin panel lateral, la columna mide 36 rem y va centrada en vertical, para que G2 y G3 entren sin scroll (D-76).
- **Inicios de cada rol (A1, J1, N1, S1):** saludo + fila de KPIs + gráfico o bloque principal + lista o tabla, en bento.

**Proceso obligatorio antes de seguir con el paso 7:**
1. Abrir y mirar cada archivo de `/design-references/` (el video, por sus fotogramas o su descripción en 2.2).
2. Escribir `docs/visual-audit.md`: por cada referencia, los patrones visuales concretos (composición, tamaños, color, densidad, componentes) y, al lado, cómo está hoy la pantalla equivalente de Rumbo (con su captura) y qué hay que cambiar.
3. Actualizar tokens y componentes en `/styleguide` y rediseñar **G0, G1 y N1** como piloto (N1 con la bienvenida guiada del patrón 9 y la tarjeta de progreso del patrón 10).
4. Mostrar capturas antes y después a Lourdes y **esperar su aprobación** antes de aplicar el estilo al resto de las pantallas ya hechas (A5 como catálogo de tarjetas, A6, A7, N2) y a las siguientes.
5. Mantener todas las reglas de 2.1 a 2.10 (sin degradés, sombras mínimas, contraste AA, voz y tono).

### 2.3 Íconos: Material Symbols personalizados
- Usar **Material Symbols** (la familia de íconos de Material 3, de código abierto) en formato SVG importado por ícono, para no cargar la fuente completa.
- Personalización fija para todo el producto: un solo estilo (**Rounded**), peso **300** y tamaño óptico acorde (20 px en interfaz densa, 24 px en navegación).
- **Relleno como estado:** contorno (fill 0) por defecto; relleno (fill 1) solo para el ítem activo de la navegación y para estados seleccionados.
- Crear un componente `<Icon name="..." />` único que aplique estas reglas; no importar íconos sueltos en las pantallas.
- Íconos decorativos con `aria-hidden`; botones de solo ícono siempre con `aria-label` y tooltip.

### 2.4 Layout bento para datos
- Los dashboards y vistas de resumen (A1, J1, N1, S3, A13) se arman con una **grilla bento**: tarjetas de distintos tamaños en una misma grilla, según la importancia del dato.
- Desktop (≥ 1280 px): grilla de 12 columnas. Tablet (768 a 1279 px): 6 columnas. Mobile (< 768 px): 1 columna con el orden por prioridad.
- Tamaños de tarjeta definidos como variantes de un componente `<BentoCard size="sm | md | lg | wide | tall">`, por ejemplo: KPI = sm, gráfico principal = lg o wide, alertas = tall.
- Mismo espacio entre tarjetas en toda la grilla (token de espaciado), mismo radio y mismo padding interno.
- Cada tarjeta tiene título, dato principal y, si corresponde, una acción ("Ver detalle"). Nada de tarjetas con contenido que no cabe: si no entra, la tarjeta cambia de tamaño o el contenido se resume.
- **Sin huecos:** una tarjeta que en tablet quedaría sola en media fila ocupa la fila completa y reparte su contenido en dos columnas internas (D-68).
- **Ancho del contenido:** todo el ancho disponible, alineado con la barra superior; desde 1920 px, 10 % de margen interno por lado (D-82).
- **Ritmo vertical de 8 px:** 32 px entre secciones y 8 a 16 px dentro de cada una (D-69).

### 2.5 Sombras y elevación (uso mínimo)
- La interfaz debe sentirse **liviana**. Las tarjetas y superficies se separan con **color de superficie y bordes sutiles**, no con sombras.
- Sombras solo para elementos que flotan sobre otros: menús desplegables, popovers, tooltips, modales, toasts y el elemento que se arrastra en el constructor.
- Máximo dos niveles de sombra definidos como tokens (`--elevation-1` para menús y popovers, `--elevation-2` para modales y arrastre), suaves y neutras, sin color.
- Prohibido: sombras en tarjetas en reposo, sombras de colores, sombras múltiples apiladas y sombras grandes y difusas decorativas.

### 2.6 Animaciones concretas
Usar **Motion** (Framer Motion) solo para estas animaciones, con duraciones de 150 a 300 ms y las curvas de easing de Material 3:
- **Tarea completada:** el check se dibuja y la fila cambia de estado con una transición suave; las tareas desbloqueadas se resaltan brevemente.
- **Barras y anillos de progreso:** se llenan desde 0 al entrar a la pantalla y se actualizan con transición al cambiar.
- **KPIs:** el número cuenta hasta su valor al cargar el dashboard (solo la primera vez en la sesión).
- **Grilla bento:** las tarjetas aparecen con un fundido y desplazamiento corto, escalonado (30 a 50 ms entre tarjetas).
- **Flujos por pasos** (recorrido guiado, aviso de privacidad, problemas para ingresar): transición lateral entre pasos y avance del indicador de puntos, como en la referencia `original-d624f662`.
- **Constructor de plantillas:** la tarjeta arrastrada se eleva levemente y las demás se reacomodan con transición.
- **Modales, menús y toasts:** aparición y salida con fundido y escala o desplazamiento corto.
- **Carga:** esqueletos con pulso suave (sin degradé animado), con la forma de la pantalla que viene: uno por plantilla de página (panel, listado, catálogo, ficha, formulario y flujo por pasos), con bloques grises sobre las mismas tarjetas blancas. Se ven mientras llega el código de la pantalla y, como carga simulada breve, la primera vez que se abre cada pantalla en la sesión (D-140).
- **Inicio de la demo (G0):** el hero entra escalonado al cargar y cada sección aparece una vez al hacer scroll, con fundido y desplazamiento corto (D-74); dentro de cada sección, las tarjetas y filas de una lista entran una tras otra, 50 ms entre cada una, y las secciones por rol desde los costados alternados (D-92).
- Respetar `prefers-reduced-motion` y la preferencia "reducir animaciones" (F17): en ese caso, solo cambios de opacidad o ninguno.
- No animar por animar: nada de rebotes, rotaciones decorativas ni animaciones en bucle.

### 2.7 Responsive y control de desbordes
- Anchos a verificar en todas las pantallas: **320, 375, 768, 1024, 1280 y 1440 px** (320 px es el mínimo que exige WCAG para el reacomodo del contenido).
- **Cero desborde horizontal** de la página en cualquier ancho. Ningún texto, botón, tabla, gráfico ni tarjeta puede salirse de su contenedor ni quedar cortado sin intención.
- Textos largos (nombres, emails, títulos de tareas): cortar con puntos suspensivos y mostrar el texto completo en tooltip, o pasar a dos líneas con límite.
- **Tablas en mobile:** se transforman en listas de tarjetas con los datos principales; si una tabla debe mantenerse, el desplazamiento horizontal ocurre dentro de su contenedor, nunca en la página.
- Gráficos responsivos (se redimensionan con su tarjeta) y con leyendas que se reacomodan.
- Sin barra de desplazamiento visible en la página por debajo de 1024 px (D-86): se desplaza con el dedo, el panel táctil o la rueda.
- Navegación: barra lateral flotante expandida en desktop, plegada a íconos por debajo de 1280 px (se puede expandir), y en mobile menú inferior de íconos más un panel lateral desde el botón de menú (D-58, D-60).
- Áreas táctiles de al menos 48 × 48 px en mobile (igual que 2.1.3 y 2.10).
- **Cada pantalla abre desde arriba** (D-138): al ir a otra ruta, la página vuelve al inicio; los cambios de parámetros en la misma pantalla (por ejemplo, abrir los comentarios en A4) y atrás o adelante conservan la posición.
- **Volver arriba** (D-104): en G0, en el sitio del sistema de diseño y en la app, un botón cuadrado con esquinas suaves en la esquina inferior derecha, que aparece solo después de desplazarse y lleva el foco al `h1`; en celulares, dentro de la app, va por encima del menú inferior.
- **Verificación automatizada:** test con Playwright que recorre las pantallas principales de cada rol en los 6 anchos, saca capturas en `docs/screenshots/` y falla si `document.documentElement.scrollWidth > clientWidth`, si algún elemento marcado como contenedor desborda, si un texto queda aplastado en una columna de menos de 5 rem con tres líneas o más, o si un botón con borde o fondo cruza el borde de su tarjeta (D-103). Correrlo antes de cada revisión.
- **Componentes que se reacomodan por su contenedor, no por la pantalla** (D-103): los que se usan en tarjetas de distinto ancho (fila de tarea, pie de formulario) cambian de diseño con container queries (`@container`), no con los cortes de la pantalla.

### 2.8 Reglas de uso
- Si una pantalla del MVP no tiene referencia, construirla siguiendo el mismo sistema visual de las que sí la tienen.
- Si una referencia contradice este documento en cuanto a **funcionalidad**, manda este documento; si contradice en cuanto a **aspecto visual**, manda la referencia (salvo la regla de no usar degradés). Ante dudas, registrarlas en `docs/decisions.md`.
- **Sitio del sistema de diseño** (D-98): página pública en `/#/design-system`, con los tokens leídos en vivo y los componentes reales, enlazada desde el pie de G0 y el README; desde 1280 px tiene un índice lateral fijo con la sección actual y, por debajo, una barra fija "Secciones | sección actual" que abre ese índice en un panel desde la izquierda, como el de la app (D-104). `docs/design-system.md` es su versión en Markdown y `/styleguide` sigue siendo la página interna de desarrollo. Los diagramas de arquitectura se dibujan como figuras con los tokens del sistema y se exportan como imagen (`npm run og`); el de contexto sigue el modelo C4. Los wireflows de `docs/flows.md` se arman igual, con las capturas reales, desde la página interna `/wireflows` (D-100).
- Antes de construir pantallas, definir los tokens (colores por rol de M3, tipografía, radios, espaciados, elevación) en `src/styles/tokens.css` y en la config de Tailwind, y armar una página interna `/styleguide` (solo en desarrollo) que muestre todos los tokens y componentes base. `docs/design-system.md` se crea en ese mismo paso, con los valores implementados.
- Contraste mínimo WCAG 2.2 AA en todas las combinaciones de color de los tokens.

### 2.9 Voz y tono

**Idioma:** español latinoamericano neutro, para que lo entienda cualquier persona de la región. Sin regionalismos de ningún país (ni argentinismos, ni mexicanismos, ni españolismos).

**Tratamiento:** **tú**, en todo el producto y para todos los roles. Nunca *vos* ni *usted*, y nunca mezclarlos.
- Sí: "Completa tu perfil", "Revisa tu correo", "¿Fuiste tú?".
- No: "Completá tu perfil" (voseo), "Complete su perfil" (usted).

**Personalidad:** profesional, clara y cercana. Como una persona de RRHH que te recibe bien el primer día: amable sin exagerar y precisa sin sonar fría.

**Principios**
1. **Claridad primero:** frases cortas, una idea por oración, verbos de acción en botones ("Guardar plantilla", no "Aceptar").
2. **Sin culpar:** los errores explican qué pasó y qué hacer. "No pudimos verificar el código. Revisa que tenga 6 dígitos", no "Código incorrecto".
3. **Sin jerga técnica** para el nuevo ingreso y el jefe; la terminología técnica queda para las pantallas de sistemas.
4. **Lenguaje inclusivo sin marcas tipográficas:** evitar "bienvenido/a", "bienvenid@" o "bienvenidx". Usar formas neutras: "Te damos la bienvenida", "la persona nueva", "el equipo", "quien ingresa".
5. **Tono según el momento:** cálido en el recorrido del nuevo ingreso y en los logros ("¡Completaste la semana 1!"); neutro y directo en dashboards, seguridad y errores; serio y sin humor en bloqueos, privacidad y bajas.
6. **Sin signos de exclamación** salvo para celebrar avances reales, y como máximo uno por pantalla.

**Vocabulario fijo** (usar siempre el mismo término):

| Usar | Evitar |
| --- | --- |
| Iniciar sesión / Cerrar sesión | Ingresar, loguearse, salir |
| Correo | Mail, email (en la interfaz) |
| Cuenta de trabajo / correo de trabajo | Cuenta corporativa, cuenta empresarial, correo corporativo (Microsoft desaconseja estos términos junto a su botón de inicio de sesión; en sus interfaces en español usa "cuenta de trabajo o educativa" o "cuenta profesional o educativa") |
| Contraseña | Clave, password |
| Panel | Dashboard (en la interfaz) |
| Recorrido de ingreso | Onboarding (en textos para el nuevo ingreso; RRHH y sistemas pueden ver "onboarding") |
| Nuevo ingreso / persona nueva | Empleado nuevo, newbie |
| Jefe directo / líder | Manager, supervisor |
| Tarea | Ítem, to-do |
| Plantilla | Template |
| Celular | Móvil, teléfono móvil |
| Computadora | Ordenador, PC |

**Patrones de microcopy**
- **Títulos:** sin punto final.
- **Botones:** verbo + objeto ("Crear plantilla", "Enviar solicitud"). Acción principal a la derecha.
- **Confirmaciones destructivas:** título con la consecuencia ("¿Eliminar esta tarea?") y botón que la repite ("Eliminar tarea"), nunca "Sí / No".
- **Estados vacíos:** qué va a aparecer acá y cómo empezar ("Todavía no hay plantillas. Crea la primera para asignarla a un nuevo ingreso.").
- **Toasts de éxito:** en pasado y breves ("Plantilla publicada").
- **Fechas y números:** `DD/MM/AAAA`, separador de miles con punto y decimales con coma.

**Inglés:** misma personalidad, en inglés estadounidense, *sentence case* en títulos y botones.

Todos los textos viven en `src/locales/`. Antes de cerrar cada pantalla, revisar que cumpla esta sección.

### 2.10 Accesibilidad (WCAG 2.2 AA, equivalente a ISO/IEC 40500:2025)

**Formularios: etiqueta, texto de ayuda y placeholder**
- Cada campo tiene una **etiqueta visible y permanente** arriba del campo (`label-medium`). El placeholder **nunca** reemplaza a la etiqueta: desaparece al escribir y suele tener poco contraste.
- Los campos ocupan todo el ancho del formulario, y las etiquetas y los textos de ayuda nunca se cortan (D-69).
- 8 px entre la etiqueta, el campo y el texto de ayuda (D-82).
- **Debajo de cada campo va un texto de ayuda** (*supporting text* de M3, `body-small`, color `on-surface-variant`) que indica **exactamente qué hay que poner y en qué formato**, con un ejemplo. Por ejemplo:
    - Correo: "Tu correo de trabajo, por ejemplo: nombre.apellido@nortia.demo".
    - Fecha de ingreso: "Formato DD/MM/AAAA, por ejemplo: 13/10/2026".
    - Plazo de una tarea: "Días respecto del ingreso, entre -30 y 90. Usa números negativos para antes del ingreso, por ejemplo: -3".
    - Contraseña nueva: la lista de requisitos, que se tilda en vivo a medida que se cumplen.
- El placeholder es opcional y, si se usa, solo muestra un ejemplo breve con el mismo contenido del texto de ayuda; nunca una instrucción que no esté también en el texto de ayuda. Si se usa, su color debe cumplir el contraste de texto (4,5:1).
- El texto de ayuda se asocia al campo con `aria-describedby`.
- **Obligatorios:** se indica con el texto "(obligatorio)" en la etiqueta, no solo con un asterisco. Si casi todos son obligatorios, se marcan los opcionales con "(opcional)".
- **Errores**, evitando los cinco problemas típicos de los formularios:
    1. **No marcar error antes de que la persona termine de escribir:** la primera validación ocurre al salir del campo o al enviar, nunca mientras escribe.
    2. **El error va donde está el problema:** aparece en el lugar del texto de ayuda del campo afectado, en color `error`, con ícono, y el campo lleva `aria-invalid="true"`. En formularios largos, además, un resumen arriba con enlaces a cada campo y el foco movido ahí.
    3. **Mensajes concretos:** dicen qué corregir ("Ingresa una fecha con el formato DD/MM/AAAA"), nunca "Dato inválido".
    4. **El error desaparece apenas se corrige:** una vez que un campo mostró un error, se vuelve a validar mientras se escribe, y el mensaje se quita en cuanto el dato es correcto.
    5. **Un error nunca borra lo cargado:** los datos ingresados se conservan siempre (salvo la contraseña, por seguridad).
- **Errores del servidor:** aunque el formulario esté bien, el proceso puede fallar. Simular en la demo al menos un caso (por ejemplo, "El servicio no está disponible"), que se dispare solo con un comentario específico en el formulario de "¿Problemas para iniciar sesión?" (G4), para que no aparezca por accidente: se muestra un aviso arriba del formulario, se conservan los datos y se ofrece "Reintentar".
- Atributos `autocomplete` correctos (`email`, `current-password`, `new-password`, `one-time-code`) y tipos de input adecuados (`email`, `date`, `number`, `tel`).
- **Máscaras de entrada:** los campos con formato fijo solo aceptan los caracteres válidos, también al pegar (fecha: dígitos y barras automáticas; plazo: enteros con signo menos opcional, sin `type="number"`; código de verificación: 6 dígitos sin espacios; correo: sin espacios). La máscara no reemplaza la validación ni el texto de ayuda, y el valor final debe anunciarse correctamente al lector de pantalla.
- **No pedir dos veces el mismo dato** en un mismo flujo (criterio 3.3.7 de WCAG 2.2).
- **Autenticación accesible** (3.3.8): permitir pegar y usar gestores de contraseñas; el código MFA acepta pegado y se completa en un solo campo, no en seis cajitas separadas.

**Teclado y foco**
- Todo se usa con teclado, en un orden lógico. Enlace "Saltar al contenido" al inicio de cada página.
- Foco siempre visible (anillo `primary` de 2 px) y **nunca tapado** por el header fijo, toasts u otros elementos (2.4.11).
- Modales: el foco entra al abrir, queda atrapado dentro, se cierra con Escape y vuelve al elemento que lo abrió.
- **Arrastrar y soltar con alternativa** (2.5.7): en el constructor de plantillas, cada tarea tiene también botones o un menú "Subir" / "Bajar" / "Mover a etapa…", usables con teclado y con un solo clic.

**Estructura y lectores de pantalla**
- Landmarks (`header`, `nav`, `main`, `aside`), un único `h1` por pantalla y encabezados en orden.
- `lang="es"` o `lang="en"` en el documento, según el idioma elegido.
- Toasts y mensajes de estado anunciados con `aria-live="polite"`; errores críticos con `role="alert"`.
- **Gráficos:** cada gráfico tiene un título, un resumen en texto del dato principal y la opción "Ver como tabla".
- Estados con ícono + texto, nunca solo color. Imágenes decorativas con `alt=""`.

**Tiempo, movimiento y tamaño**
- Aviso de sesión por vencer con opción de extenderla (criterio 2.2.1), como ya define F0.
- Respetar `prefers-reduced-motion` y la preferencia de reducir animaciones.
- Áreas de clic de al menos 24 × 24 px en desktop (2.5.8) y 48 × 48 px en mobile.
- El contenido se reacomoda sin desplazamiento horizontal a 320 px y con zoom al 200 %.
- **Ayuda consistente** (3.2.6): el acceso a ayuda y a "¿Problemas para iniciar sesión?" está siempre en el mismo lugar.

**Verificación:** axe (por ejemplo, `@axe-core/playwright` dentro del test de Playwright) sin errores en todas las pantallas, recorrido completo con teclado de cada flujo principal y prueba con un lector de pantalla (NVDA o VoiceOver) en login, recorrido del nuevo ingreso y constructor de plantillas. Registrar los hallazgos en `docs/issues.md`.

---

## 3. Stack técnico

| Capa | Herramienta |
| --- | --- |
| Base | React 18 + Vite + TypeScript |
| Estilos | Tailwind CSS |
| Componentes | shadcn/ui (Radix debajo, accesibles por defecto), con estilos adaptados a los fundamentos de Material Design 3 |
| Navegación | React Router con **HashRouter** (necesario para GitHub Pages) |
| Estado global | Zustand, con persistencia en `localStorage` |
| Formularios | React Hook Form + Zod para validación |
| Gráficos | Recharts |
| Arrastrar y soltar | dnd-kit (constructor de plantillas) |
| Fechas | date-fns, con locale `es` |
| Íconos | Material Symbols en SVG (ver 2.3) |
| Animaciones | Motion (Framer Motion), ver 2.6 |
| Idiomas | react-i18next (español e inglés; ningún texto de interfaz escrito directo en los componentes) |
| Deploy | GitHub Pages vía GitHub Actions |

### Convenciones

- Idioma de la interfaz: **español latinoamericano neutro y profesional, con tuteo (tú)** como idioma principal e **inglés** como segundo idioma. Ver sección 2.9, Voz y tono. Todos los textos van en archivos de traducción (`src/locales/es.json`, `src/locales/en.json`).
- Código, nombres de variables y comentarios: en inglés.
- Componentes en PascalCase, un componente por archivo.
- Fechas en formato `DD/MM/AAAA` en la interfaz; ISO `YYYY-MM-DD` en los datos.
- No usar guiones largos (—) en los textos de la interfaz.

### Estructura sugerida

```
src/
  app/              # router, layout, providers
  components/       # componentes compartidos (ui/, charts/, layout/)
  features/
    journey/        # Mi recorrido (nuevo ingreso)
    templates/      # Constructor de plantillas (admin)
    hires/          # Alta y listado de ingresos (admin)
    dashboard/      # Dashboard de seguimiento (admin)
    checkins/       # Check-ins 30/60/90 (jefe)
    team/           # Vista de equipo del jefe
  data/             # JSON de datos simulados
  store/            # stores de Zustand
  lib/              # utilidades (fechas, cálculo de estados, métricas)
  styles/
design-references/  # referencias visuales provistas por Lourdes
```

---

## 4. Roles del MVP

El MVP incluye **cuatro roles navegables**. Se entra por un login simulado (ver F0) y, una vez dentro, se puede cambiar de rol con un selector fijo en el header (ej.: "Ver como: RRHH / Jefe / Nuevo ingreso / Sistemas"). Cambiar de rol equivale a iniciar sesión con el usuario demo de ese rol.

| Rol | Persona de ejemplo | Qué hace en el MVP |
| --- | --- | --- |
| **Admin RRHH / L&D** | Carla Méndez, People Partner | Crea y edita plantillas, da de alta ingresos, monitorea avance y alertas |
| **Jefe directo** | Martín Rossi, Líder de Desarrollo | Ve a su equipo en onboarding, hace check-ins 30/60/90, aprueba hitos |
| **Nuevo ingreso** | Sofía Ramírez, Analista de Datos Jr. | Ve su recorrido, completa tareas y cursos, responde check-ins |
| **Admin de sistemas (IT)** | Diego Ferreyra, Mesa de ayuda IT | Atiende solicitudes de acceso (desbloqueos, problemas de contraseña), revisa la auditoría y las políticas de seguridad |

Las cuentas son **corporativas**: el usuario nunca recupera ni desbloquea su acceso por su cuenta. Cualquier problema para ingresar se deriva siempre al admin de sistemas.

Las tareas pueden tener como responsable a otras áreas (IT, Facilities, buddy), pero **en el MVP esas áreas no tienen vista para gestionar tareas de onboarding** (el rol de sistemas solo gestiona accesos): sus tareas aparecen en el recorrido con el responsable indicado y **RRHH las marca como hechas desde la ficha del ingreso (A4)**. El jefe directo marca sus propias tareas desde J2.

Empresa ficticia para los datos: **Nortia S.A.**, empresa de servicios tecnológicos con unos 300 empleados.

**Segunda persona de sistemas (D-118):** además de Diego, los datos incluyen a **Ramiro Sosa, Analista de Seguridad IT**, sin cuenta de demo. Existe porque la doble aprobación (F14) necesita a otra persona de sistemas: lo que pide Diego lo decide Ramiro y lo que pide Ramiro lo decide Diego. Ramiro no aparece en G0 ni en "Ver como": la demo sigue teniendo cuatro recorridos.

**Jefa de RRHH (D-120):** con el mismo patrón que Ramiro, los datos incluyen a **Valeria Ortiz, Gerenta de Personas**, jefa directa de Carla, sin cuenta de demo y sin aparecer en G0 ni en "Ver como". Su rol en la plataforma es jefe directo (sin equipo en onboarding y sin permisos de admin): no hay un rol nuevo ni cambia la matriz de permisos. Se muestra con su foto y el anillo de `role-hr`, el color de su área (D-137). Existe para que a Carla la revise su jefa en la revisión de accesos (F13), como en una empresa real.

---

## 5. Funciones principales del MVP

Priorizadas con una matriz de decisión (valor para el usuario 40 %, demostración de habilidades 35 %, facilidad 25 %). El trabajo se divide en dos fases:

- **Fase A, núcleo (F0 a F6):** los apartados Must del producto más la seguridad base. Tiene que quedar completa y estable antes de empezar la fase B.
- **Fase B, base corporativa (F7 a F17):** las funciones que se esperan de una plataforma corporativa: notificaciones, versionado, privacidad, ciclo de vida de accesos, etc.

### F0. Autenticación y control de acceso (simulados en la interfaz)

**Inicio de la demo (G0)**

La demo para el portfolio y el producto se separan: la pantalla de inicio presenta el proyecto y deja elegir el recorrido; el login queda limpio, como lo vería un empleado de Nortia.

- Ruta `/`. Es la primera pantalla para quien llega sin sesión.
- Contenido, en este orden:
    1. Logo y nombre de Rumbo, y una frase que diga qué es y qué problema resuelve (por ejemplo: "Cada persona sabe qué hacer, con quién y para cuándo").
    2. Breve explicación de la demo: es un prototipo con datos ficticios de una empresa inventada, Nortia S.A.
    3. **Elección del recorrido:** cuatro tarjetas, una por rol (Carla, RRHH; Martín, jefe directo; Sofía, nuevo ingreso; Diego, sistemas). Cada una con la foto de la persona, la barra y el chip del color de su rol, qué hace y qué va a poder recorrer (2 o 3 puntos concretos).
    4. Botones "Ver el case study" y "Ver la documentación" (al `docs/README.md` del repositorio). La URL del case study sale de una constante `CASE_STUDY_URL` en un único archivo de configuración; mientras el case study no esté publicado, apunta al portfolio: `https://lpedaci.github.io/portfolio/`. El botón se muestra siempre.
    5. "Restablecer demo".
- Al elegir una tarjeta se abre el login con ese rol preseleccionado (`/login?demo=carla`, `martin`, `sofia` o `diego`).
- **Estructura de página de producto B2B** (D-70 y D-71, a partir de dos referencias de Lourdes):
    1. Barra superior flotante con el logo, enlaces a las secciones ("Cómo funciona", "Recorridos", "Preguntas") y la acción principal "Elegir un recorrido". Por debajo de 1024 px, los enlaces van en un menú.
    2. Hero centrado (D-73) con la etiqueta "Plataforma de onboarding para empresas · Caso de diseño UX/UI B2B" (D-75): titular con las palabras clave en `primary`, texto, "Elegir un recorrido" y el enlace "Ver el case study"; desde 640 px, debajo del texto, tres pantallas chicas superpuestas (los inicios de Sofía, Carla al frente y Martín) que se desvanecen hacia abajo con una máscara de transparencia (no es un degradé de color, D-123); en celulares, solo el texto. Reemplaza a las tarjetas flotantes (D-122).
    3. **El problema:** tres tarjetas con una escena hecha con piezas de Rumbo.
    4. **La solución:** bento de cinco tarjetas (recorridos por etapa, constructor de plantillas, check-ins, panel de seguimiento, seguridad y accesos), cada una con una mini interfaz.
    5. **Un recorrido para cada rol:** una sección por rol que alterna lados desde 1024 px: de un lado la foto, el chip del rol, un título, qué hace, qué se puede recorrer y "Recorrer como…"; del otro, una miniatura de su pantalla dentro de un marco, sobre el contenedor plano del color del rol. Las miniaturas usan los datos de demo cuando se puede.
    6. **Cifras** grandes, alternando `primary` y ciruela, sin tarjetas; los números salen de los datos de demo, nunca escritos a mano (salvo las 40 pantallas de esta versión, fases A y B, que son un dato de la spec, rotuladas "Pantallas en esta versión").
    7. **Recorre la demo en tres pasos:** elegir, iniciar sesión en un clic y cambiar de rol con «Ver como».
    8. **Preguntas frecuentes** en acordeón accesible.
    La página es blanca y continua: las secciones se separan por espacio, sin bandas de color; el hero tiene una cuadrícula muy tenue, que se repite en algunas secciones de cifras y llamados (en número, los tres pasos, el bento de "La solución" (D-124) y la franja final en su versión `primary-container`), nunca detrás de textos largos (D-92). Los encabezados van centrados: una etiqueta de texto simple en `primary` (sin píldora), el `h2` con las palabras clave en `primary` y sin punto final, y una línea de contexto (D-73, D-74). Sin texturas de puntos: dificultan la lectura. Antes del pie, una franja `primary-container` con "Elegir un recorrido".
    9. **Pie organizado por tareas:** marca con su frase y el aviso de demo; columnas "Explorar" (secciones de la página), "El proyecto" (case study, documentación y el sitio del sistema de diseño) y "La demo" (elegir un recorrido, restablecer); abajo, en una línea a todo el ancho, "Diseño y desarrollo: Lourdes Pedaci, Experience Designer (Learning y UX/UI)" con botones de ícono con tooltip a su LinkedIn, su portfolio y su GitHub (`AuthorLinks`, igual en el pie del sitio del sistema de diseño; D-102, D-103), y debajo el copyright con el año actual, centrado; y la marca "Rumbo" grande como SVG decorativo (D-92).
- **No se usan** logos de otras empresas ("empresas que confían") ni testimonios: serían inventados.
- Sin degradés ni sombras en tarjetas en reposo; en mobile, todo en una columna (las cifras, de a dos).

**Inicio de sesión (G1)**
- Pantalla de login limpia, con el logo de Rumbo y el de la empresa ficticia, y el texto "Usa tu cuenta de trabajo de Nortia" (Microsoft desaconseja expresiones como "cuenta corporativa" junto a su botón y recomienda "cuenta de trabajo o educativa").
- **SSO como opción principal:** botones "Continuar con Microsoft" y "Continuar con Google".
    - **Logos oficiales sin modificar**, descargados de las páginas de marca de cada empresa y guardados en `src/assets/brands/` con una nota de origen. Nunca cambiar su color, proporción o tamaño relativo, nunca combinarlos con el logo de Rumbo, nunca usar íconos genéricos ni versiones monocromáticas.
    - Logo "G" de Google en sus colores estándar sobre fondo blanco. Logo de Microsoft de cuatro cuadrados.
    - Textos exactos: "Continuar con Microsoft" y "Continuar con Google" (no "Google Workspace").
    - Los dos botones con el mismo tamaño, estilo y peso visual (Google exige igual prominencia frente a otras opciones).
- Opción secundaria "Iniciar sesión con correo y contraseña" (`carla@nortia.demo`, `martin@nortia.demo`, `sofia@nortia.demo`, `diego@nortia.demo`, contraseña `Demo.2026!`).
- **Con un rol preseleccionado desde el inicio** (`/login?demo=carla`): el login se ve limpio, sin recuadros. El formulario de correo llega con el correo de trabajo de esa persona precargado, y los botones de SSO entran con su cuenta ficticia (ver G2) (D-66).
- **Sin rol preseleccionado** (quien entra directo a `/login`): login limpio; se puede usar cualquiera de las credenciales de demo.
- Se mantiene "¿Problemas para iniciar sesión?".
- Aviso de demo discreto (una línea, sin ocupar el espacio principal): "Demo con datos ficticios: no ingreses datos reales".
- Ya no hay tarjetas de roles ni panel de marketing en el login.

**Simulación de la redirección SSO (G2)**
- Pantalla **neutra y claramente rotulada** como simulación, por ejemplo: "Simulación: en un entorno real, acá te redirigiríamos al inicio de sesión de tu empresa con Microsoft".
- **Nunca imitar la página real de inicio de sesión de Microsoft ni de Google** (ni su diseño, ni sus colores, ni sus textos): una copia de esa página funciona igual que una página de phishing, aunque sea para una demo.
- Puede mencionar que, en producción, esa página mostraría la marca de Nortia (los proveedores permiten que cada empresa personalice su página de inicio de sesión), sin reproducirla.
- Botón "Continuar" que completa el inicio de sesión simulado y lleva a la verificación en dos pasos.
- **Con un rol preseleccionado:** la simulación muestra la cuenta ficticia de la persona (foto, nombre y correo) y tilda tres pasos de 1,2 s cada uno (te redirigimos, cuenta de trabajo, el proveedor confirmó tu identidad); sigue sola a MFA con el código precargado, y "Continuar" evita la espera. Sin rol preseleccionado, muestra el selector de cuentas de demo (D-66, D-67).

**Mensajes y protección contra fuerza bruta**
- Error de credenciales **genérico** ("Correo o contraseña incorrectos"), sin revelar si el correo existe.
- **Bloqueo de cuenta** tras 5 intentos fallidos. La cuenta **no se desbloquea sola ni por el usuario**: la pantalla explica qué pasó y deriva al admin de sistemas (ver "Problemas para iniciar sesión").
- El aviso de bloqueo se muestra sin culpar al usuario y sin revelar datos de la cuenta.

**Verificación en dos pasos (MFA)**
- Después de la contraseña, pantalla de código de 6 dígitos (app autenticadora). En la demo el código es `246810` y se muestra en un aviso.
- Opción "Recordar este dispositivo por 30 días" y enlace "Usar un código de respaldo".
- Obligatoria para los roles admin de RRHH y admin de sistemas; opcional para los demás (configurable en la pantalla de seguridad).

**Problemas para iniciar sesión (derivación obligatoria a sistemas)**
- No hay autogestión: ni "olvidé mi contraseña" con email, ni desbloqueo automático por tiempo.
- El enlace del login se llama **"¿Problemas para iniciar sesión?"** y lleva a una pantalla que:
    1. Explica que las cuentas de trabajo las gestiona el área de sistemas.
    2. Si se ingresó con SSO, aclara que la contraseña es la de la cuenta de la empresa (Microsoft o Google) y que se cambia con sistemas, no en esta plataforma.
    3. Muestra los canales de la mesa de ayuda (ficticios): portal de tickets, `soporte.it@nortia.demo` e interno 4400, con horario de atención.
    4. Ofrece un formulario breve **"Solicitar ayuda a sistemas"**: correo de trabajo, motivo (cuenta bloqueada, olvidé mi contraseña, no recibo el código de verificación, otro) y comentario opcional.
- Al enviar, se genera una solicitud con número (ej.: `IT-2026-0142`) y un mensaje de confirmación que dice que sistemas va a **verificar la identidad** antes de restablecer el acceso. El mensaje es siempre el mismo, exista o no el email.
- La solicitud aparece en la bandeja del admin de sistemas (F6). Cuando la resuelve, el usuario puede volver a ingresar; si se restableció la contraseña, al entrar se le pide crear una nueva con la **política visible y validada en vivo** (mínimo 12 caracteres, mayúscula, minúscula, número y símbolo, distinta de las anteriores, con indicador de fortaleza).
- En la demo, la pantalla de confirmación incluye un enlace "Ver como sistemas (demo)" que entra como Diego directo a esa solicitud, para mostrar el flujo de punta a punta.

**Sesión**
- **Expiración por inactividad:** 15 minutos. Al minuto 13 aparece un modal accesible "Tu sesión está por vencer" con "Seguir conectado" o "Cerrar sesión". En la demo, un control en el menú de usuario permite acelerar el aviso para mostrarlo.
- Cerrar sesión limpia el estado de sesión y vuelve al login con un mensaje de confirmación.
- Menú de usuario con nombre, rol, "Mi seguridad" (dispositivos recordados y estado de MFA) y "Cerrar sesión".

**Autorización (control de acceso por rol, RBAC)**
- Sin sesión, cualquier ruta interna redirige al login y, tras ingresar, vuelve a la ruta pedida.
- Cada rol accede solo a sus rutas; si intenta entrar a otra, ve la pantalla "Acceso no permitido" (G7) y el intento se registra en la auditoría.
- Los permisos se definen en **un único archivo** (`src/lib/permissions.ts`) como matriz rol × acción, y tanto las rutas como los botones consultan esa matriz (ej.: `can(user, 'template:edit')`). Nunca condicionar por nombre de rol suelto en los componentes.
- **Mínimo privilegio en los datos:** el jefe ve solo a su equipo; la autoevaluación del nuevo ingreso la ven solo su jefe y RRHH; en el dashboard, los datos de ánimo se muestran agregados.
- Al cambiar de rol con el selector de demo, se cierra la sesión actual y se inicia la del usuario demo de ese rol (queda registrado en la auditoría).

### F6. Seguridad, accesos y auditoría (admin de sistemas)
- **Bandeja de solicitudes de acceso:** lista con número, usuario, motivo, fecha y estado (nueva, en verificación, resuelta, rechazada). En el detalle, el admin marca la **verificación de identidad** (checklist simulado: llamada al interno registrado o validación con el jefe directo) y luego elige: **desbloquear cuenta**, **forzar cambio de contraseña**, **restablecer verificación en dos pasos** o rechazar con motivo. Cada acción queda en la auditoría.
- **Usuarios bloqueados:** listado de cuentas bloqueadas con intentos fallidos y último intento, con acceso directo a desbloquear.
- **Registro de auditoría:** tabla de eventos con fecha y hora, usuario, acción, recurso y resultado. Eventos registrados: inicio y cierre de sesión, intentos fallidos, bloqueos, solicitudes de acceso y su resolución, desbloqueos, cambios forzados de contraseña, verificación MFA, acceso denegado, alta de ingreso, cambios en plantillas, check-ins escalados y restablecimiento de la demo.
- Filtros por usuario, tipo de evento y rango de fechas; exportación a CSV.
- **Matriz de permisos** por rol en modo lectura, generada desde `permissions.ts`.
- **Políticas de la organización** (simuladas): MFA obligatorio por rol, duración de sesión, intentos antes del bloqueo y política de contraseñas, con los valores vigentes.
- El admin de RRHH no tiene acceso a esta sección: la gestión de accesos es exclusiva de sistemas.

> Lo de esta sección es **simulación de interfaz**: no protege nada de verdad, porque todo corre en el navegador. Ver sección 8 para lo que sí se aplica realmente y cómo sería en producción.

### F1. Mi recorrido (nuevo ingreso)
- Ver el recorrido completo agrupado por etapas: **Preingreso, Semana 1, Mes 1, Días 30 a 90**.
- Cada tarea muestra: título, tipo (tarea, curso, reunión, lectura, documento), responsable, fecha límite calculada y estado.
- Completar tareas propias (marcar como hecha; en cursos, abrir el contenido y marcarlo completado).
- Las tareas **bloqueadas por dependencias** se ven deshabilitadas con el motivo ("Primero completa: Acceso a Jira").
- Barra de progreso general y por etapa.
- Bloque "Lo próximo" con las 3 tareas más urgentes.
- Contactos clave: jefe directo, buddy y referente de RRHH.

### F2. Constructor de plantillas (admin)
- Listado de plantillas por puesto con cantidad de tareas y uso (cuántos ingresos la usan).
- Crear, duplicar y editar una plantilla.
- Dentro de una plantilla: etapas fijas y tareas que se agregan, editan, eliminan y **reordenan con arrastrar y soltar**.
- Cada tarea define: título, descripción, tipo, responsable (nuevo ingreso, jefe, buddy, RRHH, IT, Facilities), **plazo relativo** a la fecha de ingreso (ej.: -3 días, +5 días) y **dependencias** de otras tareas de la misma plantilla.
- **Rango del plazo relativo:** de -30 a 90 días respecto de la fecha de ingreso (cubre desde el preingreso hasta el final de la etapa Días 30 a 90).
- Validaciones: no permitir dependencias circulares ni una dependencia cuyo plazo sea posterior al de la tarea que depende de ella.
- Vista previa del recorrido como lo verá el nuevo ingreso, con una fecha de ingreso de ejemplo.

### F3. Alta de ingresos (admin)
- Formulario de alta: nombre, puesto, área, fecha de ingreso, jefe directo, buddy, plantilla.
- Al guardar, el sistema **genera el recorrido**: copia las tareas de la versión publicada de la plantilla y calcula fechas reales a partir de la fecha de ingreso.
- Listado de ingresos con filtro por estado (próximo a ingresar, en curso, finalizado) y por área.
- Ficha del ingreso: datos, recorrido con estados y historial de check-ins.

### F4. Dashboard de seguimiento (admin)
- KPIs: ingresos activos, % de tareas completadas a tiempo, recorridos con atraso, promedio de avance.
- Gráfico de avance por ingreso o por cohorte (mes de ingreso).
- Gráfico de tareas atrasadas por responsable (para detectar cuellos de botella, ej.: IT). **Una tarea vencida porque está bloqueada por otra se atribuye al responsable de la tarea que bloquea**, no a quien espera.
- **Alertas**: recorridos con tareas vencidas, check-ins pendientes, tareas bloqueadas hace más de X días.
- Desde cada alerta se puede ir a la ficha del ingreso.

### F5. Check-ins 30/60/90 (jefe y nuevo ingreso)
- El jefe ve su equipo en onboarding con avance y próximo check-in.
- Formulario de check-in: evaluación de hitos de la etapa (cumplido / parcial / no cumplido), comentarios y próximos pasos.
- Si un hito queda "no cumplido", el jefe elige: **reprogramar** (nueva fecha) o **escalar a RRHH** (genera alerta en el dashboard).
- El nuevo ingreso responde su parte del check-in (autoevaluación breve y cómo se siente) antes de la reunión.
- El check-in queda en el historial de la ficha del ingreso.

---

### Funciones de fase B (base corporativa)

Se construyen **después** de que el núcleo (F0 a F6) esté completo y funcionando. Ver sección 10.

### F7. Centro de notificaciones (todos los roles)
- Ícono de campana en el header con contador de no leídas y panel desplegable; página completa con filtros (todas, no leídas, por tipo).
- Notificaciones generadas por eventos del sistema, por ejemplo:
    - Nuevo ingreso: tarea por vencer (2 días antes), tarea desbloqueada, check-in pendiente, comentario nuevo.
    - Jefe: check-in de su equipo por hacer, autoevaluación completada, tarea del jefe vencida.
    - RRHH: recorrido atrasado, check-in escalado, solicitud de privacidad nueva, cambio de rol pendiente de aprobación.
    - Sistemas: solicitud de acceso nueva, alerta de inicio de sesión inusual reportada, tareas de alta o baja de accesos, campaña de revisión por cerrar.
- Cada notificación lleva directo al lugar de la acción. Marcar como leída, marcar todas, y toasts para lo que ocurre en la sesión actual.
- **Vista previa de email simulado:** en el detalle de una notificación, "Ver cómo llega por email" muestra la plantilla del correo (no se envía nada).
- Respetan las preferencias del usuario (F17).

### F8. Plantillas con borrador, publicación y versiones
- Cada plantilla tiene estado **borrador** o **publicada** y un número de versión (v1, v2...).
- Editar una plantilla publicada crea un borrador nuevo; la versión publicada sigue vigente hasta que se publique el borrador.
- **Los recorridos en curso no cambian** al publicar una versión nueva: cada ingreso queda asociado a la versión con la que se creó. La ficha del ingreso muestra qué versión usa.
- Al publicar: resumen de cambios (tareas agregadas, quitadas, modificadas) y nota de versión obligatoria.
- Historial de versiones con fecha, autor, nota y comparación entre dos versiones. Opción de restaurar una versión anterior como borrador nuevo.
- Solo se pueden asignar plantillas publicadas.

### F9. Comentarios en tareas
- Hilo de comentarios en el detalle de cada tarea del recorrido, visible para el nuevo ingreso, el responsable de la tarea, el jefe y RRHH.
- Mención con `@` a personas involucradas en el recorrido (genera notificación).
- Editar o borrar el propio comentario (queda marcado como editado). Solo texto plano, sin HTML.

### F10. Privacidad y datos personales
- **Aviso de privacidad y consentimiento** la primera vez que cualquier usuario entra: qué datos se usan, para qué, quién los ve y por cuánto tiempo. Sin aceptar no se puede continuar; la aceptación queda registrada con fecha y versión del aviso.
- Pantalla **"Mi privacidad"**: ver el aviso vigente, la fecha de aceptación y los datos personales propios que tiene la plataforma.
- **Solicitudes sobre datos personales** (acceso, rectificación o supresión, según la Ley 25.326): el usuario la envía desde "Mi privacidad"; RRHH la gestiona en una bandeja con plazo de respuesta visible, estados y respuesta al usuario. Plazos: acceso en 10 días corridos (art. 14); rectificación y supresión en 5 días hábiles, sin sábados ni domingos (art. 16). Viven en una sola constante de configuración (`PRIVACY_DEADLINES`, `src/app/legal.ts`) por si una reforma los cambia (D-113).
- **Enmascarado de datos sensibles:** el DNI y el CUIL se muestran ocultos (`***.***.1234`). La plataforma no guarda datos bancarios: los pide liquidación de sueldos y ningún flujo del recorrido los necesita (minimización, D-135). Revelarlos requiere el permiso `pii:reveal`, pide un motivo y queda en la auditoría.
- **Retención:** política visible en la pantalla de políticas (ej.: datos del recorrido 2 años después de finalizado, autoevaluaciones 1 año). En la demo, los ingresos finalizados muestran la fecha programada de anonimización.

### F11. Sesiones, dispositivos y alertas de inicio de sesión
- En "Mi seguridad": lista de **sesiones activas** (dispositivo, navegador, ubicación aproximada, último uso, sesión actual marcada) con "Cerrar esta sesión" y "Cerrar sesión en todos los demás dispositivos".
- **Alerta de inicio de sesión inusual:** cuando hay un ingreso desde un dispositivo o ubicación nueva, el usuario recibe una notificación "¿Fuiste tú?" con dos opciones: "Sí, fui yo" o "No fui yo". "No fui yo" cierra esa sesión, genera una solicitud urgente para sistemas y le indica al usuario que se comunique con la mesa de ayuda.
- Sistemas ve las sesiones activas de toda la organización y puede **forzar el cierre** de las sesiones de una cuenta (queda en la auditoría).
- Los datos semilla incluyen al menos un inicio de sesión inusual para Sofía, para poder mostrar el flujo.

### F12. Ciclo de vida de accesos: alta, cambio y baja
- **Alta:** al crear un ingreso (F3), se generan automáticamente las tareas de accesos para sistemas según el puesto (cuenta de trabajo, correo, herramientas del área). Sistemas las ve en su bandeja y las marca como otorgadas.
- **Cambio de puesto o área:** RRHH registra el cambio con fecha efectiva; se generan tareas para sistemas de otorgar los accesos nuevos y **revocar los que ya no corresponden**.
- **Baja (offboarding de accesos):** RRHH registra la desvinculación con fecha y tipo; se genera un checklist de revocación para sistemas (cuenta, correo, herramientas, dispositivos asignados) y un recordatorio al jefe. A la fecha efectiva, la cuenta queda deshabilitada en la demo y sus sesiones se cierran.
- Cada evento muestra su avance (accesos pendientes, otorgados, revocados) y queda en la auditoría.

### F13. Revisión periódica de accesos
- Sistemas crea una **campaña de revisión** (ej.: "Revisión trimestral Q4 2026") con fecha límite y alcance (toda la empresa o un área).
- Cada jefe recibe la lista de su equipo con los accesos y roles de cada persona y marca, para cada uno, **mantener** o **revocar** (con motivo).
- Sistemas sigue el avance de la campaña (% revisado por jefe), envía recordatorios y ejecuta las revocaciones.
- Al cerrar, se genera un resumen descargable de la campaña.
- **Reglas de la campaña:**
    - Nadie revisa sus propios accesos: cada persona la revisa su jefe directo según los datos (a Carla, Valeria Ortiz; D-120). La regla "si no tiene jefe directo, la revisa RRHH" queda solo como respaldo, se ve en el detalle de la campaña y nunca asigna a la misma persona que se revisa.
    - Cuando quien revisa no tiene cuenta de demo (Valeria), el detalle de la campaña (S6) ofrece "Resolver como Valeria (demo)", con el mismo rótulo de atajo y el mismo registro en la auditoría que "Resolver como Ramiro (demo)" (actor Valeria, detalle "decisión simulada en la demo").
    - Las cuentas con rol de admin (RRHH y sistemas, incluido Ramiro) **siempre** entran en el alcance, porque son las de mayor riesgo.
    - Si la decisión es revocar un rol de admin, la revocación no se aplica directo: genera una solicitud de doble aprobación (F14) y la fila de la campaña queda en "Revocación en aprobación" hasta que se resuelve.
    - Las revocaciones quedan en la auditoría con el nombre de la campaña.
    - **Mínimo dos personas de sistemas** (D-121): si revocar un rol de sistemas dejaría a sistemas con menos de dos personas activas, la revocación no se aplica: se muestra "No se puede quitar este rol: sistemas quedaría con una sola persona y nadie podría aprobar sus cambios. Primero asigna el rol a otra persona.", la fila queda en "Revocación bloqueada" (ícono y texto) y el intento queda en la auditoría con resultado `denied`.

### F14. Doble aprobación en cambios sensibles
- Ciertas acciones necesitan una **segunda persona** que apruebe antes de aplicarse: asignar o quitar el rol de admin de RRHH o de admin de sistemas, cambiar políticas de seguridad y revelar datos sensibles en forma masiva.
- Quien pide el cambio no puede aprobarlo. La solicitud queda pendiente en la bandeja de aprobaciones de sistemas, con motivo, y la persona que la aprueba o rechaza queda registrada.
- **Cerrar el circuito en la demo (D-118):** cuando una solicitud de Diego espera a Ramiro, la fila muestra "Esperando a Ramiro Sosa" y, en el detalle, un botón de texto "Resolver como Ramiro (demo)" rotulado como atajo de demo, igual que "Ver como sistemas (demo)" en G4. Abre la misma decisión (aprobar o rechazar con nota) y la auditoría registra a Ramiro como actor con el detalle "decisión simulada en la demo". Diego nunca ve los botones normales de aprobar en sus propias solicitudes.
- En `docs/security.md`, dejar asentado que en producción la doble aprobación exige al menos dos personas con el rol de sistemas (separación de funciones).
- **Mínimo dos personas de sistemas** (D-121): ningún cambio puede dejar a sistemas con menos de dos personas activas, porque la doble aprobación dejaría de funcionar. Vale para la revocación en una campaña (F13), el cambio de rol (F15) y la baja (F12). Se verifica al crear la solicitud y otra vez al aprobarla (por si otra persona cambió entre medio); si no se cumple, no se aplica, se muestra "No se puede quitar este rol: sistemas quedaría con una sola persona y nadie podría aprobar sus cambios. Primero asigna el rol a otra persona." (en la baja, "No se puede dar de baja a esta persona…") y el intento queda en la auditoría con resultado `denied`. Al aprobar, el botón queda deshabilitado con el motivo y la solicitud se puede rechazar.

### F15. Gestión de usuarios y catálogos (admin RRHH)
- Listado de personas con búsqueda y filtros (área, puesto, rol, estado: activa, bloqueada, dada de baja).
- Alta y edición de personas (datos laborales, jefe directo, rol en la plataforma). El cambio de rol a admin pasa por la doble aprobación (F14).
- Catálogos editables de **áreas** y **puestos**; cada puesto puede tener una plantilla de onboarding sugerida y un paquete de accesos sugerido (usado por F12).

### F16. Búsqueda global, ayuda contextual y exportación
- **Búsqueda global** en el header (atajo `Ctrl+K` o `/`): personas, plantillas, tareas y solicitudes, filtrada según los permisos del rol. Resultados agrupados por tipo.
- **Ayuda contextual:** en cada pantalla principal, un ícono de ayuda abre una explicación breve; la primera vez que un rol entra, un **recorrido guiado** de 3 a 5 pasos presenta lo esencial (se puede saltar y volver a ver desde el menú).
- **Estados vacíos guiados:** cada lista vacía explica qué va a aparecer ahí y ofrece la acción para empezar.
- **Exportación:** listados y reportes exportables a CSV, y vista imprimible o PDF (con estilos de impresión) del dashboard, la ficha del ingreso y el resumen de campañas de revisión. Las exportaciones respetan el enmascarado de datos y quedan en la auditoría.

### F17. Preferencias del usuario
- Idioma de la interfaz: **español e inglés** (ver sección 3).
- Notificaciones: por tipo de evento, elegir en la app, por email (simulado) o ambas.
- Zona horaria (por defecto America/Buenos_Aires) y formato de fecha.
- Preferencias de accesibilidad: reducir animaciones y modo de alto contraste.

---

## 6. Pantallas del MVP

### Generales
| # | Pantalla | Ruta | Notas |
| --- | --- | --- | --- |
| G0 | Inicio de la demo (presentación y elección de recorrido) | `/` | F0 |
| G1 | Login (SSO, correo y contraseña, rol preseleccionado opcional) | `/login` | F0 |
| G2 | Simulación neutra de redirección SSO | `/login/sso` | F0 |
| G3 | Verificación en dos pasos | `/login/verify` | F0 |
| G4 | Problemas para iniciar sesión (canales de sistemas + solicitud de ayuda y confirmación) | `/access-help` | F0 |
| G5 | Mi seguridad (MFA, dispositivos recordados y sesiones activas) | `/account/security` | F0, F11 (sesiones: fase B) |
| G6 | Layout con header, selector de rol, menú de usuario, modal de sesión por vencer y navegación lateral | (layout) | La navegación cambia según el rol |
| G7 | Acceso no permitido / 404 | `*` | Con link para volver al inicio del rol |
| G7b | Error inesperado | (de la app) | Si una pantalla falla, muestra qué pasó sin culpar, que los datos siguen guardados, "Recargar la página", "Volver al inicio", "Restablecer demo" y el detalle técnico plegado, nunca el error crudo (D-71) |
| G8 | Aviso de privacidad y consentimiento (primer ingreso) | `/consent` | F10 · Fase B |
| G9 | Centro de notificaciones | `/notifications` | F7 · Fase B (el panel desplegable vive en el layout) |
| G10 | Mi privacidad (aviso, datos propios, solicitudes) | `/account/privacy` | F10 · Fase B |
| G11 | Preferencias | `/account/preferences` | F17 · Fase B |
| G12 | Resultados de búsqueda | `/search` | F16 · Fase B (la búsqueda rápida vive en el layout) |

### Admin RRHH / L&D
| # | Pantalla | Ruta | Función |
| --- | --- | --- | --- |
| A1 | Dashboard de seguimiento | `/admin` | F4 |
| A2 | Listado de ingresos | `/admin/hires` | F3 |
| A3 | Alta de ingreso | `/admin/hires/new` | F3 |
| A4 | Ficha del ingreso | `/admin/hires/:id` | F3, F5 (historial) |
| A5 | Listado de plantillas | `/admin/templates` | F2 |
| A6 | Editor de plantilla | `/admin/templates/:id` | F2 |
| A7 | Vista previa de plantilla | `/admin/templates/:id/preview` | F2 |
| A8 | Historial y comparación de versiones de plantilla | `/admin/templates/:id/versions` | F8 · Fase B |
| A9 | Personas y catálogos (áreas, puestos) | `/admin/people` | F15 · Fase B |
| A10 | Ficha de persona (datos, rol, historial de cambios) | `/admin/people/:id` | F15, F12 · Fase B |
| A11 | Altas, cambios de puesto y bajas | `/admin/lifecycle` | F12 · Fase B |
| A12 | Solicitudes sobre datos personales | `/admin/privacy-requests` | F10 · Fase B |
| A13 | Reportes y exportaciones | `/admin/reports` | F16 · Fase B |

### Jefe directo
| # | Pantalla | Ruta | Función |
| --- | --- | --- | --- |
| J1 | Mi equipo en onboarding | `/manager` | F5 |
| J2 | Detalle del ingreso (vista jefe) | `/manager/hires/:id` | F1 en modo lectura + F5 |
| J3 | Formulario de check-in | `/manager/hires/:id/checkin/:stage` | F5 |
| J4 | Revisión de accesos de mi equipo | `/manager/access-review` | F13 · Fase B |

### Admin de sistemas
| # | Pantalla | Ruta | Función |
| --- | --- | --- | --- |
| S1 | Bandeja de solicitudes de acceso | `/it/requests` | F6 |
| S2 | Detalle de solicitud (verificación y resolución) | `/it/requests/:id` | F6 |
| S3 | Seguridad y auditoría (usuarios bloqueados, sesiones activas, auditoría, permisos, políticas) | `/it/security` | F6, F11 |
| S4 | Tareas de accesos: altas, cambios y bajas | `/it/lifecycle` | F12 · Fase B |
| S5 | Campañas de revisión de accesos | `/it/access-reviews` | F13 · Fase B |
| S6 | Detalle de campaña (avance por jefe, revocaciones) | `/it/access-reviews/:id` | F13 · Fase B |
| S7 | Aprobaciones pendientes | `/it/approvals` | F14 · Fase B |

### Nuevo ingreso
| # | Pantalla | Ruta | Función |
| --- | --- | --- | --- |
| N1 | Inicio / Mi recorrido | `/me` | F1 |
| N2 | Detalle de tarea o curso | `/me/tasks/:id` | F1 |
| N3 | Mi check-in (autoevaluación) | `/me/checkin/:stage` | F5 |

Total: **24 pantallas en fase A** (8 generales y de acceso + 7 admin RRHH + 3 jefe + 3 nuevo ingreso + 3 admin de sistemas) y **16 más en fase B**, **40 en total**. Los comentarios (F9) viven dentro de N2, J2 y A4; las notificaciones y la búsqueda rápida, en el layout.

### Estados que cada pantalla debe contemplar
- Vacío (sin datos), carga simulada breve, error de validación y éxito (toast de confirmación).
- Confirmación antes de acciones destructivas (eliminar tarea o plantilla).

---

## 7. Modelo de datos (JSON simulado)

```ts
type Role = 'admin' | 'manager' | 'hire' | 'it_admin';
type Stage = 'preboarding' | 'week1' | 'month1' | 'days30to90';
type TaskType = 'task' | 'course' | 'meeting' | 'reading' | 'document';
type Owner = 'hire' | 'manager' | 'buddy' | 'hr' | 'it' | 'facilities';
type TaskStatus = 'pending' | 'in_progress' | 'done' | 'blocked' | 'overdue';

interface Person { id: string; name: string; role: Role; jobTitle: string; area: string; email: string; avatarUrl?: string }

// Todo lo siguiente es simulado: no hay tokens ni contraseñas reales.
interface Session {
  personId: string; role: Role; method: 'sso_microsoft' | 'sso_google' | 'password';
  mfaVerified: boolean; startedAt: string; lastActivityAt: string; expiresAt: string;
}

interface AuthAttempts { email: string; failedCount: number; locked: boolean; lockedAt?: string; lastAttemptAt?: string }

interface AccessRequest {
  id: string;                    // ej.: 'IT-2026-0142'
  email: string; personId?: string; createdAt: string;
  reason: 'locked' | 'forgot_password' | 'mfa_issue' | 'other'; comment?: string;
  status: 'new' | 'verifying' | 'resolved' | 'rejected';
  identityVerified: boolean;
  resolution?: { action: 'unlock' | 'force_password_reset' | 'reset_mfa' | 'reject'; by: string; at: string; note?: string };
}

interface SecurityPolicy {
  mfaRequiredFor: Role[]; sessionIdleMinutes: number; passwordMinLength: number;
  lockoutAttempts: number;   // sin lockoutMinutes: el desbloqueo nunca es automático, solo lo hace sistemas
}

interface AuditEvent {
  id: string; at: string; actorId: string; action: string;   // ej.: 'auth.login', 'template.update'
  resource?: string; result: 'success' | 'failure' | 'denied'; detail?: string;
}

interface Template {
  id: string; name: string; jobTitle: string; area: string;
  updatedAt: string; tasks: TemplateTask[];
}

interface TemplateTask {
  id: string; stage: Stage; order: number;
  title: string; description: string; type: TaskType; owner: Owner;
  offsetDays: number;            // relativo a la fecha de ingreso (negativo = antes)
  dependsOn: string[];           // ids de TemplateTask
  resourceUrl?: string;          // curso o documento
}

interface Hire {
  id: string; personId: string; startDate: string;
  managerId: string; buddyId?: string; hrId: string;
  templateId: string; status: 'upcoming' | 'active' | 'completed';
  tasks: HireTask[]; checkins: Checkin[];
}

interface HireTask extends Omit<TemplateTask, 'offsetDays'> {
  templateTaskId: string; dueDate: string; status: TaskStatus; completedAt?: string;
}

interface Checkin {
  id: string; stage: 'day30' | 'day60' | 'day90'; dueDate: string;
  status: 'pending' | 'hire_done' | 'completed';
  hireSelfReview?: { mood: 1 | 2 | 3 | 4 | 5; comment: string };
  milestones: { id: string; label: string; result?: 'met' | 'partial' | 'not_met' }[];
  managerComment?: string; nextSteps?: string;
  action?: { type: 'reschedule'; newDate: string } | { type: 'escalate'; note: string };
}

// ---------- Fase B ----------
// Implementado como AppNotification (D-105): guarda type y params en lugar de title y body, y la interfaz traduce el texto.
interface Notification {
  id: string; recipientId: string; createdAt: string; readAt?: string;
  type: string;                  // ej.: 'task.due_soon', 'access_request.new'
  title: string; body: string; link: string; channels: ('app' | 'email')[];
}

// Implementado (D-108): Template.versions guarda las versiones publicadas (número, fecha, autor, nota, datos y tareas); Template.tasks es el borrador de trabajo y el estado se deriva; Hire.templateVersion guarda la versión usada.
interface TemplateVersion {
  id: string; templateId: string; version: number; status: 'draft' | 'published' | 'archived';
  tasks: TemplateTask[]; note?: string; createdBy: string; createdAt: string; publishedAt?: string;
}
// Template pasa a tener: currentPublishedVersionId y draftVersionId?. Hire guarda templateVersionId.

// Implementado (D-112): suma hireId para encontrar el hilo sin recorrer todos los recorridos.
interface Comment {
  id: string; hireTaskId: string; authorId: string; body: string;   // texto plano
  mentions: string[]; createdAt: string; editedAt?: string; deletedAt?: string;
}

interface ConsentRecord { personId: string; noticeVersion: string; acceptedAt: string }

interface PrivacyRequest {
  id: string; personId: string; type: 'access' | 'rectification' | 'deletion';
  detail: string; createdAt: string; dueAt: string;
  status: 'new' | 'in_progress' | 'answered' | 'rejected'; response?: string; handledBy?: string;
}

// Implementado (D-114): DeviceSession suma kind (desktop | mobile); LoginAlert suma requestId; AccessRequest suma urgent y el motivo unrecognized_login.
interface DeviceSession {
  id: string; personId: string; device: string; browser: string; approxLocation: string;
  startedAt: string; lastSeenAt: string; current: boolean; revokedAt?: string; revokedBy?: string;
}

interface LoginAlert {
  id: string; personId: string; sessionId: string; createdAt: string;
  status: 'pending' | 'confirmed' | 'reported';
}

// Implementado (D-117): LifecycleEvent suma createdAt, fromJobTitleId, toJobTitleId y leaverType; los accesos salen de JobTitle.suggestedAccess.
interface LifecycleEvent {
  id: string; personId: string; type: 'joiner' | 'mover' | 'leaver';
  effectiveDate: string; createdBy: string; detail?: string;
  accessTasks: { id: string; system: string; action: 'grant' | 'revoke'; status: 'pending' | 'done'; doneBy?: string; doneAt?: string }[];
}

// Implementado (D-120): items guarda id, personId, reviewerId, via (manager | hr | it), kind (access | role), access, decision, reason, decidedAt, revokedAt, revokedBy y approvalId; la campaña suma createdBy, createdAt, closedAt y closedBy, y scope usa areaId.
interface AccessReviewCampaign {
  id: string; name: string; scope: 'company' | { area: string };
  dueDate: string; status: 'open' | 'closed';
  items: { personId: string; reviewerId: string; access: string; decision?: 'keep' | 'revoke'; reason?: string; decidedAt?: string }[];
}

// Implementado (D-118, D-128): action es 'role.change' | 'policy.change' | 'pii.export' (exportación de personas con datos sin ocultar, de un solo uso: usedAt); targetId es la persona o el campo de la política; suma fromValue y toValue (políticas) y decisionNote.
interface ApprovalRequest {
  id: string; action: string; targetId: string; requestedBy: string; reason: string;
  createdAt: string; status: 'pending' | 'approved' | 'rejected'; decidedBy?: string; decidedAt?: string;
}

// Implementado (D-116): Person suma areaId y jobTitleId (catálogo) y conserva area y jobTitle como texto visible; ApprovalRequest suma fromRole y toRole.
interface Area { id: string; name: string }
interface JobTitle { id: string; name: string; areaId: string; suggestedTemplateId?: string; suggestedAccess: string[] }

// Implementado (D-129): dateFormat es 'dmy' | 'iso'; notifications usa las categorías de F7 (tasks, checkins, people, access); se guardan en data.preferences y, sin guardar, valen las de defecto.
interface UserPreferences {
  personId: string; language: 'es' | 'en'; timezone: string; dateFormat: string;
  notifications: Record<string, ('app' | 'email')[]>; reduceMotion: boolean; highContrast: boolean;
}
// Person suma: status ('active' | 'locked' | 'offboarded'), dni y cuil (ficticios, siempre enmascarados), areaId, jobTitleId, managerId.
// Implementado (D-113, D-135): Person.dni y cuil, ficticios (sin cuenta bancaria: la pide liquidación de sueldos); SecurityPolicy suma retentionJourneyYears, retentionSelfReviewYears y privacyNoticeVersion.
```

### Reglas de negocio
- `dueDate = startDate + offsetDays`.
- **Límites de las etapas** (día 0 = fecha de ingreso): Preingreso, antes del día 0; Semana 1, del día 0 al 6; Mes 1, del día 7 al 29; Días 30 a 90, del día 30 al 90.
- Una tarea está `blocked` si alguna de sus dependencias no está `done`.
- Una tarea está `overdue` si `dueDate < hoy` y no está `done`. El estado se calcula, no se guarda.
- Quien solicita una acción con doble aprobación nunca puede aprobarla.
- Sistemas nunca queda con menos de dos personas activas (`MIN_IT_ADMINS = 2`, D-121): un cambio de rol, una revocación o una baja que lo dejaría así no se aplica y queda auditado como `denied`. Se verifica al pedir y al aprobar.
- Publicar una plantilla nunca modifica los recorridos existentes.
- Toda acción sobre datos sensibles, permisos o accesos genera un `AuditEvent`.
- La **fecha de "hoy"** de la demo se fija en una constante: `DEMO_TODAY = '2026-11-10'`, para que los datos siempre se vean coherentes, sin importar cuándo se abra el portfolio.
- Las métricas del dashboard se calculan en `src/lib/metrics.ts` a partir de los datos, nunca se escriben a mano.

### Datos semilla
- 3 plantillas: Analista de Datos, Desarrollador/a Frontend, Ejecutivo/a Comercial (12 a 18 tareas cada una).
- 10 a 12 ingresos en distintos estados y con distintos niveles de avance, incluidos al menos 2 con atrasos, 1 con una tarea bloqueada y 1 check-in escalado.
- El nuevo ingreso del rol demo (Sofía) ingresó el **13/10/2026**: está en **Mes 1**, con avance parcial y el check-in de 30 días pendiente, con vencimiento el **12/11/2026**.
- Botón "Restablecer demo" (en el inicio de la demo y en el menú de usuario) que limpia `localStorage`, recarga los datos semilla y cierra la sesión.

- Auditoría semilla: 40 a 60 eventos de las últimas semanas, incluidos intentos fallidos, un bloqueo y un acceso denegado.
- Solicitudes de acceso semilla: 5 o 6 en distintos estados, con al menos una cuenta bloqueada pendiente.
- Fase B: 2 versiones publicadas de al menos una plantilla (con ingresos en cada versión), 7 a 11 notificaciones por persona, generadas a partir de los datos, sin inventar hechos (D-105), comentarios en 3 o 4 tareas, 1 inicio de sesión inusual pendiente para Sofía, 1 cambio de puesto y 1 baja en curso con tareas de accesos, 1 campaña de revisión abierta a mitad de avance (con Martín como uno de los revisores, para mostrar J4), 2 aprobaciones pendientes (una pedida por Carla que decide Diego y una pedida por Diego que espera a Ramiro) y 2 solicitudes de privacidad. Ramiro Sosa como segunda persona de sistemas, sin cuenta de demo (D-118). Valeria Ortiz, Gerenta de Personas, como jefa directa de Carla, sin cuenta de demo; en la campaña semilla, la revisión de Carla queda pendiente de Valeria (D-120).

---

## 8. Seguridad y privacidad

Al ser una app corporativa con datos personales de empleados, la seguridad es parte del diseño, no un agregado. Se trabaja en tres capas.

### 8.1 Simulado en la interfaz (para mostrar la experiencia)
Todo lo de F0, F6 y las funciones de seguridad de fase B (F10 a F14): SSO, MFA, bloqueo por intentos con derivación obligatoria a sistemas, solicitudes de acceso con verificación de identidad, expiración de sesión, sesiones activas, alertas de inicio inusual, consentimiento, enmascarado, ciclo de vida y revisión de accesos, doble aprobación, RBAC, auditoría y políticas. El objetivo es mostrar que la experiencia de seguridad está diseñada: mensajes claros, sin culpar al usuario, accesibles y sin fricción innecesaria.

### 8.2 Aplicado de verdad en el front-end
- Sin secretos, claves de API ni datos personales reales en el repositorio. Todos los datos son ficticios; los emails usan el dominio `.demo`.
- Todo input de usuario se valida con Zod antes de guardarse.
- Nunca usar `dangerouslySetInnerHTML` ni construir HTML con datos ingresados; React escapa el texto por defecto.
- Política de seguridad de contenido (CSP) mediante `<meta http-equiv="Content-Security-Policy">`, inyectada en el build por un plugin de Vite (en desarrollo Vite necesita scripts en línea), permitiendo solo recursos propios: `script-src 'self'` estricto y `style-src 'self' 'unsafe-inline'` porque Radix, Motion y Recharts aplican estilos en línea con valores calculados (D-95). La CI falla si el build sale sin la política. Las cabeceras que un `<meta>` no puede dar (`frame-ancestors`, HSTS) quedan en `docs/security.md`.
- Enlaces externos con `rel="noopener noreferrer"`.
- `npm audit` en el workflow de GitHub Actions; el deploy falla si hay vulnerabilidades altas o críticas.
- Dependencias mínimas y con versión fija (lockfile versionado).
- En `localStorage` solo se guardan datos de demo, nunca algo que simule una contraseña.

### 8.3 Arquitectura de producción (documentada en `docs/security.md`)
Crear `docs/security.md` explicando cómo se implementaría de verdad, para el case study:
- **Identidad:** SSO con OIDC o SAML contra el proveedor corporativo (Microsoft Entra ID, Google Workspace), MFA delegado al proveedor, aprovisionamiento automático de usuarios con SCIM. Las contraseñas y los bloqueos se gestionan en el proveedor de identidad por la mesa de ayuda de IT, siempre con verificación de identidad previa (la ingeniería social sobre la mesa de ayuda es un riesgo conocido); la plataforma no guarda contraseñas propias.
- **Sesión:** tokens de corta duración en cookies `HttpOnly`, `Secure` y `SameSite`, con renovación en el servidor; nunca tokens en `localStorage`.
- **Autorización:** RBAC verificado siempre en el servidor y, si se usa una base como Postgres, reglas de acceso por fila para que cada jefe vea solo a su equipo.
- **Datos:** cifrado en tránsito (TLS) y en reposo, separación por empresa cliente (multi-tenant), minimización de datos y plazos de retención.
- **Auditoría:** registro inmutable de eventos sensibles, con acceso restringido.
- **Ciclo de vida de identidades:** altas, cambios y bajas sincronizados con el sistema de RRHH y el proveedor de identidad, revocación automática en la fecha de baja y revisiones periódicas de accesos.
- **Detección:** alertas de inicio de sesión inusual basadas en el proveedor de identidad y monitoreo centralizado de eventos.
- **Cumplimiento:** Ley 25.326 de Protección de los Datos Personales (Argentina) y, para clientes internacionales, GDPR; referencia de controles a OWASP ASVS e ISO/IEC 27001.
- **Privacidad por diseño:** consentimiento informado del nuevo ingreso, acceso a sus propios datos y criterios explícitos sobre quién ve las autoevaluaciones.

---

## 9. Fuera del alcance del MVP y líneas futuras

No construir por ahora (quedan para iteraciones siguientes):
- Vistas de tareas de onboarding para Facilities y buddy.
- Encuesta de experiencia de onboarding.
- Biblioteca de cursos y microaprendizaje.
- Gamificación (insignias, logros).
- Integraciones reales (HRIS, Slack, Teams, envío real de emails).
- Autogestión de acceso (recuperar contraseña por email, desbloqueo automático): **por decisión de diseño**, no por alcance; en un entorno corporativo siempre pasa por sistemas.
- Autenticación y autorización reales (proveedor de identidad, tokens, verificación en servidor), backend o base de datos. Se simulan en la interfaz y se documentan en `docs/security.md`.

**Línea futura: vista de dirección.** Panel de solo lectura de toda la organización para la gerencia de Personas, sin permisos de edición (D-120).

**Línea futura: asistente conversacional.** Un chatbot que ayude al usuario dentro de la plataforma (por ejemplo, responder dudas del nuevo ingreso sobre su recorrido o guiar a RRHH en el armado de plantillas). **No construir ahora**: se define más adelante. Solo dejar previsto en el layout un lugar para un botón de ayuda flotante que hoy abre la ayuda contextual (F16).

El modelo de datos ya contempla `owner: 'it' | 'facilities' | 'buddy'` para que agregar esas vistas después no requiera cambiarlo.

---

## 10. Orden de trabajo sugerido

### Fase A: núcleo
0. **Documentación base (antes de programar):** crear la carpeta `docs/` según la sección 14 con los borradores de proto-personas, arquitectura de la información, requerimientos funcionales y no funcionales, casos de uso, roles y diagramas de flujo, derivados de este archivo. Lourdes los revisa antes del paso 1.
1. Setup: Vite + TS + Tailwind + shadcn/ui + router + react-i18next + deploy a GitHub Pages funcionando con una página vacía.
2. Tokens de Material 3 personalizados, componente `<Icon />`, `<BentoCard />`, tokens de elevación y animación, componentes base y página `/styleguide`, a partir de la sección 2 y de `/design-references/`. Configurar también el test de desbordes de Playwright.
3. Datos semilla, tipos, stores y funciones de cálculo (`dueDate`, estados, métricas) con tests unitarios simples.
4. Seguridad base: `permissions.ts`, store de sesión, auditoría, rutas protegidas, login con SSO y MFA simulados, bloqueo y "Problemas para iniciar sesión", expiración de sesión y layout con selector de rol (G0 a G7).
5. Nuevo ingreso: N1, N2.
6. Admin: plantillas A5, A6, A7.
7. Admin: ingresos A2, A3, A4.
8. Jefe: J1, J2, J3, y check-in del nuevo ingreso N3.
9. Admin: dashboard A1 con alertas.
10. Admin de sistemas: S1, S2 y S3.
11. Seguridad real del front (CSP, `npm audit` en CI) y redacción de `docs/security.md`.
12. Pulido de fase A: estados vacíos, accesibilidad, responsive, botón "Restablecer demo".
13. **Revisión intermedia:** generar `docs/review-fase-a.md` con el mismo formato del informe final (sección 13) antes de seguir.

### Fase B: base corporativa
14. Notificaciones (F7): motor de eventos, panel en el layout y G9.
15. Versionado de plantillas (F8): A8 y ajustes en A5, A6 y A4.
16. Comentarios en tareas (F9).
17. Privacidad (F10): G8, G10, A12, enmascarado y retención.
18. Sesiones y alertas de inicio inusual (F11).
19. Usuarios y catálogos (F15): A9, A10.
20. Ciclo de vida de accesos (F12): A11, S4.
21. Doble aprobación (F14): S7.
22. Revisión de accesos (F13): S5, S6, J4.
23. Búsqueda, ayuda contextual, recorridos guiados y exportación (F16): G12, A13.
24. Preferencias e inglés completo (F17): G11 y traducciones.
25. Pulido final, README e **informe final** (sección 13).

Después de cada paso, verificar que el build compila, que los tests pasan y que el deploy sigue funcionando.

---

## 11. Criterios de aceptación del MVP

- [ ] Desde el inicio de la demo se elige cualquiera de los 4 roles y, con "Continuar con Microsoft" o "Continuar con Google", se entra pasando por la simulación de SSO con la cuenta ficticia de la persona y MFA con el código precargado.
- [ ] El login no tiene tarjetas de roles, panel de marketing ni recuadros de rol preseleccionado; con un rol elegido, el correo llega precargado.
- [ ] Los botones de SSO usan los logos oficiales sin modificar, con los textos "Continuar con Microsoft" y "Continuar con Google" y la misma prominencia.
- [ ] La simulación de SSO es neutra, está rotulada como simulación y no imita las páginas de Microsoft ni de Google.
- [ ] Sin sesión no se puede ver ninguna pantalla interna, y cada rol solo accede a sus rutas; los intentos denegados quedan en la auditoría.
- [ ] Los errores de login son genéricos, y 5 intentos fallidos bloquean la cuenta sin opción de autodesbloqueo.
- [ ] Desde "Problemas para iniciar sesión" se genera una solicitud que aparece en la bandeja de sistemas, y al resolverla (desbloqueo o cambio forzado de contraseña) el usuario puede volver a entrar.
- [ ] Ninguna pantalla permite al usuario recuperar o desbloquear su acceso por su cuenta.
- [ ] La sesión avisa antes de vencer por inactividad y se cierra si no hay respuesta.
- [ ] Todos los permisos salen de `permissions.ts`, y la matriz de S3 coincide con lo que cada rol puede hacer.
- [ ] Hay CSP configurada, `npm audit` corre en CI y el repositorio no contiene secretos ni datos reales.
- [ ] `docs/security.md` explica la arquitectura de producción.
- [ ] Se puede recorrer el producto completo cambiando entre los 4 roles sin recargar.
- [ ] Una plantilla nueva creada por el admin se puede asignar a un ingreso nuevo y ese recorrido aparece con fechas correctas.
- [ ] Reordenar tareas y definir dependencias funciona, y las dependencias circulares se bloquean con un mensaje claro.
- [ ] Completar una tarea desbloquea las que dependen de ella.
- [ ] Un check-in con un hito "no cumplido" escalado genera una alerta visible en el dashboard del admin.
- [ ] Los KPIs del dashboard cambian cuando cambian los datos.
- [ ] Los cambios persisten al recargar y se pueden restablecer.
- [ ] Todos los textos de la interfaz están en español latinoamericano neutro con tuteo y usan el vocabulario fijo de la sección 2.9.
- [ ] Todos los campos de formulario tienen etiqueta visible y texto de ayuda debajo con el formato y un ejemplo; ningún placeholder reemplaza una etiqueta o una instrucción.
- [ ] Los errores no aparecen mientras se escribe por primera vez, desaparecen al corregirse, nunca borran lo cargado y hay un error de servidor simulado con "Reintentar".
- [ ] axe no reporta errores, cada flujo principal se completa solo con teclado y el constructor tiene alternativa al arrastre.
- [ ] Tipografía, colores y botones usan solo los roles de 2.1.1 a 2.1.3; hay un solo botón filled por región y ningún tamaño de texto suelto.
- [ ] `docs/flows.md` tiene task flows, user flows y wireflows rotulados como tales.
- [ ] La documentación de la sección 14 está completa, coherente con lo construido y con diagramas Mermaid que se ven en GitHub.
- [ ] Contraste AA, foco visible y navegación por teclado en formularios y en el constructor.
- [ ] Ninguna pantalla tiene desborde horizontal ni contenido cortado en 320, 375, 768, 1024, 1280 y 1440 px (test de Playwright en verde y capturas en `docs/screenshots/`).
- [ ] Los dashboards usan la grilla bento y se reacomodan correctamente en cada ancho.
- [ ] Todos los íconos son Material Symbols a través del componente `<Icon />`, con el estilo definido en 2.3.
- [ ] No hay sombras en tarjetas en reposo ni fondos con degradé; solo se usan los dos tokens de elevación.
- [ ] Las animaciones de 2.6 funcionan y se desactivan con "reducir animaciones" o `prefers-reduced-motion`.
- [ ] Deploy público en GitHub Pages funcionando, con README que explica el proyecto, los roles y cómo correrlo localmente.

**Fase B**
- [ ] Las notificaciones llegan al rol correcto, llevan a la acción y respetan las preferencias.
- [ ] Publicar una versión nueva de una plantilla no cambia los recorridos en curso, y se pueden comparar y restaurar versiones.
- [ ] Los comentarios con `@` notifican a la persona mencionada.
- [ ] Ningún usuario usa la plataforma sin haber aceptado el aviso de privacidad, y las solicitudes de datos personales tienen plazo y estado.
- [ ] El DNI y el CUIL aparecen siempre enmascarados, también en exportaciones; revelarlos pide motivo y queda auditado.
- [ ] Se pueden ver y cerrar sesiones activas, y "No fui yo" genera una solicitud urgente para sistemas.
- [ ] Un alta, un cambio de puesto y una baja generan sus tareas de accesos, y la baja deshabilita la cuenta en la fecha efectiva.
- [ ] Una campaña de revisión de accesos se puede crear, completar por los jefes y cerrar con resumen.
- [ ] Quien pide una acción con doble aprobación no puede aprobarla.
- [ ] La búsqueda global solo muestra lo que el rol puede ver.
- [ ] Toda la interfaz está disponible en español e inglés.

---

## 12. Cómo trabajar y registrar dudas

- **Idioma de trabajo:** respondé siempre en **español** (informes, resúmenes, preguntas, decisiones y documentación en `docs/`), aunque el código, los nombres de variables y los commits vayan en inglés.
- **No resolver dudas en silencio.** Si algo de este documento es ambiguo, contradictorio o no se puede hacer como está escrito, elegí la opción más razonable, seguí trabajando y anotalo en `docs/decisions.md` con: fecha, qué duda había, qué decidiste, por qué y si conviene que Lourdes lo confirme.
- Si una decisión cambia algo importante (alcance, modelo de datos, flujo de un rol), preguntá antes de avanzar.
- Mantené `docs/progress.md` actualizado al terminar cada paso de la sección 10: qué se hizo, qué quedó pendiente y problemas encontrados.
- Registrá cada error o problema encontrado en `docs/issues.md` (ver sección 14).
- Si un cambio de código altera un requerimiento, un flujo o un caso de uso, actualizá la documentación en el mismo paso.

---

## 13. Informe de revisión final

Cuando Lourdes pida la revisión (o al terminar la fase A y la fase B), revisá todo el proyecto contra este documento y generá `docs/review.md` (o `docs/review-fase-a.md` en la revisión intermedia) con esta estructura:

1. **Resumen:** estado general en 3 o 4 líneas y porcentaje aproximado de avance por fase.
2. **Qué se hizo:** tabla por función (F0 a F17) y por pantalla, con estado: completo, parcial o no iniciado, y una nota breve.
3. **Criterios de aceptación:** la lista de la sección 11 con cada ítem marcado como cumple, cumple parcialmente o no cumple, y la evidencia (dónde se ve o cómo se probó).
4. **Qué falta:** lo pendiente, ordenado por prioridad.
5. **Qué hay que ajustar:** resultados del test de desbordes por ancho, uso de sombras, íconos y animaciones contra la sección 2, además de errores conocidos, inconsistencias visuales con `/design-references/` o con las reglas de la sección 2 (por ejemplo, degradés en fondos), problemas de accesibilidad, de responsive o de rendimiento, código a refactorizar, textos sin traducir y textos que no cumplan la sección 2.9 (voseo, usted, regionalismos o términos fuera del vocabulario fijo).
6. **Seguridad:** verificación de la sección 8.2 (CSP, `npm audit`, ausencia de secretos y de datos reales, validaciones) y de que todos los permisos salen de `permissions.ts`.
7. **Dudas y decisiones tomadas:** lo registrado en `docs/decisions.md`, destacando lo que necesita confirmación de Lourdes.
8. **Documentación:** estado de cada documento de la sección 14 (completo, desactualizado o faltante) y coherencia entre requerimientos, casos de uso, flujos y lo construido. Requerimientos sin implementar o pantallas sin requerimiento asociado.
9. **Riesgos para la demo del portfolio:** cosas que un visitante podría encontrar rotas o confusas.
10. **Próximos pasos recomendados:** qué conviene hacer después, en orden.

Para la revisión, además de leer el código: correr el build y los tests, recorrer cada rol en el navegador y revisar accesibilidad (por ejemplo, con Lighthouse o axe). Ser honesto: si algo no se pudo verificar, decirlo.

---

## 14. Documentación del proyecto

Toda la documentación vive en `docs/`, en Markdown, con diagramas en **Mermaid** (GitHub los muestra como gráficos). Tiene que poder leerse sola, sin el código, porque se usa para el case study y para entrevistas técnicas. Crear `docs/README.md` como índice.

Cuando un documento se apoya en un estándar o un autor, citarlo en **formato APA 7** con una lista de referencias al final. Referencias base: WCAG 2.2 (W3C, 2023; ISO/IEC 40500:2025), ISO/IEC 25010:2023, Material Design 3 (Google), *Lean UX* (Gothelf y Seiden, 2021) para proto-personas e *Information Architecture* (Rosenfeld, Morville y Arango, 2015) para la arquitectura de la información.

### 14.1 Proto-personas (`docs/personas.md`)
- Son **proto-personas**, no personas: se basan en supuestos, sin investigación con usuarios todavía. Cada una lleva arriba el rótulo **"Proto-persona: hipótesis sin validar"** y la fecha.
- Una por rol (RRHH, jefe directo, nuevo ingreso, sistemas). Contenido: objetivo principal en el contexto del onboarding, tareas clave, frustraciones, cómo encara el proceso (su forma de pensar ante la tarea, no datos demográficos) y criterios de éxito.
- Sin fotos de personas reales ni datos demográficos innecesarios (edad, género, estado civil) que no cambien una decisión de diseño.
- **Tabla de supuestos** por proto-persona: supuesto, nivel de riesgo si es falso (alto, medio, bajo) y cómo validarlo.
- **Plan de validación:** entrevistas con personas de RRHH, líderes, ingresos recientes y sistemas, para convertirlas en personas cualitativas. Dejar una sección vacía "Resultados de la validación" para completar después.
- No inventar citas, entrevistas, porcentajes ni datos de investigación. Si algo es un supuesto, se dice.

### 14.2 Organización de roles (`docs/roles.md`)
- Diagrama Mermaid de los 4 roles y cómo se relacionan (quién asigna, aprueba, escala o deriva a quién).
- Matriz de permisos rol × acción, generada desde `src/lib/permissions.ts` (mantenerlas sincronizadas).
- Qué datos ve cada rol y cuáles no (mínimo privilegio).

### 14.3 Requerimientos (`docs/requirements.md`)
**Funcionales (RF):** tabla con ID (`RF-001`), descripción ("El sistema debe permitir..."), rol, función (F0 a F17), pantallas, prioridad, fase, criterio de aceptación y estado (pendiente, en curso, hecho).

**No funcionales (RNF):** organizados según las características de calidad de **ISO/IEC 25010:2023** (adecuación funcional, eficiencia de desempeño, compatibilidad, capacidad de interacción, fiabilidad, seguridad, mantenibilidad, flexibilidad y protección). Cada RNF con ID (`RNF-001`), descripción **medible** (por ejemplo: "Ninguna pantalla tiene desborde horizontal entre 375 y 1440 px", "Contraste mínimo 4,5:1 en texto"), prioridad, cómo se verifica y estado. Incluir los de accesibilidad, responsive, rendimiento, seguridad, privacidad, idioma y voz y tono.

**Prioridades:** MoSCoW (Must, Should, Could, Won't), coherente con las fases A y B. Explicar en una sección breve el criterio usado (matriz de decisión con valor para el usuario 40 %, demostración de habilidades 35 % y facilidad 25 %).

### 14.4 Casos de uso (`docs/use-cases.md`)
- Formato por caso: ID (`CU-01`), nombre en verbo + objeto, actor principal, actores secundarios, precondiciones, disparador, flujo principal numerado, flujos alternativos y de excepción, postcondiciones y RF relacionados.
- Casos mínimos: iniciar sesión con MFA; solicitar ayuda por cuenta bloqueada; resolver una solicitud de acceso; crear y publicar una plantilla; dar de alta un ingreso; completar una tarea con dependencias; hacer un check-in y escalar a RRHH; reportar un inicio de sesión inusual; registrar una baja y revocar accesos; completar una revisión de accesos; enviar y responder una solicitud de datos personales.
- Diagrama Mermaid general de actores y casos de uso.

### 14.5 Flujos y diagramas (`docs/flows.md`)
Distinguir los tres tipos de flujo, porque cada uno responde una pregunta distinta, y rotular cada diagrama con su tipo:
- **Task flow** (¿qué pasos sigue la persona para completar una tarea?): una sola línea, sin decisiones. Uno por cada tarea principal de cada rol.
- **User flow** (¿qué camino toma según lo que decide o lo que pasa?): con rombos de decisión y ramas. Para los procesos con alternativas: inicio de sesión y bloqueo, publicación de plantilla, check-in con escalamiento, solicitud de acceso, baja.
- **Wireflow** (¿qué ve en cada pantalla y qué toca para avanzar?): pantallas conectadas por flechas, armado con las capturas de `docs/screenshots/` una vez construidas, con la acción que lleva de una a otra. Al menos para el recorrido del nuevo ingreso, el login con MFA y la publicación de una plantilla.
- Error frecuente a evitar: dibujar un rombo de decisión y llamarlo task flow.

Además:
- **Mapa de pantallas por rol:** diagrama de flujo con todas las pantallas (IDs de la sección 6) y cómo se navega entre ellas.
- **Diagrama de funciones:** módulos F0 a F17 y sus dependencias (por ejemplo, F12 depende de F3 y F15).
- **Flujos de procesos clave:** inicio de sesión y bloqueo, ciclo de vida de una plantilla, recorrido de un ingreso, check-in y escalamiento, solicitud de acceso, baja de accesos.
- **Diagramas de estados** para: tarea, check-in, versión de plantilla, solicitud de acceso, solicitud de privacidad y campaña de revisión.
- Debajo de cada diagrama, una o dos oraciones que expliquen qué muestra.
- Los diagramas de flujo deben ser coherentes con la arquitectura de la información (14.6).

### 14.6 Arquitectura de la información (`docs/information-architecture.md`)
Desarrollar la arquitectura de la información del producto según sus cuatro sistemas clásicos (organización, rotulado, navegación y búsqueda; Rosenfeld, Morville y Arango, 2015):
- **Inventario de contenidos:** qué tipos de contenido y objetos existen (personas, plantillas, tareas, recorridos, check-ins, solicitudes, notificaciones, eventos de auditoría, etc.), sus atributos principales y quién los crea, edita y consulta.
- **Sistema de organización:** cómo se agrupa el contenido (por rol, por tarea, por etapa del recorrido, por estado) y por qué.
- **Sistema de rotulado:** nombres de secciones, menús, botones y estados, alineados con el vocabulario fijo de 2.9. Tabla de términos con su definición.
- **Sistema de navegación:** navegación global (sidebar por rol), local (pestañas dentro de una sección), contextual (enlaces desde alertas y notificaciones), migas de pan en pantallas de detalle y comportamiento en mobile.
- **Sistema de búsqueda:** qué se puede buscar, con qué filtros y cómo se muestran los resultados (F16), respetando permisos.
- **Mapa del sitio por rol:** diagrama Mermaid jerárquico de las secciones y pantallas que ve cada rol (complementa el mapa de flujos de 14.5, que muestra la navegación entre pantallas).
- **Plantillas de página:** estructura común de los tipos de pantalla (panel bento, listado con filtros, ficha de detalle, formulario, flujo por pasos) con sus zonas fijas.
- **Plan de validación:** card sorting abierto con usuarios para validar la organización y los rótulos, y test de árbol (tree testing) para validar la navegación. Dejar una sección para resultados.

### 14.7 Sistema de diseño (`docs/design-system.md`)
Documentar el sistema de diseño implementado, como referencia para el case study y para mantener la coherencia:
- Fundamentos: roles de color, superficies, tipografía, espaciado, radios, elevación tonal, íconos y animación (con los valores reales de los tokens).
- Componentes: botones (jerarquía de 2.1.3), campos de formulario con texto de ayuda (2.10), tarjetas bento, tablas, chips y píldoras de estado, navegación, modales, toasts; cada uno con su uso, variantes, estados y reglas de accesibilidad.
- Qué se tomó de Material 3, qué se personalizó y por qué.
- Debe coincidir con la página `/styleguide`.

### 14.8 Registro de incidencias (`docs/issues.md`)
- Tabla con ID (`INC-001`), fecha, descripción, severidad (crítica, alta, media, baja), pantalla o función afectada, cómo reproducirla, estado (abierta, en curso, resuelta, descartada), solución y commit.
- Registrar también los problemas que encuentre el test de desbordes, la revisión de accesibilidad y las pruebas manuales.
- Distinto de `docs/decisions.md`: incidencias son problemas; decisiones son elecciones ante dudas.

---

## 15. Indexación y difusión (D-76)

- La portada (G0) se puede indexar: `robots: index, follow`, `canonical`, título y descripción orientados a búsqueda, datos estructurados `WebApplication` con la autora, `robots.txt` y `sitemap.xml` con la portada (las demás pantallas viven después del `#` y no se indexan).
- Vista previa al compartir: Open Graph y Twitter con `og-image.png` de 1200 × 630 y texto alternativo. La imagen sale del componente `OgCard` (ruta `/og-card`, solo en desarrollo) y se regenera con `npm run og` cuando cambia la portada.
- Íconos: `favicon.svg` (la flecha del logo), `apple-touch-icon.png`, `icon-512.png` y `site.webmanifest`.
- Las URL de las etiquetas son absolutas (`https://lpedaci.github.io/rumbo-app/`).

## 16. README del repositorio

El README debe incluir: descripción del problema, roles, capturas de las pantallas principales, link a la demo, link al case study en el portfolio, enlace a `docs/README.md` (documentación), stack, cómo correrlo (`npm install`, `npm run dev`) y autoría: **Lourdes Pedaci, Experience Designer (Learning y UX/UI)**.
