<div align="center">

<img src="public/favicon.svg" alt="" width="64" height="64" />

# Rumbo

**Cada persona sabe qué hacer, con quién y para cuándo.**

Plataforma B2B de onboarding corporativo · Caso de diseño UX/UI y prototipo navegable de alta fidelidad

[**Ver la demo**](https://lpedaci.github.io/rumbo-app/) · [Case study](https://lpedaci.github.io/portfolio/) · [Documentación](docs/README.md) · [Sistema de diseño](https://lpedaci.github.io/rumbo-app/#/design-system)

![Deploy](https://img.shields.io/github/actions/workflow/status/lpedaci/rumbo-app/deploy.yml?branch=main&label=CI%20%C2%B7%20deploy&logo=githubactions&logoColor=white)
![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-1F6F78?logo=w3c&logoColor=white)
![Material Design 3](https://img.shields.io/badge/Material%20Design-3-1F6F78?logo=materialdesign&logoColor=white)
![Idiomas](https://img.shields.io/badge/idiomas-es%20%C2%B7%20en-9C3D74)
![Datos ficticios](https://img.shields.io/badge/datos-100%25%20ficticios-4A6366)

<img src="docs/readme/hero.jpg" alt="Portada de Rumbo: titular, tarjetas reales del producto con tareas a tiempo, alertas para RRHH, dónde se traban los recorridos y el avance de un recorrido" width="900" />

</div>

---

## El problema

En muchas empresas, el ingreso de una persona nueva depende de planillas, correos sueltos y de la memoria de quien la recibe. El resultado se repite:

- **La persona nueva** no sabe qué tiene que hacer primero, con quién hablar ni para cuándo.
- **El jefe directo** se entera tarde de que algo se trabó y llega al check-in sin datos.
- **RRHH** arma el mismo recorrido una y otra vez y no ve dónde se atrasan los ingresos.
- **Sistemas** recibe pedidos de acceso urgentes, sin contexto y sin forma segura de verificar quién los pide.

## La solución

Rumbo convierte el ingreso en un **recorrido por etapas** (preingreso, semana 1, mes 1, días 30 a 90) que RRHH diseña una vez por puesto y que se adapta a cada fecha de ingreso. Cada tarea tiene responsable, plazo y dependencias; el jefe acompaña con **check-ins 30/60/90**; y RRHH ve en un panel **dónde se traban los recorridos** para actuar a tiempo.

---

## Un recorrido para cada rol

La demo se recorre con cuatro personas ficticias de **Nortia S.A.** y se puede cambiar de rol en cualquier momento con el selector **Ver como**.

| | Rol | Qué hace | Pantallas principales |
| --- | --- | --- | --- |
| <img src="src/assets/avatars/carla.webp" alt="" width="48" /> | **Carla Méndez** · RRHH | Diseña plantillas por puesto, da de alta ingresos y sigue el avance y las alertas | Panel (A1), ingresos (A2 a A4), plantillas (A5 a A7) |
| <img src="src/assets/avatars/martin.webp" alt="" width="48" /> | **Martín Rossi** · Jefe directo | Acompaña a su equipo, hace los check-ins y escala a RRHH si un hito no se cumple | Mi equipo (J1), ficha (J2), check-in (J3) |
| <img src="src/assets/avatars/sofia.webp" alt="" width="48" /> | **Sofía Ramírez** · Nuevo ingreso | Ve su recorrido, completa tareas y responde su autoevaluación | Mi recorrido (N1), tarea (N2), autoevaluación (N3) |
| <img src="src/assets/avatars/diego.webp" alt="" width="48" /> | **Diego Ferreyra** · Sistemas | Atiende solicitudes de acceso verificando la identidad, revisa la auditoría y las políticas | Solicitudes (S1, S2), seguridad y auditoría (S3) |


---

## Proceso de diseño

![Lean UX](https://img.shields.io/badge/Lean%20UX-proto--personas-9C3D74)
![Arquitectura de la información](https://img.shields.io/badge/Arquitectura%20de%20la%20informaci%C3%B3n-Rosenfeld%20%26%20Morville-9C3D74)
![MoSCoW](https://img.shields.io/badge/priorizaci%C3%B3n-MoSCoW-9C3D74)
![ISO/IEC 25010](https://img.shields.io/badge/requerimientos-ISO%2FIEC%2025010-9C3D74)
![Diseño instruccional](https://img.shields.io/badge/dise%C3%B1o-instruccional-9C3D74)

1. **Proto-personas** por rol, rotuladas como hipótesis sin validar, con su tabla de supuestos y un plan de validación ([personas](docs/personas.md)).
2. **Arquitectura de la información** con sus cuatro sistemas (organización, rotulado, navegación y búsqueda) y el mapa del sitio por rol ([IA](docs/information-architecture.md)).
3. **Requerimientos** funcionales y no funcionales medibles, priorizados con MoSCoW y una matriz de decisión ([requerimientos](docs/requirements.md)), y **casos de uso** ([casos de uso](docs/use-cases.md)).
4. **Task flows, user flows y wireflows**, cada uno rotulado por tipo, y diagramas de estados ([flujos](docs/flows.md)).
5. **Auditoría visual** contra las referencias y un piloto rediseñado antes de escalar el estilo ([auditoría](docs/visual-audit.md)).
6. **Iteración con registro**: cada decisión de diseño queda en [`docs/decisions.md`](docs/decisions.md) con la duda, lo decidido y por qué; cada problema, en [`docs/issues.md`](docs/issues.md).

El recorrido aplica **diseño instruccional** a un proceso de negocio: etapas con objetivos claros, tareas encadenadas por dependencias, hitos evaluables en los check-ins y retroalimentación visible del avance.

---

## Sistema de diseño

![Material Design 3](https://img.shields.io/badge/base-Material%20Design%203-1F6F78?logo=materialdesign&logoColor=white)
![Material Symbols](https://img.shields.io/badge/%C3%ADconos-Material%20Symbols-1F6F78?logo=google&logoColor=white)
![Inter](https://img.shields.io/badge/tipograf%C3%ADa-Inter-1F6F78)
![shadcn/ui](https://img.shields.io/badge/componentes-shadcn%2Fui%20%2B%20Radix-1F6F78?logo=shadcnui&logoColor=white)

Material Design 3 traducido a tokens propios: no se ve como una app de Google, pero hereda su rigor.

- **Color por roles de M3:** petróleo (`primary`), petróleo apagado (`secondary`) y ciruela como complementario (`tertiary`), más colores de estado y un color por rol de persona. Contraste AA verificado por test.
- **Tipografía:** Inter con la escala de M3 y los títulos enfatizados de M3 Expressive; cifras tabulares en KPIs, tablas y fechas.
- **Jerarquía por elevación tonal**, no por sombras; sin degradés; una sola forma de esquinas suaves en botones, pestañas y chips.
- **Bento** para paneles, **línea de tiempo** del recorrido, **encabezado de ficha** único, tablas que se seleccionan por fila completa y pie de formulario anclado.
- **Movimiento** con las curvas de M3, 150 a 300 ms, escalonado al entrar y siempre respetando "reducir animaciones".

<img src="docs/readme/token-tiers.png" alt="Niveles de tokens: 1 Referencia (valores crudos, tipografía), 2 Sistema (roles de color, personas y gráficos, espacio y elevación, movimiento), 3 Tema de Tailwind (@theme inline y utilidades) y 4 Componentes (variantes con cva y pantallas), con el control de calidad debajo (test de contraste y documentación viva)." width="900" />

**[Ver el sitio del sistema de diseño](https://lpedaci.github.io/rumbo-app/#/design-system):** fundamentos leídos en vivo desde los tokens, contraste calculado, componentes reales, patrones y pautas. También está la versión en Markdown, [`docs/design-system.md`](docs/design-system.md).

---

## Accesibilidad

![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-1F6F78?logo=w3c&logoColor=white)
![axe](https://img.shields.io/badge/axe--core-sin%20violaciones-2E7D32?logo=deque&logoColor=white)
![320 px](https://img.shields.io/badge/reflow-320%20px%20%C2%B7%20zoom%20200%25-2E7D32)

Integrada desde el diseño, no como revisión al final:

- Etiqueta visible y **texto de ayuda con formato y ejemplo** en cada campo; errores que no aparecen mientras se escribe, desaparecen al corregir y nunca borran lo cargado.
- Navegación completa con teclado, foco siempre visible y nunca tapado, enlace "Saltar al contenido" y modales con foco atrapado.
- **Arrastrar y soltar con alternativa** (subir, bajar, mover a etapa) en el constructor de plantillas.
- Gráficos con título, resumen en texto y tabla para lectores de pantalla; estados siempre con ícono y texto, nunca solo color.
- Código de verificación en un solo campo que acepta pegar (WCAG 3.3.8) y aviso de sesión por vencer con opción de extenderla (2.2.1).

---

## Seguridad en tres capas

1. **Simulada en la interfaz:** SSO, MFA, bloqueo por intentos, derivación obligatoria a sistemas con **verificación de identidad**, expiración de sesión, permisos por rol y auditoría.
2. **Aplicada de verdad:** Content Security Policy en el sitio publicado, validación de formularios con esquemas de Zod, sin HTML construido con datos, `npm audit` en CI y dependencias con versión fija.
3. **Arquitectura de producción:** OIDC/SAML con Entra ID o Google Workspace, SCIM, sesiones con cookies `HttpOnly`, autorización en el servidor y por fila, auditoría inmutable, Ley 25.326 y GDPR.

Detalle completo, amenazas y mitigaciones en [`docs/security.md`](docs/security.md).

---

## Cómo está armado

![React](https://img.shields.io/badge/React-18-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix%20UI-161618?logo=radixui&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-estado-433E38)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990?logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-gr%C3%A1ficos-22B5BF)
![dnd kit](https://img.shields.io/badge/dnd--kit-arrastrar%20y%20soltar-4A6366)
![Motion](https://img.shields.io/badge/Motion-animaci%C3%B3n-0055FF?logo=framer&logoColor=white)
![i18next](https://img.shields.io/badge/i18next-es%20%C2%B7%20en-26A69A?logo=i18next&logoColor=white)
![date-fns](https://img.shields.io/badge/date--fns-770C56)

Es un **prototipo funcional sin backend**: las pantallas responden de verdad (crear, editar, completar, aprobar) y los cambios se guardan en el navegador.

La arquitectura se explica con el **modelo C4** (Brown, s.f.), en dos niveles.

**Nivel 1 · Contexto:** quiénes usan Rumbo y con qué sistemas se relaciona.

```mermaid
flowchart TB
    hr(["👤 RRHH<br/><small>Diseña plantillas, da de alta<br/>ingresos y sigue el avance</small>"])
    mgr(["👤 Jefe directo<br/><small>Acompaña y hace<br/>los check-ins</small>"])
    hire(["👤 Nuevo ingreso<br/><small>Sigue su recorrido<br/>y completa tareas</small>"])
    it(["👤 Sistemas<br/><small>Verifica identidades y<br/>restablece accesos</small>"])

    rumbo["<b>Rumbo</b><br/><small>Aplicación web de una sola página<br/>que corre en el navegador</small>"]

    pages["GitHub Pages<br/><small>Hosting estático con CSP</small>"]
    ci["GitHub Actions<br/><small>Auditoría, lint, tests,<br/>build y deploy</small>"]
    idp["Proveedor de identidad<br/><small>Entra ID o Google Workspace<br/>(simulado en la demo)</small>"]

    hr & mgr & hire & it -->|usa| rumbo
    pages -->|sirve| rumbo
    ci -->|publica en| pages
    rumbo -.->|SSO y MFA en producción| idp

    classDef person fill:#D8EEF0,stroke:#1F6F78,color:#0B3B40
    classDef system fill:#1F6F78,stroke:#0B3B40,color:#FFFFFF
    classDef external fill:#EEF2F4,stroke:#7D8793,color:#111827
    class hr,mgr,hire,it person
    class rumbo system
    class pages,ci,idp external
```

*Las cuatro personas usan Rumbo desde el navegador; GitHub Actions lo verifica y lo publica en GitHub Pages. El proveedor de identidad está en línea punteada: en la demo se simula y en producción se integra por OIDC (ver [`docs/security.md`](docs/security.md)).*

**Nivel 2 y 3 · Contenedores y componentes:** cómo se organiza la aplicación por dentro, en capas.

<img src="docs/readme/app-layers.png" alt="Diagrama de capas: Presentación (pantallas por rol, sistema de diseño, router, i18n y Motion) lee y dispara acciones en Estado (datos de la demo, sesión simulada, preferencias), que carga y persiste en Datos (datos semilla y localStorage). Presentación y Estado consultan el Dominio: permisos, recorrido, métricas, accesos y auditoría, y validación." width="900" />

- **Una sola fuente de permisos:** rutas y botones consultan `can(user, acción)`; la matriz que ve sistemas en S3 se genera desde el mismo archivo.
- **Reglas de negocio puras y probadas:** fechas (`dueDate = ingreso + plazo`), estados calculados (bloqueada, vencida), métricas del panel y atribución de atrasos a quien bloquea.
- **Fecha fija de demo** (`10/11/2026`) para que los datos siempre se vean coherentes.
- **Sin textos en los componentes:** todo vive en `src/locales/` (español latinoamericano neutro con tuteo, e inglés).

```
src/
  app/          rutas, layout y enlaces
  components/   ui/ (botones, campos, tablas, KPIs, bento) y layout/ (barra, navegación, encabezados)
  features/     una carpeta por área: home, auth, journey, templates, hires, dashboard, team, checkins, it
  lib/          reglas puras: fechas, recorrido, métricas, permisos, accesos, validación
  store/        stores de Zustand (datos, sesión, interfaz)
  data/         datos semilla en JSON
  locales/      es.json y en.json
  styles/       tokens de Material 3 y utilidades
docs/           documentación del proyecto (ver docs/README.md)
e2e/            pruebas de desbordes y accesibilidad con Playwright
```

---

## Calidad

![Vitest](https://img.shields.io/badge/Vitest-242%20tests-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-279%20pruebas-2EAD33?logo=playwright&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?logo=githubactions&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deploy-222222?logo=githubpages&logoColor=white)

- **Tests unitarios y de componentes** (Vitest y Testing Library): reglas de negocio, permisos, contraste de tokens y flujos de cada rol.
- **Desbordes en 6 anchos** (320, 375, 768, 1024, 1280 y 1440 px) con capturas en [`docs/screenshots/`](docs/screenshots/) y **axe** en cada pantalla (Playwright).
- **CI en cada push:** auditoría de dependencias, lint, tests, build, control de la CSP y deploy a GitHub Pages.

---

## Correrlo localmente

Requiere Node.js 22 o superior.

```bash
npm install
npm run dev
```

| Comando | Para qué |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Chequeo de tipos y build de producción en `dist/` |
| `npm test` | Tests unitarios y de componentes |
| `npm run test:e2e` | Desbordes y accesibilidad en 6 anchos, con capturas |
| `npm run lint` | ESLint |

En la portada, elige un recorrido e inicia sesión con un clic; todo está precargado. Credenciales de demo, por si entras directo al login: `carla@nortia.demo`, `martin@nortia.demo`, `sofia@nortia.demo` o `diego@nortia.demo`, con la contraseña `Demo.2026!` y el código `246810`. **Restablecer demo** vuelve todo al estado inicial.

---

## Estado

- **Fase A (núcleo):** las 24 pantallas funcionan; en curso el pulido final y la revisión intermedia. Avance en [`docs/progress.md`](docs/progress.md).
- **Fase B (base corporativa):** notificaciones, versionado de plantillas, privacidad, sesiones, ciclo de vida y revisión de accesos, doble aprobación, búsqueda y preferencias.

---

## Créditos

- **Diseño y desarrollo:** Lourdes Pedaci, Experience Designer (Learning y UX/UI) · [LinkedIn](https://www.linkedin.com/in/lourdes-pedaci/) · [Portfolio](https://lpedaci.github.io/portfolio/)
- **Fotos de personas:** Magnific (antes Freepik), con licencia; detalle en [`src/assets/avatars/SOURCE.md`](src/assets/avatars/SOURCE.md).
- **Íconos:** Material Symbols (Google), Apache 2.0. **Tipografía:** Inter, SIL Open Font License.
- Nortia S.A., sus personas y sus datos son ficticios. Los logos de Microsoft y Google se usan solo en los botones de inicio de sesión simulados.

---

## Referencias

Brown, S. (s.f.). *The C4 model for visualising software architecture*. https://c4model.com/
