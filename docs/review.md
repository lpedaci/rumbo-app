# Informe de revisión final

> Pasos 25 y 26 de CLAUDE.md, sección 10, con la estructura de la sección 13. Fecha: 12/11/2026. Revisó: Claude, contra CLAUDE.md completo.
> Se corrieron el chequeo de tipos, ESLint, los tests unitarios, el build, `npm audit`, Playwright en Chromium (desbordes en 6 anchos, áreas táctiles, axe, un botón principal por región y flujos con teclado), WebKit y Firefox (desbordes y teclado), Lighthouse contra el build de producción y una revisión de la consola del build y de la demo publicada. Lo que no se pudo verificar se dice en cada punto; la revisión intermedia está en [`review-fase-a.md`](review-fase-a.md).

## 1. Resumen

Las **dos fases están completas en funciones**: las 40 pantallas funcionan con datos de demo, los cuatro roles se recorren de punta a punta y se puede cambiar de rol en cualquier momento. La seguridad está en sus tres capas (simulada en la interfaz, aplicada en el front y documentada para producción) y la interfaz está completa en español e inglés.

Están en verde el build, **380 tests unitarios y de componentes**, **614 pruebas de Playwright en Chromium** (desbordes en 6 anchos con capturas, áreas táctiles a 375 px, axe, un botón principal por región, cuatro flujos solo con teclado, desplazamiento al cambiar de pantalla y estados de carga), **312 en WebKit y 312 en Firefox** (desbordes, teclado, desplazamiento y carga, WebKit en local y los dos en GitHub Actions), Lighthouse con **98 a 100 en rendimiento y 100 en accesibilidad, buenas prácticas y SEO** en G0, G1, N1 y A1, y el deploy de GitHub Pages. La prueba con NVDA queda a cargo de Lourdes.

| Fase | Avance aproximado | Comentario |
| --- | --- | --- |
| A · Núcleo (F0 a F6) | **100 %** | Funciones, documentación y verificación automática completas; solo queda la prueba con NVDA |
| B · Base corporativa (F7 a F17) | **100 %** | Las 16 pantallas y todas las reglas; D-53 y D-105 confirmadas |

---

## 2. Qué se hizo

### 2.1 Por función

