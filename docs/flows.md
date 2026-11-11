# Flujos y diagramas

Todos los diagramas usan Mermaid. Los IDs de pantallas son los de la sección 6 de `CLAUDE.md`; las funciones, F0 a F17.

Cada diagrama está rotulado con su tipo, porque cada uno responde una pregunta distinta:

| Tipo | Pregunta que responde | Forma | Sección |
| --- | --- | --- | --- |
| Mapa de pantallas | ¿Cómo se navega entre pantallas? | Pantallas y enlaces | 1 |
| Diagrama de funciones | ¿Qué módulo depende de cuál? | Módulos y dependencias | 2 |
| **Task flow** | ¿Qué pasos sigue la persona para completar una tarea? | Una sola línea, sin decisiones | 3 |
| **User flow** | ¿Qué camino toma según lo que decide o lo que pasa? | Rombos de decisión y ramas | 4 |
| Flujo de proceso | ¿Cómo avanza un proceso en el tiempo? | Etapas | 5 |
| **Wireflow** | ¿Qué ve en cada pantalla y qué toca para avanzar? | Capturas conectadas por acciones | 6 |
| Diagrama de estados | ¿Por qué estados pasa un objeto? | Estados y transiciones | 7 |

Los rótulos de pantallas y acciones coinciden con la [arquitectura de la información](information-architecture.md).

## 1. Mapa de pantallas por rol

### 1.1 Acceso (común a todos los roles)

```mermaid
flowchart TD
    START(["Visitante sin sesión"]) --> G0["G0 Inicio de la demo"]
    G0 -- "Recorrer como (rol)" --> G1P["G1 Login con rol preseleccionado"]
    G1P -- "Continuar con Microsoft o Google" --> G2P["G2 Simulación con la cuenta ficticia de la persona"]
    G2P -- "Pasos tildados, sigue solo" --> G3
    START -. "entra directo a /login" .-> G1["G1 Login"]
    G1 -- "SSO" --> G2["G2 Simulación neutra de SSO"]
    G1 -- "Correo y contraseña" --> G3["G3 Verificación en dos pasos"]
    G2 -- "Continuar" --> G3
    G1 -- "¿Problemas para iniciar sesión?" --> G4["G4 Problemas para iniciar sesión"]
    G4 -- "Ver como sistemas (demo)" --> S2["S2 Detalle de solicitud"]
    G3 -- "Primer ingreso (fase B)" --> G8["G8 Aviso de privacidad"]
    G3 --> HOME{"Inicio según rol"}
    G8 --> HOME
    HOME --> A1["A1 Panel RRHH"]
    HOME --> J1["J1 Mi equipo"]
    HOME --> N1["N1 Mi recorrido"]
    HOME --> S1["S1 Solicitudes de acceso"]
    HOME -. "ruta de otro rol" .-> G7["G7 Acceso no permitido"]
```

Muestra el camino desde el inicio de la demo (G0) hasta el inicio de cada rol. Elegir un recorrido abre el login con ese rol preseleccionado; "Continuar con Microsoft" o "Continuar con Google" abre la simulación neutra con la cuenta ficticia de esa persona, que tilda sus pasos y sigue sola a MFA con el código precargado (D-66). El formulario de correo llega con su correo de trabajo precargado. Quien entra directo a `/login` ve el login limpio. Una ruta ajena al rol termina en G7.

### 1.2 Layout común (G6)

```mermaid
flowchart LR
    G6["G6 Layout: header, selector de rol, menú de usuario, navegación"]
    G6 --> G5["G5 Mi seguridad"]
    G6 --> SWITCH["Selector de rol: cierra sesión e inicia la del otro rol"]
    G6 --> LOGOUT["Cerrar sesión → G1"]
    G6 --> RESET["Restablecer demo → G1"]
    G6 -. "fase B" .-> G9["G9 Notificaciones"]
    G6 -. "fase B" .-> G10["G10 Mi privacidad"]
    G6 -. "fase B" .-> G11["G11 Preferencias"]
    G6 -. "fase B" .-> G12["G12 Búsqueda"]
```

El layout está presente en todas las pantallas internas. Las líneas punteadas son pantallas de fase B.

### 1.3 Admin RRHH

