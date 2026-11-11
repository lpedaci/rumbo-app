# Seguridad y privacidad

Rumbo es un **prototipo de portfolio**: corre por completo en el navegador, sin backend, con datos ficticios de una empresa inventada (Nortia S.A.). Por eso la seguridad se trabaja en tres capas (CLAUDE.md, sección 8):

1. **Simulada en la interfaz:** la experiencia completa de seguridad de una app corporativa, para mostrar que está diseñada. No protege nada de verdad.
2. **Aplicada de verdad en el front-end:** buenas prácticas reales que sí rigen en el sitio publicado.
3. **Arquitectura de producción:** cómo se implementaría en un producto real. Es la base para el case study.

Última revisión: 11/11/2026 (paso 11, D-95).

---

## 1. Capa simulada: la experiencia de seguridad

Todo lo de esta sección ocurre en el cliente y se guarda en `localStorage`. Sirve para recorrer los flujos, no para proteger datos.

| Qué se simula | Dónde se ve | Cómo se comporta |
| --- | --- | --- |
| Inicio de sesión con SSO (Microsoft, Google) | G1, G2 | Pantalla neutra y rotulada como simulación; nunca imita la página real del proveedor, porque una copia funciona igual que una página de phishing |
| Correo y contraseña | G1 | Error genérico ("Correo o contraseña incorrectos") que no revela si el correo existe |
| Bloqueo por intentos | G1, S3 | 5 intentos fallidos bloquean la cuenta; no se desbloquea sola ni la desbloquea la persona |
| Verificación en dos pasos (MFA) | G3, G5 | Obligatoria para RRHH y sistemas; código en un solo campo que acepta pegar (WCAG 3.3.8) |
| Derivación a sistemas | G4, S1, S2 | Sin autogestión: la persona pide ayuda y sistemas **verifica la identidad** antes de restablecer el acceso |
| Verificación de identidad | S2 | Solo con datos de la ficha (celular registrado o jefe directo), nunca con los que trae la solicitud |
| Expiración por inactividad | Layout | Aviso en el minuto 13 con "Seguir conectado"; cierre en el 15 (WCAG 2.2.1) |
| Control de acceso por rol (RBAC) | Todas las rutas | Una sola matriz en `src/lib/permissions.ts`; rutas y botones consultan `can()`; el acceso denegado queda en la auditoría |
| Mínimo privilegio en los datos | A1, J1, J2 | El jefe ve solo a su equipo; el ánimo se muestra agregado y con 3 respuestas o más |
| Auditoría | S3 | Inicios y cierres de sesión, intentos, bloqueos, solicitudes, desbloqueos, cambios de contraseña, MFA, accesos denegados, altas, plantillas, check-ins escalados, exportaciones y restablecimiento de la demo |
| Políticas de la organización | S3 | MFA por rol, inactividad, intentos y requisitos de contraseña, en modo lectura |

---

## 2. Capa aplicada de verdad en el front-end

### 2.1 Política de seguridad de contenido (CSP)

El build publicado lleva esta política como `<meta http-equiv="Content-Security-Policy">`. La inyecta un plugin de Vite solo en producción (`vite.config.ts`), porque en desarrollo Vite necesita scripts en línea para la recarga en caliente.

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self' data:;
connect-src 'self';
manifest-src 'self';
worker-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

- **Ningún recurso externo:** la tipografía Inter está alojada en el proyecto (`@fontsource-variable/inter`), los íconos son SVG propios y los gráficos se dibujan en el cliente.
- **Scripts estrictos:** solo los del propio sitio. Sin `unsafe-inline` ni `unsafe-eval` en `script-src`, que es lo que frena un XSS.
- **Estilos en línea permitidos:** Radix (`react-remove-scroll`) y Motion insertan bloques `<style>` con valores calculados al abrir menús y diálogos, y Recharts mide las etiquetas con atributos `style`. Un hash no cubre valores que cambian, y un nonce fijo en un `<meta>` estático no protegería nada. Se verificó en el build (`vite preview`) que con esta política no hay violaciones al recorrer las pantallas ni al abrir menús y diálogos.
- **Limitación de GitHub Pages:** no permite enviar cabeceras HTTP, así que `frame-ancestors`, `X-Frame-Options` y HSTS no se pueden aplicar desde un `<meta>`. Quedan en la arquitectura de producción (sección 3.8).
- **Control en CI:** el workflow falla si `dist/index.html` sale sin la política.

### 2.2 Otras prácticas aplicadas