| Función | Estado | Nota |
| --- | --- | --- |
| F0 · Autenticación y control de acceso | Completo | G0 a G7b: SSO simulado con la cuenta ficticia de cada persona, MFA con código precargado, bloqueo a los 5 intentos sin autodesbloqueo, "¿Problemas para iniciar sesión?" con solicitud a sistemas y error de servidor simulado, sesión de 15 minutos con aviso, RBAC desde `permissions.ts` y auditoría de accesos denegados |
| F1 · Mi recorrido | Completo | Línea de tiempo por etapa con "Hoy", "Lo próximo", tareas con dependencias y aviso de tarea bloqueada, cursos y contactos clave |
| F2 · Constructor de plantillas | Completo | Catálogo de tarjetas, editor con arrastrar y soltar y alternativa por teclado (subir, bajar, mover a etapa), dependencias sin ciclos ni plazos incoherentes, vista previa |
| F3 · Alta de ingresos | Completo | Formulario con resumen de errores, recorrido generado con fechas reales desde la versión publicada, listado con filtros y ficha |
| F4 · Panel de seguimiento | Completo | KPIs calculados en `metrics.ts`, avance por cohorte o por ingreso, atrasos por responsable atribuidos a quien bloquea, alertas que llevan a la ficha |
| F5 · Check-ins 30/60/90 | Completo | Autoevaluación del nuevo ingreso, check-in del jefe con hitos, reprogramar o escalar a RRHH (genera alerta) |
| F6 · Seguridad, accesos y auditoría | Completo | Bandeja con verificación de identidad, desbloqueo, cambio forzado de contraseña y restablecimiento de MFA; usuarios bloqueados, auditoría con filtros y CSV, matriz de permisos y políticas |
| F7 · Notificaciones | Completo | Campana con contador, panel y G9 con filtros, toasts de la sesión y vista previa del correo; respetan las preferencias de F17 |
| F8 · Versionado de plantillas | Completo | Borrador y publicada, nota obligatoria, resumen de cambios, historial, comparación y restauración; los recorridos en curso conservan su versión |
| F9 · Comentarios | Completo | Hilos en N2, J2 y A4 con menciones que notifican, edición y borrado marcados |
| F10 · Privacidad | Completo | Aviso y consentimiento con versión, Mi privacidad, solicitudes con plazos de la Ley 25.326, datos ocultos con revelado auditado y retención visible |
| F11 · Sesiones y alertas | Completo | Sesiones activas, cerrar una o todas las demás, "¿Fuiste tú?" con solicitud urgente a sistemas, cierre forzado por sistemas |
| F12 · Ciclo de vida de accesos | Completo | Alta, cambio de puesto y baja con sus tareas de accesos, baja que deshabilita la cuenta en la fecha efectiva |
| F13 · Revisión de accesos | Completo | Campañas con alcance, revisión por el jefe directo (Valeria para Carla), cuentas admin siempre incluidas, revocaciones de rol por doble aprobación, cierre con resumen |
| F14 · Doble aprobación | Completo | Cambios de rol admin, de políticas y exportación de datos sin ocultar; quien pide no aprueba; "Resolver como Ramiro (demo)"; mínimo dos personas de sistemas |
| F15 · Personas y catálogos | Completo | Listado con filtros, ficha con historial, áreas y puestos con plantilla y accesos sugeridos |
| F16 · Búsqueda, ayuda y exportación | Completo | Búsqueda con `Ctrl+K` y `/` filtrada por permisos, G12, ayuda por pantalla, bienvenidas por rol, reportes en CSV con datos ocultos e impresión de A1, A4 y S6 |
| F17 · Preferencias | Completo | Idioma, zona horaria, formato de fecha, avisos por tipo y accesibilidad, por persona; inglés completo |

### 2.2 Por pantalla

Las **40 pantallas** de la sección 6 están construidas: 24 de fase A (G0 a G7, A1 a A7, J1 a J3, N1 a N3, S1 a S3) y 16 de fase B (G8 a G12, A8 a A13, J4, S4 a S7), más G7b (error inesperado). Las 51 vistas de `e2e/pages.ts` (algunas pantallas en más de un estado) pasan el test de desbordes en los 6 anchos, el de áreas táctiles y axe. Además existen el sitio público del sistema de diseño (`/#/design-system`) y las páginas internas `/styleguide`, `/wireflows` y `/og-card`.

---

## 3. Criterios de aceptación (sección 11)

**Fase A**