```mermaid
flowchart TD
    A1["A1 Panel de seguimiento"] -- "alerta" --> A4
    A1 --> A2["A2 Listado de ingresos"]
    A2 --> A3["A3 Alta de ingreso"]
    A3 -- "guardar" --> A4["A4 Ficha del ingreso"]
    A2 --> A4
    A1 --> A5["A5 Listado de plantillas"]
    A5 --> A6["A6 Editor de plantilla"]
    A6 --> A7["A7 Vista previa"]
    A6 -. "fase B" .-> A8["A8 Versiones"]
    A1 -. "fase B" .-> A9["A9 Personas y catálogos"]
    A9 -.-> A10["A10 Ficha de persona"]
    A1 -. "fase B" .-> A11["A11 Altas, cambios y bajas"]
    A1 -. "fase B" .-> A12["A12 Solicitudes de privacidad"]
    A1 -. "fase B" .-> A13["A13 Reportes"]
```

RRHH entra por el panel y desde ahí llega a ingresos y plantillas. Cada alerta lleva directo a la ficha del ingreso.

### 1.4 Jefe directo

```mermaid
flowchart TD
    J1["J1 Mi equipo en onboarding"] --> J2["J2 Detalle del ingreso"]
    J2 -- "Hacer check-in" --> J3["J3 Formulario de check-in"]
    J1 -- "Hacer check-in" --> J3
    J3 -- "enviar" --> J2
    J1 -. "fase B" .-> J4["J4 Revisión de accesos"]
```

El jefe puede ir al check-in desde la lista del equipo o desde el detalle; al enviarlo vuelve al detalle con el historial actualizado.

### 1.5 Nuevo ingreso

```mermaid
flowchart TD
    N1["N1 Mi recorrido"] -- "abrir tarea" --> N2["N2 Detalle de tarea o curso"]
    N2 -- "volver" --> N1
    N1 -- "Responder mi check-in" --> N3["N3 Mi check-in"]
    N3 -- "enviar" --> N1
```

Todo parte de N1: desde ahí se abre cada tarea y se responde la autoevaluación.

### 1.6 Admin de sistemas

```mermaid
flowchart TD
    S1["S1 Solicitudes de acceso"] --> S2["S2 Detalle de solicitud"]
    S2 -- "resolver" --> S1
    S1 --> S3["S3 Seguridad y auditoría"]
    S3 -. "fase B" .-> S4["S4 Tareas de accesos"]
    S3 -. "fase B" .-> S5["S5 Campañas de revisión"]
    S5 -.-> S6["S6 Detalle de campaña"]
    S3 -. "fase B" .-> S7["S7 Aprobaciones"]
```

Sistemas trabaja desde su bandeja; S3 reúne usuarios bloqueados, auditoría, permisos y políticas en pestañas.

## 2. Diagrama de funciones y dependencias

```mermaid
flowchart LR
    subgraph A["Fase A: núcleo"]
        F0["F0 Autenticación y RBAC"]
        F1["F1 Mi recorrido"]
        F2["F2 Plantillas"]
        F3["F3 Alta de ingresos"]
        F4["F4 Panel"]
        F5["F5 Check-ins"]
        F6["F6 Seguridad y auditoría"]
    end
    subgraph B["Fase B: base corporativa"]
        F7["F7 Notificaciones"]
        F8["F8 Versiones"]
        F9["F9 Comentarios"]
        F10["F10 Privacidad"]
        F11["F11 Sesiones"]
        F12["F12 Ciclo de vida"]
        F13["F13 Revisión de accesos"]
        F14["F14 Doble aprobación"]
        F15["F15 Usuarios y catálogos"]
        F16["F16 Búsqueda, ayuda, exportación"]
        F17["F17 Preferencias"]
    end
    F0 --> F6
    F2 --> F3
    F3 --> F1
    F3 --> F4
    F1 --> F4
    F5 --> F4
    F3 --> F5
    F2 --> F8
    F1 --> F9
    F0 --> F11
    F3 --> F12
    F15 --> F12
    F12 --> F13
    F15 --> F14
    F6 --> F14
    F17 --> F7
    F7 --> F9
    F7 --> F11
    F0 --> F16
```

