import { Icon } from '@/components/ui/Icon';

/**
 * Wireflows of docs/flows.md (CLAUDE.md 14.5, D-100), development only like the OG card:
 * real screenshots from docs/screenshots/ joined by the action that leads to the next screen.
 * Exported as images with `npm run og`. Documentation, not product UI: texts live here.
 */
interface Step {
  id: string;
  name: string;
  shot: string;
  /** Action that leads to the next screen. */
  action?: string;
}

const FLOWS: { key: string; title: string; question: string; steps: Step[] }[] = [
  {
    key: 'login',
    title: 'Wireflow · Inicio de sesión con MFA (Carla, RRHH)',
    question: '¿Qué ve Carla en cada pantalla y qué toca para entrar?',
    steps: [
      { id: 'G0', name: 'Inicio de la demo', shot: 'g0-home', action: 'Toca "Recorrer como Carla"' },
      { id: 'G1', name: 'Inicio de sesión', shot: 'g1-login-preselected', action: 'Toca "Continuar con Microsoft"' },
      { id: 'G2', name: 'Simulación de SSO', shot: 'g2-sso-preselected', action: 'Sigue sola o toca "Continuar"' },
      {
        id: 'G3',
        name: 'Verificación en dos pasos',
        shot: 'g3-verify',
        action: 'Toca "Verificar" con el código precargado',
      },
      { id: 'A1', name: 'Panel de seguimiento', shot: 'home-admin' },
    ],
  },
  {
    key: 'journey',
    title: 'Wireflow · Recorrido del nuevo ingreso (Sofía)',
    question: '¿Qué ve Sofía y qué toca para avanzar en su recorrido?',
    steps: [
      { id: 'N1', name: 'Bienvenida guiada', shot: 'n1-welcome', action: 'Toca "Empezar mi recorrido"' },
      { id: 'N1', name: 'Mi recorrido', shot: 'n1-journey', action: 'Toca una tarea en "Lo próximo"' },
      {
        id: 'N2',
        name: 'Detalle de la tarea',
        shot: 'n2-task-overdue',
        action: 'Toca "Marcar como hecha"; se desbloquean las que dependen de ella',
      },
      {
        id: 'N2',
        name: 'Tarea bloqueada',
        shot: 'n2-task-blocked',
        action: 'Desde N1, toca "Responder mi autoevaluación"',
      },
      { id: 'N3', name: 'Mi autoevaluación', shot: 'n3-self-review' },
    ],
  },
  {
    key: 'template',
    title: 'Wireflow · Crear y guardar una plantilla (Carla, RRHH)',
    question: '¿Qué ve Carla y qué toca para armar el recorrido de un puesto?',
    steps: [
      { id: 'A5', name: 'Plantillas', shot: 'a5-templates', action: 'Toca "Crear plantilla"' },
      {
        id: 'A6',
        name: 'Plantilla nueva',
        shot: 'a6-template-new',
        action: 'Completa los datos y toca "Agregar tarea" en cada etapa',
      },
      {
        id: 'A6',
        name: 'Editor de la plantilla',
        shot: 'a6-template-editor',
        action: 'Ordena, define dependencias y toca "Ver vista previa"',
      },
      {
        id: 'A7',
        name: 'Vista previa',
        shot: 'a7-template-preview',
        action: 'Vuelve al editor y toca "Guardar plantilla" (publicar llega con F8)',
      },
      { id: 'A5', name: 'Plantillas', shot: 'a5-templates' },
    ],
  },
];

function Screen({ step }: { step: Step }) {
  return (
    <figure className="flex w-80 shrink-0 flex-col gap-2">
      <figcaption className="flex items-center gap-2">
        <span className="rounded-full bg-primary px-2 py-0.5 text-label-medium text-on-primary tabular-nums">
          {step.id}
        </span>
        <span className="text-title-small text-on-surface">{step.name}</span>
      </figcaption>
      <div className="aspect-[16/10] overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest">
        <img src={`/docs/screenshots/${step.shot}-1280.jpg`} alt="" className="h-full w-full object-cover object-top" />
      </div>
    </figure>
  );
}

function Action({ text }: { text: string }) {
  return (
    <div className="flex w-36 shrink-0 flex-col items-center gap-2 self-center pt-6 text-center">
      <span className="text-body-small text-on-surface">{text}</span>
      <Icon name="arrow_forward" size={24} className="text-primary" />
    </div>
  );
}

export function WireflowsPage() {
  return (
    <div className="flex flex-col gap-10 bg-surface p-10">
      {FLOWS.map((flow) => (
        <section
          key={flow.key}
          data-wireflow={flow.key}
          className="flex w-fit flex-col gap-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-8"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-title-large text-on-surface">{flow.title}</h2>
            <p className="text-body-medium text-on-surface-variant">{flow.question}</p>
          </div>
          <div className="flex items-start gap-2">
            {flow.steps.map((step, i) => (
              <div key={`${step.shot}-${i}`} className="flex items-start gap-2">
                <Screen step={step} />
                {step.action && <Action text={step.action} />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