| Práctica | Cómo se cumple |
| --- | --- |
| Sin secretos ni datos reales | No hay claves de API ni tokens. Personas, empresa y correos (`.demo`) son ficticios. Las credenciales de demo (`Demo.2026!`, código `246810`) son públicas a propósito y se muestran en pantalla |
| Validación de entradas | Todo formulario valida con Zod antes de guardar (`src/lib/validation.ts`); máscaras de entrada para fechas, plazos, códigos y celulares |
| Sin HTML construido con datos | No se usa `dangerouslySetInnerHTML`; React escapa el texto. Los comentarios y notas se guardan como texto plano |
| Enlaces externos | `rel="noopener noreferrer"` en todos; `window.open` con `noopener,noreferrer` |
| Política de referrer | `strict-origin-when-cross-origin` en el build |
| Dependencias | Versiones fijas y `package-lock.json` versionado; `npm ci` en CI |
| Auditoría de dependencias | `npm audit --audit-level=high` en CI: el deploy falla con vulnerabilidades altas o críticas |
| Permisos del workflow | `contents: read` por defecto; `pages: write` e `id-token: write` solo en el job de deploy |
| Almacenamiento local | `localStorage` guarda solo datos de demo, la sesión simulada y preferencias de interfaz; nunca algo que simule una contraseña ni un token. Si los datos guardados no tienen la forma esperada, se reemplazan por los datos semilla |
| Datos enmascarados | El celular, el DNI, el CUIL y la cuenta bancaria (ficticios) se muestran enmascarados; RRHH puede mostrar uno escribiendo un motivo, que queda en la auditoría como `pii.reveal` (F10, D-113) |
| Aviso de privacidad | Nadie entra a la app sin aceptar la versión vigente del aviso (G8); la aceptación queda con fecha, versión y evento `privacy.consent` (F10, D-113) |

---

## 3. Arquitectura de producción

Cómo se construiría Rumbo como producto real, multiempresa, para clientes corporativos.

### 3.1 Identidad

- **Inicio de sesión federado** con OIDC (o SAML 2.0 para clientes que lo exijan) contra el proveedor de identidad de cada empresa cliente: Microsoft Entra ID o Google Workspace. Rumbo **no guarda contraseñas propias**.
- **MFA delegado al proveedor**, con acceso condicional (por ejemplo, exigir MFA resistente al phishing a los roles de RRHH y sistemas).
- **Aprovisionamiento con SCIM 2.0:** altas, cambios y bajas de personas llegan desde el proveedor; los grupos del proveedor se mapean a los roles de Rumbo.
- **Mesa de ayuda:** el bloqueo, el restablecimiento de contraseña y de MFA se hacen en el proveedor de identidad, por sistemas y siempre después de verificar la identidad con un canal registrado de antemano. La ingeniería social sobre la mesa de ayuda es una vía de ataque conocida, y por eso la verificación nunca usa datos que trae la propia solicitud.

```mermaid
sequenceDiagram
    autonumber
    participant U as Persona
    participant B as Navegador
    participant R as Rumbo (BFF)
    participant I as Proveedor de identidad
    U->>B: Abre Rumbo
    B->>R: GET /login
    R-->>B: Redirección OIDC (state, nonce, PKCE)
    B->>I: Autenticación y MFA del proveedor
    I-->>B: Código de autorización
    B->>R: Callback con el código
    R->>I: Canje del código por tokens (servidor a servidor)
    I-->>R: ID token y access token
    R-->>B: Cookie de sesión HttpOnly, Secure, SameSite
    B->>R: Pedidos a la API con la cookie
    R->>R: Autoriza por rol y por fila (equipo, empresa)
```

*Diagrama de secuencia del inicio de sesión en producción: los tokens nunca llegan al navegador; el navegador solo tiene una cookie de sesión que el servidor valida en cada pedido.*

### 3.2 Sesión

- Patrón **BFF** (*backend for frontend*): los tokens viven en el servidor; el navegador recibe una cookie de sesión `HttpOnly`, `Secure`, `SameSite=Lax` (o `Strict`), nunca un token en `localStorage`.
- Sesiones cortas con renovación en el servidor; cierre por inactividad de 15 minutos con aviso, como en el prototipo.
- Protección CSRF con `SameSite` más un token de sincronización en los pedidos que cambian datos.
- Cierre remoto de sesiones (F11) y revocación inmediata al dar de baja una cuenta.

### 3.3 Autorización

- **RBAC verificado siempre en el servidor**, con la misma matriz que hoy vive en `permissions.ts` (el front solo la usa para mostrar u ocultar).
- **Seguridad por fila** (por ejemplo, *row-level security* de PostgreSQL): cada empresa cliente ve solo sus datos y cada jefe, solo a su equipo. La autoevaluación la ven solo el jefe directo y RRHH.
- Acciones sensibles con **doble aprobación** (F14): quien pide un cambio de rol de administrador no puede aprobarlo.

### 3.4 Datos

- Cifrado en tránsito (TLS 1.2 o superior) y en reposo (claves gestionadas por un servicio de KMS).
- **Multiempresa con aislamiento lógico** por `tenant_id` en todas las tablas y en las políticas por fila; copias de seguridad cifradas y probadas.
- **Minimización:** solo los datos necesarios para el recorrido; los datos sensibles (DNI, CUIL, datos bancarios) enmascarados y revelados solo con permiso, motivo y registro en la auditoría (F10).
- **Retención:** datos del recorrido 2 años después de finalizado y autoevaluaciones 1 año; luego se anonimizan.