Una flecha de X a Y significa que Y necesita a X. Todo depende de F0 (sesión y permisos); por eso F0 se construye primero. F12 necesita el alta de ingresos (F3) y el catálogo de puestos (F15).

## 3. Task flows

> **Tipo: task flow.** Responde *¿qué pasos sigue la persona para completar una tarea?* Una sola línea, sin decisiones: es el camino ideal. Las alternativas y los errores están en los user flows (sección 4) y en los casos de uso.

### 3.1 Común: entrar a la demo con un recorrido

```mermaid
flowchart LR
    T1["G0 Elegir 'Recorrer como Sofía'"] --> T2["G1 Continuar con Microsoft"] --> T3["G2 Simulación con la cuenta de Sofía, sigue sola"] --> T4["G3 Verificar el código precargado"] --> T5["N1 Ver Mi recorrido"]
```

El camino del visitante del portfolio: elegir el recorrido y confirmar tres veces, sin escribir nada.

### 3.2 Común: solicitar ayuda a sistemas

```mermaid
flowchart LR
    T1["G1 Elegir '¿Problemas para iniciar sesión?'"] --> T2["G4 Leer los canales de ayuda"] --> T3["G4 Completar correo, motivo y comentario"] --> T4["G4 Enviar solicitud"] --> T5["G4 Ver número de solicitud"]
```

La persona deja su pedido sin recuperar el acceso por su cuenta.

### 3.3 Nuevo ingreso: completar una tarea

```mermaid
flowchart LR
    T1["N1 Ver 'Lo próximo'"] --> T2["N1 Abrir la tarea"] --> T3["N2 Leer descripción y recurso"] --> T4["N2 Marcar como hecha"] --> T5["N1 Ver el progreso actualizado"]
```

La tarea más frecuente del nuevo ingreso.

### 3.4 Nuevo ingreso: responder la autoevaluación

```mermaid
flowchart LR
    T1["N1 Elegir 'Responder mi check-in'"] --> T2["N3 Elegir cómo se siente"] --> T3["N3 Escribir comentario"] --> T4["N3 Enviar autoevaluación"] --> T5["N1 Ver check-in respondido"]
```

### 3.5 Jefe directo: hacer un check-in

```mermaid
flowchart LR
    T1["J1 Ver el próximo check-in"] --> T2["J2 Leer la autoevaluación"] --> T3["J3 Evaluar cada hito"] --> T4["J3 Escribir comentarios y próximos pasos"] --> T5["J3 Enviar check-in"] --> T6["J2 Ver el historial"]
```

El camino sin hitos incumplidos; el escalamiento está en el user flow 4.3.

### 3.6 RRHH: crear una plantilla

```mermaid
flowchart LR
    T1["A5 Elegir 'Crear plantilla'"] --> T2["A6 Completar nombre, puesto y área"] --> T3["A6 Agregar tareas por etapa"] --> T4["A6 Ordenar y definir dependencias"] --> T5["A7 Revisar la vista previa"] --> T6["A6 Guardar plantilla"]
```

### 3.7 RRHH: dar de alta un ingreso

```mermaid
flowchart LR
    T1["A2 Elegir 'Dar de alta un ingreso'"] --> T2["A3 Completar datos, jefe y buddy"] --> T3["A3 Elegir plantilla"] --> T4["A3 Guardar ingreso"] --> T5["A4 Ver el recorrido generado"]
```

### 3.8 RRHH: atender una alerta del panel

```mermaid
flowchart LR
    T1["A1 Ver la alerta"] --> T2["A1 Abrir la alerta"] --> T3["A4 Revisar el check-in o la tarea"] --> T4["A4 Marcar la tarea de otra área como hecha"] --> T5["A1 Ver los KPIs actualizados"]
```

### 3.9 Sistemas: resolver una solicitud de acceso

```mermaid
flowchart LR
    T1["S1 Abrir la solicitud"] --> T2["S2 Verificar la identidad"] --> T3["S2 Elegir 'Desbloquear cuenta'"] --> T4["S2 Confirmar"] --> T5["S1 Ver la solicitud resuelta"]
```

### 3.10 Sistemas: exportar la auditoría

```mermaid
flowchart LR
    T1["S3 Abrir la pestaña Auditoría"] --> T2["S3 Filtrar por tipo y fechas"] --> T3["S3 Revisar los eventos"] --> T4["S3 Exportar CSV"]
```

