# Revisión intermedia: fase A

> Paso 13 de CLAUDE.md, sección 10. Fecha: 11/11/2026. Revisó: Claude, contra CLAUDE.md completo.
> Se corrieron el build, los tests unitarios, las pruebas de Playwright (desbordes y axe) y se recorrieron los cuatro roles en el navegador. Lo que no se pudo verificar se dice en cada punto.

## 1. Resumen

La **fase A está completa en funciones**: las 24 pantallas del núcleo funcionan con datos de demo, los cuatro roles se recorren de punta a punta y la seguridad simulada, la real del front y la documentada están en su lugar. El build, 247 tests unitarios y 288 pruebas de Playwright pasan.

Lo que falta para cerrarla del todo es **verificación manual**: un recorrido completo solo con teclado, la prueba con lector de pantalla, Lighthouse en el deploy y la prueba en Safari y Firefox. En la documentación, los wireflows todavía no tienen sus capturas.

| Fase | Avance aproximado | Comentario |
| --- | --- | --- |
| A · Núcleo (F0 a F6) | **95 %** | Funciones completas; faltan las verificaciones manuales y los wireflows con capturas |
| B · Base corporativa (F7 a F17) | **10 %** | Solo piezas adelantadas: recorrido guiado de bienvenida (parte de F16), textos en inglés listos (F17), soporte de "reducir animaciones" en el código (F17) |

**Estado del deploy:** al cierre de esta revisión, GitHub tiene un incidente con Actions y Pages (11/11/2026, 20:48 UTC). El sitio publicado es el del run #58 (sitio del sistema de diseño). Los cambios del paso 12 están en `main` y se publican cuando GitHub reanude los runs.

---

## 2. Qué se hizo

### 2.1 Por función

| Función | Estado | Nota |
| --- | --- | --- |
| F0 · Autenticación y acceso | Completo | G0 a G7b: inicio de la demo, login con SSO y correo, simulación neutra, MFA, bloqueo, derivación a sistemas, sesión con aviso, RBAC con auditoría |
| F1 · Mi recorrido | Completo | N1 y N2: etapas, línea de tiempo, dependencias, lo próximo, contactos, cursos |
| F2 · Constructor de plantillas | Completo | A5 a A7: catálogo, editor con arrastre y alternativa por teclado, dependencias sin ciclos, vista previa |
| F3 · Alta de ingresos | Completo | A2 a A4: listado con filtros, alta con correo y legajo generados, ficha con recorrido y check-ins |
| F4 · Panel de seguimiento | Completo | A1: KPIs, avance por cohorte o persona, alertas, cuellos de botella atribuidos a quien bloquea |
| F5 · Check-ins 30/60/90 | Completo | J1 a J3 y N3: equipo, ficha, check-in con escalamiento y autoevaluación |
| F6 · Seguridad, accesos y auditoría | Completo | S1 a S3: bandeja, verificación de identidad, resolución, bloqueos, auditoría con CSV, permisos y políticas |
| F7 · Notificaciones | No iniciado | La campana del layout muestra un estado vacío |
| F8 · Versionado de plantillas | No iniciado | |
| F9 · Comentarios | No iniciado | |
| F10 · Privacidad | No iniciado | El celular del ingreso ya se muestra enmascarado |
| F11 · Sesiones y alertas | No iniciado | G5 muestra MFA y dispositivos recordados (fase A) |
| F12 · Ciclo de vida de accesos | No iniciado | |
| F13 · Revisión de accesos | No iniciado | |
| F14 · Doble aprobación | No iniciado | |
| F15 · Personas y catálogos | No iniciado | |
| F16 · Búsqueda, ayuda y exportación | Parcial | Recorrido guiado de bienvenida y exportación CSV de la auditoría; faltan búsqueda, ayuda contextual y vistas imprimibles |
| F17 · Preferencias | Parcial | Textos en inglés completos y cargados bajo demanda; "reducir animaciones" soportado; falta la pantalla G11 |

### 2.2 Por pantalla (fase A)