| Criterio | Resultado | Evidencia |
| --- | --- | --- |
| Elegir cualquiera de los 4 roles y entrar por SSO simulado y MFA precargado | Cumple | Recorrido en el navegador con Martín y Carla; tests de `auth-service` y de G2 |
| Login sin tarjetas de roles ni panel de marketing; correo precargado con un rol | Cumple | G1 y `g1-login-preselected` en `docs/screenshots/` |
| Botones de SSO con logos oficiales, textos exactos y misma prominencia | Cumple | Un solo componente para los dos botones; logos en `src/assets/brands/` con su origen |
| Simulación de SSO neutra, rotulada y sin imitar a Microsoft o Google | Cumple | G2 en las capturas |
| Sin sesión no se ve nada interno; cada rol solo sus rutas; denegados auditados | Cumple | Tests de rutas protegidas y de G7; evento `access.denied` |
| Errores genéricos y bloqueo a los 5 intentos sin autodesbloqueo | Cumple | Tests de `auth-service` |
| Solicitud desde G4 que llega a sistemas y, resuelta, permite volver a entrar | Cumple | Test nuevo de G4 a S2 (RF-010) y tests de S2 |
| Ninguna pantalla permite recuperar o desbloquear el acceso por cuenta propia | Cumple | Revisión de G1 a G4; RF-W06 como decisión de diseño |
| Aviso antes de vencer la sesión y cierre si no hay respuesta | Cumple | Test de vencimiento en `auth-service` (`auth.session_expired`); en esta revisión la sesión venció por inactividad y volvió al login con el aviso |
| Permisos desde `permissions.ts` y matriz de S3 coincidente | Cumple | Test que compara `permissions.ts` con `docs/roles.md` y la matriz de S3 |
| CSP, `npm audit` en CI, sin secretos ni datos reales | Cumple | Ver sección 6 |
| `docs/security.md` con la arquitectura de producción | Cumple | Incluye separación de funciones y exportaciones |
| Recorrer el producto cambiando entre los 4 roles sin recargar | Cumple | "Ver como" probado en esta revisión |
| Plantilla nueva asignable a un ingreso con fechas correctas | Cumple | Tests de A3 y de `createHire` |
| Reordenar y dependencias; las circulares se bloquean con mensaje | Cumple | Tests del constructor y de `dependencies` |
| Completar una tarea desbloquea las que dependen de ella | Cumple | Tests de N2 y del store |
| Check-in escalado genera alerta en el panel | Cumple | Test de J3 y de A1 |
| Los KPIs cambian con los datos | Cumple | Tests de `metrics.ts` y de A1 |
| Los cambios persisten y se pueden restablecer | Cumple | Tests de persistencia y de `resetData` |
| Español neutro con tuteo y vocabulario fijo | Cumple | Revisión de `es.json` en esta revisión: sin voseo ni usted, sin términos a evitar; test de vocabulario |
| Etiqueta visible y texto de ayuda en todos los campos | Cumple | `helperText` obligatorio en los campos; axe |
| Errores al salir del campo, se van al corregir, no borran datos; error de servidor con "Reintentar" | Cumple | Tests de `TextField`; G4 con `error-servidor` |
| axe sin errores, flujos con teclado y alternativa al arrastre | Cumple | axe en verde en las 51 vistas; `e2e/keyboard.spec.ts` hace login con MFA, completa una tarea, usa Subir y Bajar del constructor y un check-in sin clics, en Chromium, WebKit y Firefox |
| Tipografía, colores y botones solo con los roles de 2.1.1 a 2.1.3 | Cumple | Sin tamaños sueltos (salvo `OgCard`); `e2e/filled-button.spec.ts` verifica un solo botón filled por región en todas las pantallas a 375 y 1280 px |
| `docs/flows.md` con task flows, user flows y wireflows rotulados | Cumple | Wireflows con capturas reales desde `/wireflows` |
| Documentación de la sección 14 completa con Mermaid | Cumple | Ver sección 8 |
| Contraste AA, foco visible y teclado en formularios y constructor | Cumple | Test de contraste de tokens; anillo de foco en todos los controles |
| Sin desborde a 320, 375, 768, 1024, 1280 y 1440 px | Cumple | `e2e/overflow.spec.ts` en verde y capturas en `docs/screenshots/` |
| Paneles en bento que se reacomodan | Cumple | Capturas de A1, J1, N1 y S1 en los 6 anchos |
| Íconos de Material Symbols a través de `<Icon />` | Cumple | Sin otras librerías de íconos en `src/` |
| Sin sombras en tarjetas ni degradés; solo dos tokens de elevación | Cumple | Sin clases `shadow-*` en los componentes; `--elevation-1` y `--elevation-2` solo en menús, popovers, diálogos y toasts; la máscara del hero no es un degradé de color (D-123) |
| Animaciones de 2.6 que se desactivan con reducir animaciones | Cumple | Test nuevo de `useShouldReduceMotion` y CSS global |
| Deploy en GitHub Pages y README | Cumple | Run 88 en verde; README actualizado en este paso |