---

## 4. User flows

> **Tipo: user flow.** Responde *¿qué camino toma la persona según lo que decide o lo que pasa?* Incluye rombos de decisión y ramas.

### 4.1 Inicio de sesión y bloqueo

```mermaid
flowchart TD
    S(["Inicio"]) --> M{"Método"}
    M -- "SSO" --> SSO["G2 Redirección simulada"] --> MFA
    M -- "Correo y contraseña" --> L{"¿Cuenta bloqueada?"}
    L -- "Sí" --> LK["Aviso de bloqueo y derivación a sistemas"]
    L -- "No" --> C{"¿Credenciales válidas?"}
    C -- "No" --> F["'Correo o contraseña incorrectos' + intento fallido"]
    F --> N{"¿5 intentos?"}
    N -- "No" --> M
    N -- "Sí" --> LOCK["Bloquear cuenta y registrar en auditoría"] --> LK
    C -- "Sí" --> P{"¿Cambio de contraseña forzado?"}
    P -- "Sí" --> NP["Crear contraseña nueva con política en vivo"] --> MFA
    P -- "No" --> MFA{"¿Dispositivo recordado?"}
    MFA -- "Sí" --> OK
    MFA -- "No" --> CODE["G3 Código de 6 dígitos"]
    CODE --> V{"¿Código válido?"}
    V -- "Sí" --> OK(["Sesión iniciada"])
    V -- "No" --> CODE
    LK --> HELP["G4 Solicitar ayuda a sistemas"]
```

El bloqueo no se levanta solo: la única salida es una solicitud a sistemas. El error de credenciales es siempre el mismo, exista o no la cuenta.

### 4.2 Publicación de una plantilla

```mermaid
flowchart TD
    S(["A5 Plantillas"]) --> Q{"¿Nueva o existente?"}
    Q -- "Nueva" --> C["Crear desde cero"]
    Q -- "Basada en otra" --> D["Duplicar"]
    Q -- "Existente" --> PUBQ{"¿Está publicada? (fase B)"}
    PUBQ -- "Sí" --> DR["Se crea un borrador nuevo"]
    PUBQ -- "No" --> E
    C --> E["A6 Editar tareas, etapas y dependencias"]
    D --> E
    DR --> E
    E --> V{"¿Ciclo o dependencia con plazo posterior?"}
    V -- "Sí" --> ERR["Error junto a la tarea; no se guarda"] --> E
    V -- "No" --> W{"¿Plazo fuera del rango de la etapa?"}
    W -- "Sí" --> WARN["Advertencia, se puede seguir"] --> PV
    W -- "No" --> PV["A7 Vista previa"]
    PV --> OKQ{"¿Conforme?"}
    OKQ -- "No" --> E
    OKQ -- "Sí, fase A" --> SAVE(["Guardar: asignable"])
    OKQ -- "Sí, fase B" --> NOTE["Resumen de cambios + nota de versión"]
    NOTE --> PUB(["Publicada: asignable; los recorridos en curso no cambian"])
```

En fase A, guardar deja la plantilla lista para asignar. En fase B se suma la publicación con versiones: editar una publicada crea un borrador y publicar nunca cambia los recorridos en curso.

### 4.3 Check-in con escalamiento

```mermaid
flowchart TD
    S(["J1 o J2: Hacer check-in"]) --> SR{"¿El ingreso respondió la autoevaluación?"}
    SR -- "Sí" --> READ["J3 Leer autoevaluación"] --> EV
    SR -- "No" --> AV["Aviso: todavía no respondió"] --> EV
    EV["Evaluar cada hito"] --> NM{"¿Algún hito no cumplido?"}
    NM -- "No" --> COM
    NM -- "Sí" --> ACT{"¿Qué acción?"}
    ACT -- "Reprogramar" --> RP["Elegir nueva fecha"] --> COM
    ACT -- "Escalar a RRHH" --> ES["Escribir nota de escalamiento"] --> COM
    COM["Comentarios y próximos pasos"] --> SEND["Enviar check-in"]
    SEND --> VAL{"¿Todos los hitos evaluados?"}
    VAL -- "No" --> ERR["Error junto al hito"] --> EV
    VAL -- "Sí" --> SAVED(["Guardado en el historial"])
    SAVED -. "si se escaló" .-> ALERT(["Alerta en A1 para RRHH"])
```