### 3.5 Auditoría

- Registro **solo de agregado** (*append-only*), con almacenamiento inmutable (por ejemplo, retención WORM) y acceso restringido a sistemas y a auditoría interna.
- Cada evento con actor, acción, recurso, resultado, fecha y hora en UTC, dirección IP y agente; sincronizado con un SIEM.

### 3.6 Ciclo de vida de identidades

- Altas, cambios de puesto y bajas sincronizados entre el sistema de RRHH (HRIS), el proveedor de identidad y Rumbo.
- Revocación automática en la fecha de baja y revisiones periódicas de accesos por jefe (F12, F13).

### 3.7 Detección y respuesta

- Alertas de inicio de sesión inusual tomadas del proveedor de identidad (ubicación, dispositivo, riesgo), con el flujo "¿Fuiste tú?" de F11.
- Monitoreo centralizado de eventos, límites de frecuencia en la API y en el inicio de sesión, y un procedimiento de respuesta a incidentes con plazos de notificación.

### 3.8 Cabeceras HTTP

Con un servidor propio o una CDN se enviarían como cabeceras:

| Cabecera | Valor propuesto |
| --- | --- |
| `Content-Security-Policy` | La de la sección 2.1 con un **nonce por respuesta** en `script-src` y `style-src` (sin `unsafe-inline`), más `frame-ancestors 'none'` y `report-to` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Desactivar cámara, micrófono, geolocalización y pagos |
| `Cross-Origin-Opener-Policy` | `same-origin` |

### 3.9 Cumplimiento

- **Argentina:** Ley 25.326 de Protección de los Datos Personales: consentimiento informado, derechos de acceso, rectificación y supresión (F10), y registro de las bases de datos.
- **Clientes internacionales:** GDPR, con acuerdos de tratamiento de datos con cada cliente y con los subencargados.
- **Controles de referencia:** OWASP ASVS (nivel 2) para la aplicación e ISO/IEC 27001 para el sistema de gestión de seguridad.

### 3.10 Privacidad por diseño

- Aviso de privacidad y consentimiento la primera vez que alguien entra (F10), con versión y fecha de aceptación.
- Cada persona puede ver los datos que la plataforma tiene sobre ella y pedir correcciones.
- Criterios explícitos sobre quién ve qué: la autoevaluación del ingreso, solo su jefe directo y RRHH; el ánimo en los paneles, siempre agregado.

---

## 4. Amenazas principales y mitigaciones

| Amenaza | Mitigación en producción | Estado en el prototipo |
| --- | --- | --- |
| Robo de credenciales por phishing | SSO con MFA resistente al phishing; Rumbo no tiene contraseñas propias | Simulado; la pantalla de SSO no imita al proveedor |
| Ingeniería social sobre la mesa de ayuda | Verificación con datos registrados de antemano; nunca con los que trae la solicitud | Implementado en S2 |
| Fuerza bruta | Bloqueo por intentos en el proveedor y límites de frecuencia | Simulado (5 intentos) |
| XSS | CSP estricta, React escapa el texto, sin HTML de usuario | CSP aplicada en el build; sin `dangerouslySetInnerHTML` |
| Robo de sesión | Cookies `HttpOnly`, `Secure`, `SameSite`; sesiones cortas | La sesión de demo no es una credencial real |
| Acceso a datos de otro equipo o empresa | Autorización en el servidor y por fila | `can()` y filtros por rol en el cliente |
| Escalada de privilegios | Doble aprobación y auditoría de cambios de rol | Fase B (F14) |
| Dependencias vulnerables | `npm audit` en CI, versiones fijas, actualizaciones periódicas | Aplicado |
| Clickjacking | `frame-ancestors 'none'` como cabecera | No aplicable en GitHub Pages; documentado |

---

## Referencias

European Parliament & Council of the European Union. (2016). *Regulation (EU) 2016/679 (General Data Protection Regulation)*. https://eur-lex.europa.eu/eli/reg/2016/679/oj

Hunt, P., Grizzle, K., Wahlstroem, E., & Mortimore, C. (2015). *System for Cross-domain Identity Management: Protocol* (RFC 7644). Internet Engineering Task Force. https://www.rfc-editor.org/rfc/rfc7644

International Organization for Standardization. (2022). *Information security, cybersecurity and privacy protection: Information security management systems: Requirements* (ISO/IEC 27001:2022).

Ley 25.326 de Protección de los Datos Personales. (2000). Boletín Oficial de la República Argentina. https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790

OpenID Foundation. (2014). *OpenID Connect Core 1.0*. https://openid.net/specs/openid-connect-core-1_0.html

OWASP Foundation. (2021). *Application Security Verification Standard 4.0.3*. https://owasp.org/www-project-application-security-verification-standard/

World Wide Web Consortium. (2023). *Content Security Policy Level 3*. https://www.w3.org/TR/CSP3/