**Fase B**

| Criterio | Resultado | Evidencia |
| --- | --- | --- |
| Notificaciones al rol correcto, que llevan a la acción y respetan las preferencias | Cumple | Tests de `notifications.ts` y de preferencias (F17) |
| Publicar no cambia los recorridos en curso; comparar y restaurar versiones | Cumple | Tests de A8 y de `templateVersion` |
| Los comentarios con `@` notifican | Cumple | Tests de comentarios |
| Nadie usa la plataforma sin aceptar el aviso; solicitudes con plazo y estado | Cumple | Tests de G8 y A12 |
| DNI y CUIL ocultos, también al exportar; revelar pide motivo y se audita | Cumple | Tests de `privacy.ts`, del revelado con motivo y auditado y de A13 |
| Ver y cerrar sesiones; "No fui yo" genera solicitud urgente | Cumple | Tests de F11 |
| Alta, cambio y baja generan tareas de accesos; la baja deshabilita la cuenta | Cumple | Tests de F12 |
| Campaña de revisión creada, completada por los jefes y cerrada con resumen | Cumple | Tests de F13 |
| Quien pide una acción con doble aprobación no puede aprobarla | Cumple | Tests de F14, incluido el mínimo de dos personas de sistemas |
| La búsqueda solo muestra lo que el rol puede ver | Cumple | Tests por rol de `search.ts` |
| Toda la interfaz en español e inglés | Cumple | Las mismas 2.509 claves en `es.json` y `en.json`, sin textos sin traducir; números y fechas según el idioma |

---

## 4. Qué falta (por prioridad)

1. **Prueba con NVDA** en login, recorrido del nuevo ingreso y constructor (RNF-052): la hace Lourdes; lo que aparezca va a `issues.md`.
2. **Validar las proto-personas y la arquitectura de la información** con usuarios (planes en `personas.md` e `information-architecture.md`).
3. **Modo oscuro:** los roles están preparados sin contraste verificado (RNF-035); no se implementa, como pide 2.1.

---

## 5. Qué hay que ajustar

- **Desbordes:** sin desbordes en ninguna de las 51 vistas en los 6 anchos (`e2e/overflow.spec.ts`), ni textos aplastados ni botones que crucen su tarjeta.
- **Áreas táctiles:** el test nuevo (`e2e/touch.spec.ts`) encontró la casilla de `Checkbox` (20 px útiles) y los logos de las pantallas de acceso y del sitio del sistema de diseño (38 y 32 px); quedaron corregidos (INC-025).
- **Formularios:** faltaba el resumen de errores con enlaces de 2.10 en A3 y A6, y el de J3 no tenía enlaces; ahora hay un `ErrorSummary` común (INC-024, D-130). S5, A11 y G11 validaban sin esquema; ahora usan Zod (INC-026).
- **Sombras, íconos y animaciones:** sin desvíos de la sección 2 (ver sección 3).
- **No pedir dos veces el mismo dato (WCAG 3.3.7):** el único caso era el correo del login, que había que volver a escribir en G4; ahora llega con el motivo si la cuenta se bloqueó (INC-034, D-132).
- **Imagen para compartir:** mostraba el hero anterior; ahora repite el hero actual y la URL lleva la versión (INC-035, D-133).
- **Voz y tono:** sin voseo, usted ni regionalismos detectados; un solo signo de exclamación, para celebrar una etapa.
- **Textos sin traducir:** ninguno en la interfaz. A propósito no se traducen los datos que escriben las personas ni los detalles guardados en la auditoría, porque son registros (D-129).
- **Rendimiento:** ningún fragmento supera 500 kB y Lighthouse queda en 98 o más (ver 5.1). Las pantallas muestran un esqueleto mientras llega su código (INC-030).
- **Tests:** dos tests que montan la app completa pasaron el límite de 5 s una vez con todo en paralelo; el límite quedó en 15 s (INC-027).
- **Modo oscuro:** los roles están preparados en `tokens.css` sin contraste verificado; no se implementa, como pide 2.1 (RNF-035).
- **Build de producción:** al dividir el paquete, A1 se rompía solo en el build (INC-028); se encontró antes de publicar con la revisión de consola del build, que ahora es un comando (`npm run check:console`). Zod intentaba `new Function` contra la CSP (INC-029).