La autoevaluación es previa a la reunión pero no obligatoria. Solo el escalamiento genera una alerta para RRHH.

### 4.4 Solicitud de acceso

```mermaid
flowchart TD
    U(["Usuario sin acceso"]) --> G4["G4 Enviar solicitud"]
    G4 --> EX{"¿El correo existe?"}
    EX -- "Sí" --> REQ["Solicitud nueva en S1"]
    EX -- "No" --> NOREQ["Sin solicitud asociada a una cuenta"]
    REQ --> CONF["Confirmación con número, idéntica en ambos casos"]
    NOREQ --> CONF
    REQ --> S2["S2 Sistemas abre la solicitud"]
    S2 --> ID{"¿Se pudo verificar la identidad?"}
    ID -- "No" --> REJ(["Rechazar con motivo"])
    ID -- "Sí" --> ACT{"¿Qué necesita?"}
    ACT -- "Cuenta bloqueada" --> UN["Desbloquear"]
    ACT -- "Olvidó la contraseña" --> PW["Forzar cambio de contraseña"]
    ACT -- "No recibe el código" --> MF["Restablecer MFA"]
    UN --> AUD
    PW --> AUD
    MF --> AUD
    AUD["Registrar en auditoría"] --> BACK(["El usuario vuelve a iniciar sesión"])
```

La confirmación nunca revela si el correo existe. No hay forma de resolver sin verificar antes la identidad.

### 4.5 Baja de accesos (fase B)

```mermaid
flowchart TD
    R["A11 RRHH registra la baja con fecha y tipo"] --> CK["Checklist de revocación para sistemas"]
    R --> REM["Recordatorio al jefe directo"]
    CK --> IT["S4 Sistemas revoca cuenta, correo, herramientas y dispositivos"]
    IT --> D{"¿Llegó la fecha efectiva?"}
    D -- "No" --> IT
    D -- "Sí" --> P{"¿Quedan accesos sin revocar?"}
    P -- "Sí" --> LATE["Marcar como atrasada y notificar a sistemas"] --> OFF
    P -- "No" --> OFF["Cuenta deshabilitada y sesiones cerradas"]
    OFF --> AUD(["Todo queda en la auditoría"])
```

A la fecha efectiva la cuenta se deshabilita aunque falten tareas, que quedan marcadas como atrasadas.

---

## 5. Flujo de proceso: recorrido de un ingreso

> **Tipo: flujo de proceso.** Muestra cómo avanza el recorrido en el tiempo, no lo que hace una persona en la interfaz.

```mermaid
flowchart LR
    ALTA["Alta (A3)"] --> GEN["Generar tareas con fechas reales"]
    GEN --> PRE["Preingreso: antes del día 0"]
    PRE --> W1["Semana 1: días 0 a 6"]
    W1 --> M1["Mes 1: días 7 a 29"]
    M1 --> CI30["Check-in 30 días"]
    CI30 --> D90["Días 30 a 90"]
    D90 --> CI60["Check-in 60 días"]
    CI60 --> CI90["Check-in 90 días"]
    CI90 --> FIN(["Recorrido finalizado"])
```

Las etapas se derivan de la fecha de ingreso (límites de la sección 7 de `CLAUDE.md`). El recorrido se da por finalizado al completarse el check-in de 90 días.

---

## 6. Wireflows

> **Tipo: wireflow.** Responde *¿qué ve la persona en cada pantalla y qué toca para avanzar?* Cada wireflow une las capturas reales de `docs/screenshots/` con la acción que lleva a la pantalla siguiente (D-15, D-100). Se regeneran con `npm run og` desde la página interna `/wireflows`.

### 6.1 Inicio de sesión con MFA

<img src="wireflows/login.png" alt="Wireflow de inicio de sesión: G0, tocar Recorrer como Carla; G1, tocar Continuar con Microsoft; G2, la simulación sigue sola; G3, tocar Verificar con el código precargado; A1, panel de seguimiento." width="100%" />