| Pantallas | Estado |
| --- | --- |
| G0 Inicio de la demo · G1 Login · G2 SSO · G3 MFA · G4 Problemas para iniciar sesión · G5 Mi seguridad · G6 Layout · G7 Acceso no permitido · G7b Error inesperado | Completo |
| A1 Panel · A2 Ingresos · A3 Alta · A4 Ficha · A5 Plantillas · A6 Editor · A7 Vista previa | Completo |
| J1 Mi equipo · J2 Ficha · J3 Check-in | Completo |
| N1 Mi recorrido · N2 Tarea · N3 Autoevaluación | Completo |
| S1 Solicitudes · S2 Detalle · S3 Seguridad y auditoría | Completo |
| Extra: sitio del sistema de diseño (`/#/design-system`) | Completo (D-98) |

---

## 3. Criterios de aceptación (sección 11, fase A)

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Desde G0 se elige un rol y se entra por SSO con la cuenta ficticia y MFA precargado | Cumple | Recorrido en el navegador; capturas `g2-sso-preselected`, `g3-verify` |
| El login no tiene tarjetas de roles; con rol elegido el correo llega precargado | Cumple | `g1-login-preselected`; test de login |
| Botones de SSO con logos oficiales, textos exactos y la misma prominencia | Cumple | Un solo componente `SsoButton` para los dos; logos en `src/assets/brands/` |
| La simulación de SSO es neutra y está rotulada | Cumple | G2 dice "Simulación"; no reproduce colores ni textos del proveedor |
| Sin sesión no se ve nada interno; cada rol solo sus rutas; denegados auditados | Cumple | `App.test.tsx` (rutas y acceso); evento `auth.access_denied` visible en S3 |
| Errores de login genéricos; 5 intentos bloquean sin autodesbloqueo | Cumple | `auth-service.test.ts` |
| La solicitud de G4 llega a sistemas y al resolverla la persona vuelve a entrar | Cumple | `It.test.tsx` (desbloqueo); `auth-service.test.ts` (cambio forzado y MFA restablecido) |
| Ninguna pantalla permite recuperar o desbloquear el acceso por cuenta propia | Cumple | Revisión de G1 a G4 |
| La sesión avisa antes de vencer y se cierra sin respuesta | Cumple | `SessionTimeout`; durante la revisión la sesión de demo venció por inactividad y volvió al login |
| Todos los permisos salen de `permissions.ts` y la matriz de S3 coincide | Cumple | S3 se genera de `PERMISSIONS`; test que sincroniza `docs/roles.md`; búsqueda sin comparaciones por nombre de rol |
| CSP, `npm audit` en CI y sin secretos ni datos reales | Cumple | CSP en el build y control en CI (D-95); RNF-022 a RNF-028 |
| `docs/security.md` explica la arquitectura de producción | Cumple | Tres capas, amenazas, diagrama y referencias |
| Se recorre el producto completo entre los 4 roles sin recargar | Cumple | "Ver como" en la barra superior |
| Una plantilla nueva se asigna a un ingreso con fechas correctas | Cumple | `lib/hires.test.ts` y `Hires.test.tsx` |
| Reordenar y dependencias funcionan; los ciclos se bloquean con mensaje | Cumple | `Templates.test.tsx`, `lib/templates.test.ts` |
| Completar una tarea desbloquea las que dependen de ella | Cumple | `Journey.test.tsx`, `lib/journey.test.ts` |
| Un hito no cumplido escalado genera alerta en el panel | Cumple | `Checkins.test.tsx` usa `alerts()` del panel |
| Los KPIs cambian cuando cambian los datos | Cumple | `Dashboard.test.tsx` |
| Los cambios persisten al recargar y se restablecen | Cumple | Persistencia de Zustand; versión de esquema; `resetDemo` con test |
| Textos en español neutro con tuteo y vocabulario fijo | Cumple | Test de voz y tono sobre `es.json` (sin voseo, "usted", guiones largos ni términos prohibidos) |
| Campos con etiqueta visible y texto de ayuda con formato y ejemplo | Cumple | `TextField` exige `helperText`; revisión de formularios |
| Errores sin aparecer mientras se escribe, que se quitan al corregir, sin borrar datos, y error de servidor con "Reintentar" | Cumple | Patrón de 2.10 en todos los formularios; G4 simula el error del servidor |
| axe sin errores, flujos con teclado, alternativa al arrastre | **Cumple parcialmente** | axe en verde en las 32 pantallas probadas a 375 y 1280 px; menú "Subir / Bajar / Mover a etapa" con test. **No se hizo** un recorrido completo solo con teclado de cada flujo |
| Solo roles de 2.1.1 a 2.1.3; un filled por región; sin tamaños sueltos | Cumple | Revisión de botones (D-91); única clase de tamaño suelta en `OgCard`, que solo genera la imagen para compartir |
| `docs/flows.md` con task flows, user flows y wireflows rotulados | **Cumple parcialmente** | Task y user flows completos; los wireflows están definidos como secuencias, **sin las capturas** que pide 14.5 |
| Documentación de la sección 14 completa y coherente, con Mermaid | **Cumple parcialmente** | Ver sección 8; faltan los wireflows con capturas |
| Contraste AA, foco visible y teclado en formularios y constructor | **Cumple parcialmente** | Contraste verificado por test; foco con anillo `primary` en todos los componentes; teclado probado en el constructor; **sin** prueba manual completa |
| Sin desborde horizontal en 320, 375, 768, 1024, 1280 y 1440 px | Cumple | 192 pruebas de Playwright en verde, capturas en `docs/screenshots/` |
| Paneles en bento que se reacomodan | Cumple | A1, N1, J1 y S1 en los 6 anchos |
| Íconos de Material Symbols vía `<Icon />` | Cumple | Búsqueda sin importaciones de íconos fuera del componente |
| Sin sombras en reposo ni degradés; solo dos tokens de elevación | Cumple | Búsqueda en el código; solo `shadow-elevation-1` y `-2` |
| Animaciones de 2.6 que se desactivan con "reducir animaciones" | Cumple | Reglas globales y `useShouldReduceMotion`; excepción documentada en D-99 |
| Deploy en GitHub Pages con README | Cumple | Deploy por GitHub Actions; README completo (D-98). Publicación del paso 12 demorada por el incidente de GitHub |