### 5.1 Rendimiento: paquete y Lighthouse

**JavaScript que descarga cada pantalla en su primera carga** (build de producción, `npm run perf:js`; antes = commit `053e4a9`, después = este paso):

| Pantalla | Antes | Después | Mayor fragmento antes | Mayor fragmento después |
| --- | --- | --- | --- | --- |
| G0 inicio | 1.246 kB (373 kB gzip) | 1.170 kB (346 kB gzip) | 498 kB | 231 kB |
| G1 login | 1.241 kB (374 kB gzip) | 1.264 kB (377 kB gzip) | 498 kB | 231 kB |
| N1 mi recorrido | 1.230 kB (371 kB gzip) | 1.160 kB (346 kB gzip) | 498 kB | 231 kB |
| A1 panel | 1.598 kB (466 kB gzip) | 1.537 kB (444 kB gzip) | 498 kB | 382 kB |
| A6 constructor | 1.302 kB (394 kB gzip) | 1.326 kB (398 kB gzip) | 498 kB | 231 kB |

Las rutas ya eran diferidas; lo que cambió es que las librerías pesadas viven en fragmentos propios: Recharts (391 kB) solo se descarga en las pantallas con gráficos, dnd-kit solo en el constructor y Zod ya no está en la carga inicial. El fragmento más grande bajó de 498 kB a 231 kB, salvo A1, que necesita Recharts. G1 y A6 suben unos 24 kB porque ahora descargan Zod y dnd-kit como archivos aparte en lugar de compartidos; el total que se ahorra es modesto (4 a 7 % en G0, N1 y A1) y la ganancia principal es que cada pantalla trae solo lo que usa y el caché se reutiliza entre pantallas.

**Lighthouse 13.5** contra el build (`npm run perf:lighthouse`; N1 como Sofía y A1 como Carla, con la sesión iniciada por el flujo real). Resultados completos en [`perf/lighthouse-2026-11-12.json`](perf/lighthouse-2026-11-12.json):

| Pantalla | Dispositivo | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G0 | Celular | 98 | 100 | 100 | 100 | 2,1 s | 0 ms | 0 |
| G0 | Escritorio | 100 | 100 | 100 | 100 | 0,3 s | 0 ms | 0 |
| G1 | Celular | 99 | 100 | 100 | 100 | 1,8 s | 10 ms | 0 |
| G1 | Escritorio | 100 | 100 | 100 | 100 | 0,4 s | 0 ms | 0 |
| N1 | Celular | 100 | 100 | 100 | 100 | 1,4 s | 60 ms | 0 |
| N1 | Escritorio | 100 | 100 | 100 | 100 | 0,4 s | 0 ms | 0 |
| A1 | Celular | 98 | 100 | 100 | 100 | 2,2 s | 50 ms | 0 |
| A1 | Escritorio | 100 | 100 | 100 | 100 | 0,4 s | 0 ms | 0 |

Ninguna categoría quedó por debajo de 90. Antes de los ajustes, G1 y A1 tenían 96 en buenas prácticas: G1 por la violación de CSP de Zod (INC-029) y A1 porque la pantalla fallaba en el build (INC-028). Las sugerencias que siguen abiertas son menores (JavaScript sin usar estimado en 28 a 53 kB y avisos informativos sobre imágenes y bloqueo de render).

### 5.2 Navegadores

