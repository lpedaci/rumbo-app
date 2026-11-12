# Informe de revisión final

> Paso 25 de CLAUDE.md, sección 10, con la estructura de la sección 13. Fecha: 12/11/2026. Revisó: Claude, contra CLAUDE.md completo.
> Se corrieron el chequeo de tipos, ESLint, los tests unitarios, el build, `npm audit`, las pruebas de Playwright (desbordes en 6 anchos, áreas táctiles y axe) y se recorrieron roles en el navegador. Lo que no se pudo verificar se dice en cada punto; la revisión intermedia está en [`review-fase-a.md`](review-fase-a.md).

## 1. Resumen

Las **dos fases están completas en funciones**: las 40 pantallas funcionan con datos de demo, los cuatro roles se recorren de punta a punta y se puede cambiar de rol en cualquier momento. La seguridad está en sus tres capas (simulada en la interfaz, aplicada en el front y documentada para producción) y la interfaz está completa en español e inglés.

Están en verde el build, **351 tests unitarios y de componentes**, **510 pruebas de Playwright** (desbordes en 6 anchos con capturas, áreas táctiles a 375 px y axe en cada pantalla) y el deploy de GitHub Pages (run 88, con F17). Lo que falta es **verificación manual**: Lighthouse en el deploy, Firefox, Safari y Edge, un recorrido completo solo con teclado por rol y la prueba con lector de pantalla.

| Fase | Avance aproximado | Comentario |
| --- | --- | --- |
| A · Núcleo (F0 a F6) | **99 %** | Funciones, documentación y verificación automática completas; quedan las pruebas manuales de la sección 4 |
| B · Base corporativa (F7 a F17) | **98 %** | Las 16 pantallas y todas las reglas; quedan las mismas pruebas manuales y la confirmación de D-105 |

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
| axe sin errores, flujos con teclado y alternativa al arrastre | Cumple parcialmente | axe en verde en las 51 vistas y alternativa al arrastre con test; falta un recorrido manual completo solo con teclado |
| Tipografía, colores y botones solo con los roles de 2.1.1 a 2.1.3 | Cumple parcialmente | Sin tamaños sueltos (salvo `OgCard`); un solo filled por región revisado en las pantallas principales, no en todas |
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
| DNI, CUIL y cuenta bancaria ocultos, también al exportar; revelar pide motivo y se audita | Cumple | Tests de `privacy.ts`, del revelado con motivo y auditado y de A13 |
| Ver y cerrar sesiones; "No fui yo" genera solicitud urgente | Cumple | Tests de F11 |
| Alta, cambio y baja generan tareas de accesos; la baja deshabilita la cuenta | Cumple | Tests de F12 |
| Campaña de revisión creada, completada por los jefes y cerrada con resumen | Cumple | Tests de F13 |
| Quien pide una acción con doble aprobación no puede aprobarla | Cumple | Tests de F14, incluido el mínimo de dos personas de sistemas |
| La búsqueda solo muestra lo que el rol puede ver | Cumple | Tests por rol de `search.ts` |
| Toda la interfaz en español e inglés | Cumple | Las mismas 2.509 claves en `es.json` y `en.json`, sin textos sin traducir; números y fechas según el idioma |

---

## 4. Qué falta (por prioridad)

1. **Lighthouse en el deploy** (RNF-004): medir G1, N1 y A1 en mobile. El bundle principal supera el aviso de 500 kB de Vite; si el puntaje queda bajo 85, dividir más el código por ruta.
2. **Prueba en Firefox, Safari y Edge** (RNF-008): todo lo automático corre en Chromium.
3. **Recorrido completo solo con teclado** de cada flujo principal (RNF-011).
4. **Prueba con NVDA o VoiceOver** en login, recorrido del nuevo ingreso y constructor (RNF-048, 2.10).
5. **Revisión de "un solo filled por región"** en todas las pantallas (RNF-054) y de "no pedir dos veces el mismo dato" por flujo (RNF-045).
6. **Confirmar D-105** (volumen de notificaciones semilla) y **D-53** (excepción del cambio de rol en el aviso de cambios sin guardar).
7. **Validar las proto-personas y la arquitectura de la información** con usuarios (planes en `personas.md` e `information-architecture.md`).

---

## 5. Qué hay que ajustar