---

## 4. Qué falta (por prioridad)

1. **Wireflows con capturas** en `docs/flows.md` (login con MFA, recorrido del nuevo ingreso, publicación de una plantilla). Las capturas ya existen en `docs/screenshots/`.
2. **Prueba con lector de pantalla** (NVDA) en login, recorrido del nuevo ingreso y constructor (RNF-052), con los hallazgos en `issues.md`.
3. **Recorrido completo solo con teclado** de cada flujo principal (RNF-011).
4. **Lighthouse** en mobile para G1, N1 y A1 en el deploy (RNF-004), cuando GitHub Pages se normalice.
5. **Navegadores:** prueba de los flujos críticos en Firefox y Safari (RNF-008). Solo se probó en Chromium.
6. **Crédito de las fotos en el case study** (fuera de este repositorio) y confirmación de la licencia de las cinco fotos nuevas (D-93).
7. **Fase B**, en el orden de la sección 10.

---

## 5. Qué hay que ajustar

| Área | Resultado |
| --- | --- |
| Desbordes por ancho | 0 desbordes en 320, 375, 768, 1024, 1280 y 1440 px en las 32 rutas probadas |
| Sombras y degradés | Sin hallazgos |
| Íconos | Sin hallazgos |
| Animaciones | El plegado de la barra lateral y los puntos de la bienvenida animan el ancho (excepción aceptada en D-99) |
| Accesibilidad | axe sin violaciones; pendiente la prueba manual (sección 4) |
| Responsive | Sin hallazgos; tablas con versión en filas por debajo de 1024 px |
| Rendimiento | JS inicial 280 KB comprimido (RNF-005, cumple). Lo más pesado es el bloque base con React DOM, íconos, date-fns e i18next (135 KB) |
| Textos | Sin voseo, "usted", guiones largos ni términos prohibidos (test). Inglés completo pero sin selector de idioma (F17) |
| Código | `/styleguide` (solo desarrollo) tiene textos escritos en el componente; no llega al build. Las dependencias de desarrollo tienen 10 vulnerabilidades moderadas en `minimatch` (INC-001), sin impacto en el sitio publicado |
| Consistencia con las referencias | Sin hallazgos en la última pasada; los ajustes visuales de esta fase están en D-56 a D-99 |