| Navegador | Motor | Desbordes en 6 anchos | Flujos con teclado y desplazamiento | Dónde corre |
| --- | --- | --- | --- | --- |
| Chrome | Chromium | 306 de 306 | 6 de 6 | Local, antes de cada revisión |
| Edge | Chromium | Cubierto por Chromium | Cubierto por Chromium | Edge usa el mismo motor que Chrome: no se prueba aparte |
| Safari | WebKit | 306 de 306 | 6 de 6 | Local y GitHub Actions (en verde en los dos) |
| Firefox | Gecko | 306 de 306 | 6 de 6 | GitHub Actions (INC-031) |

En WebKit, como en Safari sin la opción "Resaltar cada ítem con Tab", la tecla Tab no se detiene en los enlaces: se llega a ellos con Opción+Tab. Las acciones principales son botones, así que los flujos se completan con Tab; la tarea de Sofía se marca con el botón de su fila. En esta computadora Windows no deja ejecutar el Firefox de Playwright (no está firmado) y no se cambió esa política de seguridad: Firefox corre en GitHub Actions (`.github/workflows/browsers.yml`), aparte del deploy. La primera corrida en Firefox falló en el login con teclado por un error del test, no de la app (INC-032); con el ajuste, los dos navegadores quedaron en verde.

### 5.3 Deploy y consola de la demo publicada

- **Deploy:** "CI and deploy to GitHub Pages" en verde para los tres commits de este paso (`998f1bd`, `416b9c5` y `ea97694`). La demo publicada sirve el mismo build que se revisó en local (mismo archivo de entrada, `index-BvIV_TcU.js`).
- **Consola:** `npm run check:console` contra https://lpedaci.github.io/rumbo-app/ abre 12 pantallas (G0, G1, G4, el sitio del sistema de diseño y pantallas de los cuatro roles con la sesión iniciada por el flujo real). La primera corrida, justo después del deploy, tuvo un 503 momentáneo de GitHub Pages en un archivo (INC-033); las tres corridas siguientes salieron **sin errores ni advertencias**.

---

## 6. Seguridad (sección 8.2)

| Control | Estado | Evidencia |
| --- | --- | --- |
| Sin secretos ni datos reales | Cumple | Datos ficticios con dominio `.demo`; la contraseña de demo es un dato público de la demo, no se guarda en `localStorage` |
| Todo input validado con Zod | Cumple | Esquemas en `src/lib/validation.ts` para todos los formularios y para el guardado de preferencias (RNF-023) |
| Sin `dangerouslySetInnerHTML` ni HTML con datos | Cumple | Cero usos en `src/` |
| CSP en el build | Cumple | Plugin de Vite; la CI falla si el build sale sin la política (D-95) |
| Enlaces externos con `rel="noopener noreferrer"` | Cumple | Todos los `target="_blank"` lo llevan |
| `npm audit` en CI | Cumple | `--omit=dev`: 0 vulnerabilidades. Con dependencias de desarrollo: 10 moderadas en `minimatch` vía ESLint (INC-001, no llegan al sitio) |
| Dependencias con versión fija | Cumple | Lockfile versionado |
| Permisos desde `permissions.ts` | Cumple | Rutas y botones consultan `can()`; la matriz de S3 y de `roles.md` se genera y se compara por test |

---

## 7. Dudas y decisiones

`docs/decisions.md` registra **143 decisiones** (D-01 a D-143). Casi todas están tomadas, confirmadas por Lourdes o incorporadas a la spec. Quedan dos para que Lourdes confirme: **D-137** (a quién se asignó cada retrato nuevo) y **D-141** (si se quiere un dominio propio para activar Cloudflare en la demo). **D-53** se ajustó a pedido de Lourdes ("Ver como" también pregunta, con guardar borrador, descartar o quedarse) y **D-105** quedó confirmada (7 a 11 notificaciones por persona, generadas a partir de los datos), con CLAUDE.md actualizado.

