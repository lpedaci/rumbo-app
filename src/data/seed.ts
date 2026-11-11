/**
 * Builds the demo state from the JSON files in this folder (CLAUDE.md: no backend,
 * all data comes from src/data/). Hires are described compactly in hires.json
 * (start date, template and how far they progressed); this builder generates their
 * tasks and check-ins with the same rules the app uses (D-29), so seed data and
 * runtime data can never disagree.
 */
import type {
  AccessRequest,
  AppNotification,
  Comment,
  AccountFlags,
  AuditEvent,
  AuthAttempts,
  Checkin,
  CheckinAction,
  CheckinStage,
  Hire,
  HireTask,
  MilestoneResult,
  Mood,
  Owner,
  Person,
  SecurityPolicy,
  Template,
  TemplateVersion,
} from '@/types/domain';
import { addDays, DEMO_TODAY } from '@/lib/dates';
import { generateCheckins, generateHireTasks, hireStatus } from '@/lib/journey';
import { buildSeedNotifications } from '@/lib/notifications';
import { asVersion } from '@/lib/templates';
import accessRequests from './access-requests.json';
import auditEvents from './audit-events.json';
import authAttempts from './auth-attempts.json';
import checkinMilestones from './checkin-milestones.json';
import comments from './comments.json';
import hiresSeed from './hires.json';
import people from './people.json';
import securityPolicy from './security-policy.json';
import templates from './templates.json';

interface CheckinSeed {
  status: Checkin['status'];
  selfReview?: { mood: number; comment: string };
  results?: MilestoneResult[];
  managerComment?: string;
  nextSteps?: string;
  action?: CheckinAction;
}

interface HireSeed {
  id: string;
  personId: string;
  startDate: string;
  managerId: string;
  buddyId?: string;
  hrId: string;
  templateId: string;
  progress: {
    /** Template tasks with an offset up to this value are done; `all` = every task; null = none. */
    doneThroughOffset: number | 'all' | null;
    notDone: string[];
    inProgress: string[];
    /** Days late per template task id (completedAt = dueDate + days). */
    lateDays: Record<string, number>;
  };
  checkins: Partial<Record<CheckinStage, CheckinSeed>>;
}

export interface DemoData {
  people: Person[];
  templates: Template[];
  hires: Hire[];
  accessRequests: AccessRequest[];
  auditEvents: AuditEvent[];
  authAttempts: AuthAttempts[];
  /** Per person id. Empty in the seed: no pending forced changes. */
  accountFlags: Record<string, AccountFlags>;
  securityPolicy: SecurityPolicy;
  /** F7: generated from the data above with the same rules as runtime events. */
  notifications: AppNotification[];
  /** F9: comments on journey tasks. */
  comments: Comment[];
}

function whoCompletes(owner: Owner, seed: HireSeed): string {
  switch (owner) {
    case 'hire':
      return seed.personId;
    case 'manager':
      return seed.managerId;
    // Buddy, IT and Facilities have no view in the MVP: HR marks their tasks (D-09).
    default:
      return seed.hrId;
  }
}

function buildTasks(seed: HireSeed, template: Template): HireTask[] {
  const { doneThroughOffset, notDone, inProgress, lateDays } = seed.progress;
  const offsetOf = new Map(template.tasks.map((t) => [t.id, t.offsetDays]));

  return generateHireTasks(template, seed.startDate, seed.id).map((task) => {
    const offset = offsetOf.get(task.templateTaskId)!;
    const reached = doneThroughOffset === 'all' || (doneThroughOffset !== null && offset <= doneThroughOffset);
    if (reached && !notDone.includes(task.templateTaskId)) {
      const late = lateDays[task.templateTaskId];
      let completed = late !== undefined ? addDays(task.dueDate, late) : addDays(task.dueDate, -1);
      if (completed > DEMO_TODAY) completed = DEMO_TODAY;
      return {
        ...task,
        status: 'done' as const,
        completedAt: `${completed}T15:00:00.000Z`,
        completedBy: whoCompletes(task.owner, seed),
      };
    }
    if (inProgress.includes(task.templateTaskId)) return { ...task, status: 'in_progress' as const };
    return task;
  });
}