- **Desbordes:** sin desbordes en ninguna de las 51 vistas en los 6 anchos (`e2e/overflow.spec.ts`), ni textos aplastados ni botones que crucen su tarjeta.
- **Áreas táctiles:** el test nuevo (`e2e/touch.spec.ts`) encontró la casilla de `Checkbox` (20 px útiles) y los logos de las pantallas de acceso y del sitio del sistema de diseño (38 y 32 px); quedaron corregidos (INC-025).
- **Formularios:** faltaba el resumen de errores con enlaces de 2.10 en A3 y A6, y el de J3 no tenía enlaces; ahora hay un `ErrorSummary` común (INC-024, D-130). S5, A11 y G11 validaban sin esquema; ahora usan Zod (INC-026).
- **Sombras, íconos y animaciones:** sin desvíos de la sección 2 (ver sección 3).
- **Voz y tono:** sin voseo, usted ni regionalismos detectados; un solo signo de exclamación, para celebrar una etapa.
- **Textos sin traducir:** ninguno en la interfaz. A propósito no se traducen los datos que escriben las personas ni los detalles guardados en la auditoría, porque son registros (D-129).
- **Rendimiento:** el build avisa que un chunk supera 500 kB; no se midió el efecto en la carga (ver sección 4).
- **Tests:** dos tests que montan la app completa pasaron el límite de 5 s una vez con todo en paralelo; el límite quedó en 15 s (INC-027).
- **Modo oscuro:** los roles están preparados en `tokens.css` sin contraste verificado; no se implementa, como pide 2.1 (RNF-035).

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

`docs/decisions.md` registra **130 decisiones** (D-01 a D-130). Casi todas están tomadas, confirmadas por Lourdes o incorporadas a la spec. Necesitan confirmación:

- **D-53:** el aviso de cambios sin guardar del editor de plantillas con `createHashRouter` y `useBlocker`, con la excepción del cambio de rol con "Ver como", que no se bloquea.
- **D-105:** el volumen de notificaciones semilla por rol: F7 pide 15 a 20 y la semilla tiene entre 7 y 11 por persona de demo, porque se generan desde los datos y llegar a 15 obligaría a inventar hechos.

Decisiones de este último tramo: D-129 (preferencias por persona, zona horaria solo de visualización, números según el idioma) y D-130 (resumen de errores, esquemas de Zod de fase B y áreas táctiles verificadas).

---

## 8. Documentación (sección 14)

| Documento | Estado | Nota |
| --- | --- | --- |
| `README.md` (raíz) | Completo | Problema, roles, 40 pantallas, capturas principales, stack, cómo correrlo, estado y autoría |
| `docs/README.md` | Completo | Índice |
| `personas.md` | Completo | Proto-personas rotuladas como hipótesis; resultados de validación pendientes |
| `roles.md` | Completo | Sincronizado con `permissions.ts` por test |
| `requirements.md` | Completo | 89 RF hechos y 8 Won't; 55 RNF: 47 hechos, 6 parciales y 2 pendientes, cada uno con su evidencia |
| `use-cases.md` | Completo | 14 casos con diagrama |
| `flows.md` | Completo | Task flows, user flows, wireflows y diagramas de estados rotulados |
| `information-architecture.md` | Completo | G11 sin el rótulo de fase B; resultados de card sorting y tree testing pendientes |
| `design-system.md` | Completo | Incluye `ErrorSummary`, casilla con área táctil, preferencias y alto contraste |
| `security.md` | Completo | Producción, separación de funciones y exportaciones |
| `issues.md` | Completo | 27 incidencias; solo INC-001 sigue abierta |
| `decisions.md` | Completo | Ver sección 7 |
| `progress.md` | Completo | Pasos 0 a 25 |
| `visual-audit.md` | Completo | Del piloto |

**Coherencia:** todos los RF tienen pantalla y todas las pantallas de la sección 6 tienen RF. No se encontraron requerimientos sin implementar fuera de los Won't de la sección 9.

---

## 9. Riesgos para la demo del portfolio

- **La sesión vence a los 15 minutos de inactividad**, como pide la spec: un visitante que deja la pestaña vuelve al login. El aviso lo explica y entrar de nuevo es un clic desde G0.
- **Los datos quedan en el navegador del visitante:** lo que cambia persiste hasta "Restablecer demo". Si alguien deja la demo en un estado raro, el botón está en G0 y en el menú de usuario.
- **El idioma elegido queda** al cerrar sesión, a propósito; el formato de fecha y el contraste vuelven a los de defecto.
- **Sin probar en Safari:** es el navegador más probable de quien mira el portfolio en un iPhone (ver sección 4).
- **Rótulos de atajo de demo** ("Ver como sistemas (demo)", "Resolver como Ramiro (demo)", "Resolver como Valeria (demo)"): están rotulados para que no se confundan con funciones del producto.

---

## 10. Próximos pasos recomendados

1. Medir con Lighthouse en el deploy y, si hace falta, dividir el bundle principal.
2. Probar los flujos críticos en Safari (iPhone), Firefox y Edge.
3. Recorrido manual con teclado y con lector de pantalla; registrar lo que aparezca en `issues.md`.
4. Confirmar D-53 y D-105.
5. Publicar el case study y apuntar `CASE_STUDY_URL` a su página.
6. Validar proto-personas e IA con usuarios y completar las secciones de resultados.
7. Líneas futuras de la sección 9: vista de dirección y asistente conversacional.
