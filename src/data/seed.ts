/**
 * Builds the demo state from the JSON files in this folder (CLAUDE.md: no backend,
 * all data comes from src/data/). Hires are described compactly in hires.json
 * (start date, template and how far they progressed); this builder generates their
 * tasks and check-ins with the same rules the app uses (D-29), so seed data and
 * runtime data can never disagree.
 */
import type {
  AccessRequest,
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
} from '@/types/domain';
import { addDays, DEMO_TODAY } from '@/lib/dates';
import { generateCheckins, generateHireTasks, hireStatus } from '@/lib/journey';
import accessRequests from './access-requests.json';
import auditEvents from './audit-events.json';
import authAttempts from './auth-attempts.json';
import checkinMilestones from './checkin-milestones.json';
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

function buildHire(seed: HireSeed, templatesById: Map<string, Template>): Hire {
  const template = templatesById.get(seed.templateId);
  if (!template) throw new Error(`Seed hire ${seed.id} uses unknown template ${seed.templateId}`);
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
  };
}

/** Fresh copy of the demo data, used on first load and by "Restablecer demo". */
export function buildSeed(): DemoData {
  const typedTemplates = templates as Template[];
  const templatesById = new Map(typedTemplates.map((t) => [t.id, t]));
  return structuredClone({
    people: people as Person[],
    templates: typedTemplates,
    hires: (hiresSeed as unknown as HireSeed[]).map((seed) => buildHire(seed, templatesById)),
    accessRequests: accessRequests as AccessRequest[],
    auditEvents: auditEvents as AuditEvent[],
    authAttempts: authAttempts as AuthAttempts[],
    accountFlags: {},
    securityPolicy: securityPolicy as SecurityPolicy,
  });
}