Decisiones de este último tramo: D-129 (preferencias por persona, zona horaria solo de visualización, números según el idioma), D-130 (resumen de errores, esquemas de Zod de fase B y áreas táctiles verificadas) D-131 (salida con cambios sin guardar, división del paquete, Lighthouse, navegadores, teclado y botón principal por región), D-132 (no pedir dos veces el mismo dato), D-133 (cifra de pantallas, imagen para compartir y numeración de patrones), D-134 (ajustes de mobile) D-135 (la plataforma no guarda la cuenta bancaria) D-136 (flujos por pasos de tamaño fijo) D-137 (diez retratos nuevos) D-138 (cada pantalla abre desde arriba) D-139 (README y pantallas de la portada capturadas desde la app) D-140 (estados de carga por plantilla de página) D-141 (capa de borde con Cloudflare en la arquitectura de producción) D-142 (cifras de atrasos por responsable confirmadas y fijadas por un test) y D-143 (enlace al case study publicado).

---

## 8. Documentación (sección 14)

| Documento | Estado | Nota |
| --- | --- | --- |
| `README.md` (raíz) | Completo | Problema, roles, 40 pantallas, capturas principales, stack, cómo correrlo, estado y autoría |
| `docs/README.md` | Completo | Índice |
| `personas.md` | Completo | Proto-personas rotuladas como hipótesis; resultados de validación pendientes |
| `roles.md` | Completo | Sincronizado con `permissions.ts` por test |
| `requirements.md` | Completo | 89 RF hechos y 8 Won't; 57 RNF: 54 hechos y 3 parciales, cada uno con su evidencia |
| `use-cases.md` | Completo | 14 casos con diagrama |
| `flows.md` | Completo | Task flows, user flows, wireflows y diagramas de estados rotulados |
| `information-architecture.md` | Completo | G11 sin el rótulo de fase B; resultados de card sorting y tree testing pendientes |
| `design-system.md` | Completo | Incluye `ErrorSummary`, casilla con área táctil, preferencias y alto contraste |
| `security.md` | Completo | Producción, separación de funciones y exportaciones |
| `issues.md` | Completo | 41 incidencias; solo INC-001 sigue abierta |
| `decisions.md` | Completo | Ver sección 7 |
| `progress.md` | Completo | Pasos 0 a 25 |
| `visual-audit.md` | Completo | Del piloto |

**Coherencia:** todos los RF tienen pantalla y todas las pantallas de la sección 6 tienen RF. No se encontraron requerimientos sin implementar fuera de los Won't de la sección 9.

---

## 9. Riesgos para la demo del portfolio

- **La sesión vence a los 15 minutos de inactividad**, como pide la spec: un visitante que deja la pestaña vuelve al login. El aviso lo explica y entrar de nuevo es un clic desde G0.
- **Los datos quedan en el navegador del visitante:** lo que cambia persiste hasta "Restablecer demo". Si alguien deja la demo en un estado raro, el botón está en G0 y en el menú de usuario.
- **El idioma elegido queda** al cerrar sesión, a propósito; el formato de fecha y el contraste vuelven a los de defecto.
- **Safari en iPhone:** WebKit pasa los desbordes y los flujos con teclado, pero no se probó en un iPhone real (tacto, barra del navegador que se oculta).
- **Rótulos de atajo de demo** ("Ver como sistemas (demo)", "Resolver como Ramiro (demo)", "Resolver como Valeria (demo)"): están rotulados para que no se confundan con funciones del producto.

---

## 10. Próximos pasos recomendados

1. Prueba con NVDA (Lourdes) y registrar lo que aparezca en `issues.md`.
2. Recorrer la demo publicada en un iPhone y en un Android reales.
3. Validar proto-personas e IA con usuarios y completar las secciones de resultados.
4. Líneas futuras de la sección 9: vista de dirección y asistente conversacional.