function buildCheckins(seed: HireSeed): Checkin[] {
  return generateCheckins(seed.startDate, seed.id, checkinMilestones).map((checkin) => {
    const override = seed.checkins[checkin.stage];
    if (!override) return checkin;
    const reviewDate = addDays(checkin.dueDate, -1);
    return {
      ...checkin,
      status: override.status,
      hireSelfReview: override.selfReview && {
        mood: override.selfReview.mood as Mood,
        comment: override.selfReview.comment,
        submittedAt: `${reviewDate < DEMO_TODAY ? reviewDate : DEMO_TODAY}T13:00:00.000Z`,
      },
      milestones: checkin.milestones.map((m, i) => ({ ...m, result: override.results?.[i] })),
      managerComment: override.managerComment,
      nextSteps: override.nextSteps,
      action: override.action,
      completedAt: override.status === 'completed' ? `${checkin.dueDate}T16:00:00.000Z` : undefined,
    };
  });
}

/**
 * Version history of the seed templates (F8, D-108). Every template has a v1; the data analyst
 * one also has a v2 that added the own project (d17) and moved the culture handbook (d11) two
 * days earlier, so the demo shows journeys on each version and a real comparison.
 */
const TEMPLATE_HISTORY: Record<
  string,
  { publishedAt: string; note: string; removed?: string[]; changes?: Record<string, Partial<Template['tasks'][number]>> }[]
> = {
  'tpl-data': [
    {
      publishedAt: '2026-05-15T14:00:00.000Z',
      note: 'Primera versión del recorrido de Analista de Datos, revisada con el equipo de Datos.',
      removed: ['d17'],
      changes: { d11: { offsetDays: 6 } },
    },
    {
      publishedAt: '2026-09-15T14:00:00.000Z',
      note: 'Agrega el proyecto propio del día 60 y adelanta la lectura del manual de cultura a la primera semana, a pedido de los ingresos de julio.',
    },
  ],
  'tpl-frontend': [
    { publishedAt: '2026-05-20T14:00:00.000Z', note: 'Primera versión del recorrido de Desarrollo Frontend.' },
  ],
  'tpl-sales': [{ publishedAt: '2026-05-10T14:00:00.000Z', note: 'Primera versión del recorrido Comercial.' }],
};

/** Days before the start date when a hire is created and its journey generated (seed rule). */
const SEED_CREATED_BEFORE_START = 21;

function buildVersions(template: Template): TemplateVersion[] {
  return (TEMPLATE_HISTORY[template.id] ?? []).map((entry, i) => ({
    version: i + 1,
    publishedAt: entry.publishedAt,
    publishedBy: 'p-carla',
    note: entry.note,
    name: template.name,
    jobTitle: template.jobTitle,
    area: template.area,
    tasks: template.tasks
      .filter((task) => !entry.removed?.includes(task.id))
      .map((task) => ({ ...task, ...entry.changes?.[task.id] })),
  }));
}

function buildHire(seed: HireSeed, templatesById: Map<string, Template>): Hire {
  const current = templatesById.get(seed.templateId);
  if (!current) throw new Error(`Seed hire ${seed.id} uses unknown template ${seed.templateId}`);
  // The journey comes from the version in force when the hire was created (F8).
  const created = addDays(seed.startDate, -SEED_CREATED_BEFORE_START);
  const version = [...current.versions].reverse().find((v) => v.publishedAt.slice(0, 10) <= created) ?? current.versions[0];
  const template = version ? asVersion(current, version) : current;
  const checkins = buildCheckins(seed);
  return {
    id: seed.id,
    personId: seed.personId,
    startDate: seed.startDate,
    managerId: seed.managerId,
    buddyId: seed.buddyId,
    hrId: seed.hrId,
    templateId: seed.templateId,
    status: hireStatus({ startDate: seed.startDate, checkins }),
    tasks: buildTasks(seed, template),
    checkins,
    templateVersion: version?.version,
  };
}

/** Fresh copy of the demo data, used on first load and by "Restablecer demo". */
export function buildSeed(): DemoData {
  const typedTemplates = (templates as Omit<Template, 'versions'>[]).map((t) => {
    const template = { ...t, versions: [] } as Template;
    return { ...template, versions: buildVersions(template) };
  });
  const templatesById = new Map(typedTemplates.map((t) => [t.id, t]));
  const hires = (hiresSeed as unknown as HireSeed[]).map((seed) => buildHire(seed, templatesById));
  return structuredClone({
    people: people as Person[],
    templates: typedTemplates,
    hires,
    accessRequests: accessRequests as AccessRequest[],
    auditEvents: auditEvents as AuditEvent[],
    authAttempts: authAttempts as AuthAttempts[],
    accountFlags: {},
    securityPolicy: securityPolicy as SecurityPolicy,
    notifications: buildSeedNotifications(
      hires,
      people as Person[],
      accessRequests as AccessRequest[],
      authAttempts as AuthAttempts[],
      comments as Comment[],
    ),
    comments: comments as Comment[],
  });
}