Carla entra desde la portada con su rol preseleccionado: en tres toques llega a su panel, pasando por la simulación de SSO rotulada y la verificación en dos pasos con el código precargado.

### 6.2 Recorrido del nuevo ingreso

<img src="wireflows/journey.png" alt="Wireflow del recorrido de Sofía: N1 bienvenida, Empezar mi recorrido; N1, tocar una tarea de Lo próximo; N2, Marcar como hecha; N2 tarea bloqueada que muestra de qué depende; N3, autoevaluación." width="100%" />

Sofía arranca con la bienvenida guiada, completa una tarea desde "Lo próximo" (lo que desbloquea las que dependen de ella), entiende por qué otra está bloqueada y responde su autoevaluación antes del check-in.

### 6.3 Crear y guardar una plantilla

<img src="wireflows/template.png" alt="Wireflow de plantillas: A5, Crear plantilla; A6 plantilla nueva, Agregar tarea; A6 editor, ordenar, dependencias y Ver vista previa; A7 vista previa, Guardar plantilla; vuelta a A5." width="100%" />

Carla crea una plantilla, agrega y ordena tareas con sus dependencias, la revisa como la verá el nuevo ingreso y la guarda. La publicación con versiones llega con F8 (fase B).

---

## 7. Diagramas de estados

### 7.1 Tarea del recorrido

```mermaid
stateDiagram-v2
    [*] --> blocked: tiene dependencias sin completar
    [*] --> pending: sin dependencias pendientes
    blocked --> pending: se completan sus dependencias
    pending --> in_progress: se abre el curso o la tarea
    pending --> done: se marca como hecha
    in_progress --> done: se marca como hecha
    pending --> overdue: vence la fecha
    in_progress --> overdue: vence la fecha
    overdue --> done: se marca como hecha
    done --> [*]
```

`blocked` y `overdue` se calculan, no se guardan: dependen de las dependencias y de `DEMO_TODAY`. Una tarea bloqueada y vencida se muestra como bloqueada, con la fecha vencida indicada.

### 7.2 Check-in

```mermaid
stateDiagram-v2
    [*] --> pending: se crea con el alta
    pending --> hire_done: el ingreso responde la autoevaluación
    pending --> completed: el jefe completa sin autoevaluación
    hire_done --> completed: el jefe completa el check-in
    completed --> [*]
    note right of completed
        Si hay un hito no cumplido,
        se reprograma o se escala a RRHH
    end note
```

El check-in tiene tres estados; la acción ante un hito no cumplido (reprogramar o escalar) se guarda dentro del check-in completado.

### 7.3 Versión de plantilla (fase B)

```mermaid
stateDiagram-v2
    [*] --> draft: crear, editar una publicada o restaurar
    draft --> published: publicar con nota
    published --> archived: se publica una versión más nueva
    draft --> [*]: descartar borrador
```

Solo hay una versión publicada vigente por plantilla. Las archivadas siguen asociadas a los ingresos que las usan.

### 7.4 Solicitud de acceso

```mermaid
stateDiagram-v2
    [*] --> new: el usuario la envía
    new --> verifying: sistemas marca la verificación
    verifying --> resolved: desbloquear, forzar cambio o restablecer MFA
    new --> rejected: rechazo con motivo
    verifying --> rejected: rechazo con motivo
    resolved --> [*]
    rejected --> [*]
```

No hay camino de `new` a `resolved` sin pasar por la verificación de identidad.

### 7.5 Solicitud de privacidad (fase B)

```mermaid
stateDiagram-v2
    [*] --> new: el usuario la envía
    new --> in_progress: RRHH la toma
    in_progress --> answered: RRHH responde
    new --> rejected: rechazo con motivo
    in_progress --> rejected: rechazo con motivo
    answered --> [*]
    rejected --> [*]
```

El plazo de respuesta corre desde `new` y es visible en todos los estados abiertos.

### 7.6 Campaña de revisión de accesos (fase B)

```mermaid
stateDiagram-v2
    [*] --> open: sistemas la crea con alcance y fecha límite
    open --> open: los jefes deciden mantener o revocar
    open --> closed: sistemas ejecuta revocaciones y cierra
    closed --> [*]
```

La campaña sigue abierta mientras los jefes revisan; al cerrarse se genera el resumen descargable.