---

## 6. Seguridad (sección 8.2)

| Control | Estado |
| --- | --- |
| Sin secretos ni datos reales; correos `.demo` | Cumple |
| Validación con Zod de todo input | Cumple (INC-018 resuelta en el paso 12) |
| Sin `dangerouslySetInnerHTML` | Cumple |
| CSP en el sitio publicado | Cumple, con estilos en línea permitidos y justificados (D-95) |
| Enlaces externos con `noopener noreferrer` | Cumple |
| `npm audit` en CI | Cumple (falla con altas o críticas) |
| Dependencias fijas y lockfile | Cumple |
| `localStorage` sin nada que simule una contraseña | Cumple |
| Permisos solo desde `permissions.ts` | Cumple |

---

## 7. Dudas y decisiones

Se registraron **99 decisiones** (`docs/decisions.md`). Las que necesitan algo de Lourdes:

| Decisión | Qué falta |
| --- | --- |
| D-93 | Confirmar la licencia de las cinco fotos nuevas (Lucía, Federico, Julieta, Tomás y Valentina) |
| D-92 | Agregar "Fotos de personas: Magnific" en el case study |
| D-53 | Confirmar el comportamiento del aviso de cambios sin guardar con `createHashRouter` (implementado) |
| D-95 | Validar el criterio de la CSP: scripts estrictos y estilos en línea permitidos |
| D-99 | Validar la excepción de animación de ancho en la barra lateral |

---

## 8. Documentación (sección 14)

| Documento | Estado | Nota |
| --- | --- | --- |
| `README.md` (raíz) | Completo | Actualizado en D-98 |
| `docs/README.md` | Completo | Índice con enlace al sitio del sistema de diseño |
| `personas.md` | Completo | Proto-personas rotuladas; la sección de resultados de validación queda vacía a propósito |
| `roles.md` | Completo | Matriz sincronizada con `permissions.ts` por test |
| `requirements.md` | Completo | Estados al día; quedan pendientes la fase B y las verificaciones manuales |
| `use-cases.md` | Completo | Casos mínimos de 14.4 |
| `flows.md` | Desactualizado en parte | Wireflows sin capturas |
| `information-architecture.md` | Completo | No incluye el sitio del sistema de diseño (es una página de documentación, no del producto) |
| `design-system.md` | Completo | Con su sitio navegable (D-98) |
| `security.md` | Completo | D-95 |
| `issues.md` | Completo | 19 incidencias; abiertas: INC-001 (dependencias de desarrollo) |
| `decisions.md` y `progress.md` | Completos | |

Coherencia: cada pantalla de la fase A tiene requerimientos asociados y cada requerimiento de la fase A está construido. No hay pantallas sin requerimiento, salvo el sitio del sistema de diseño, que es documentación.

---

## 9. Riesgos para la demo del portfolio

1. **Sesión que vence por inactividad:** quien deja la demo abierta 15 minutos vuelve al login. Es el comportamiento pedido (F0), pero puede sorprender; el aviso del minuto 13 lo explica.
2. **Datos guardados en el navegador:** si alguien modifica mucho la demo, otra visita desde el mismo navegador la verá así. "Restablecer demo" está en el pie y en el menú de usuario.
3. **Fase B visible en la interfaz:** la campana de notificaciones muestra un estado vacío. No hay pantallas "en construcción" en la fase A.
4. **Dependencia de GitHub Pages:** un incidente de GitHub demora la publicación, como el de hoy.
5. **Navegadores no probados:** Safari y Firefox no se probaron todavía.

---

## 10. Próximos pasos recomendados

1. Armar los wireflows con capturas en `docs/flows.md`.
2. Hacer las verificaciones manuales: teclado, NVDA y Lighthouse en el deploy, con los hallazgos en `issues.md`.
3. Probar en Firefox y Safari.
4. Cerrar las confirmaciones de la sección 7.
5. Empezar la fase B por F7 (notificaciones), que destraba la campana del layout y le da vida a varios flujos.
