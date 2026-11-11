import { DEMO_TODAY, daysBetween } from '@/lib/dates';
import {
  currentStage,
  generateCheckins,
  generateHireTasks,
  hireStatus,
  isPastDue,
  nextCheckin,
  progressOf,
  type Progress,
} from '@/lib/journey';
import type { Checkin, CheckinStage, Hire, HireStatus, Person, Stage, Template } from '@/types/domain';
import { asVersion, latestVersion } from './templates';

/** Everything the hire listing (A2) and the hire record (A4) show about one journey. */
export interface HireSummary {
  hire: Hire;
  person: Person | undefined;
  manager: Person | undefined;
  template: Template | undefined;
  status: HireStatus;
  progress: Progress;
  /** Tasks past their due date and not done. */
  overdue: number;
  stage: Stage;
  /** Days since the start date (negative before it). */
  day: number;
  nextCheckin: Checkin | undefined;
}

export function summarizeHire(hire: Hire, people: Person[], templates: Template[], today = DEMO_TODAY): HireSummary {
  return {
    hire,
    person: people.find((p) => p.id === hire.personId),
    manager: people.find((p) => p.id === hire.managerId),
    template: templates.find((t) => t.id === hire.templateId),
    status: hireStatus(hire, today),
    progress: progressOf(hire.tasks),
    overdue: hire.tasks.filter((t) => t.status !== 'done' && isPastDue(t, today)).length,
    stage: currentStage(hire.startDate, today),
    day: daysBetween(hire.startDate, today),
    nextCheckin: nextCheckin(hire),
  };
}

export type HireStatusFilter = 'all' | HireStatus;

export interface HireFilters {
  status: HireStatusFilter;
  /** `all` or an area name. */
  area: string;
}

/** Status and area filters of A2 (F3). Sorted by start date, newest first. */
export function filterHires(summaries: HireSummary[], filters: HireFilters): HireSummary[] {
  return summaries
    .filter((s) => filters.status === 'all' || s.status === filters.status)
    .filter((s) => filters.area === 'all' || s.person?.area === filters.area)
    .sort((a, b) => b.hire.startDate.localeCompare(a.hire.startDate));
}

export function countByStatus(summaries: HireSummary[]): Record<HireStatusFilter, number> {
  return {
    all: summaries.length,
    upcoming: summaries.filter((s) => s.status === 'upcoming').length,
    active: summaries.filter((s) => s.status === 'active').length,
    completed: summaries.filter((s) => s.status === 'completed').length,
  };
}

/** Lowercase ASCII words of a name: "Martina Gómez Paz" → ["martina", "gomez", "paz"]. */
function nameParts(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Work email of a new hire: nombre.apellido@nortia.demo, with a number when it is taken
 * (D-78). The HR form does not ask for it: the company account is created from the name.
 */
export function workEmailFor(name: string, takenEmails: string[]): string {
  const parts = nameParts(name);
  const base = parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : (parts[0] ?? 'persona');
  const taken = new Set(takenEmails.map((e) => e.toLowerCase()));
  let email = `${base}@nortia.demo`;
  for (let n = 2; taken.has(email); n += 1) email = `${base}${n}@nortia.demo`;
  return email;
}

function uniqueId(prefix: string, name: string, takenIds: string[]): string {
  const base = `${prefix}-${nameParts(name).join('-') || 'nuevo'}`;
  const taken = new Set(takenIds);
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  return id;
}

/** Next employee number of the company: NOR-1001, NOR-1002… (D-78). */
export function nextEmployeeId(people: Person[]): string {
  const numbers = people.map((p) => Number(p.employeeId?.replace(/\D/g, '') ?? 0));
  const next = Math.max(1000 + people.length, ...numbers) + 1;
  return `NOR-${next}`;
}

export interface NewHireInput {
  name: string;
  jobTitle: string;
  area: string;
  /** ISO date. */
  startDate: string;
  managerId: string;
  buddyId?: string;
  templateId: string;
  /** Mobile for identity verification. */
  mobile: string;
}

/**
 * Builds the person and the journey of a new hire (F3): copies the tasks of the published
 * version in force (F8) with real dates (dueDate = startDate + offsetDays) and the 30/60/90
 * check-ins.
 */
export function createHire(
  input: NewHireInput,
  context: {
    template: Template;
    hrId: string;
    people: Person[];
    hires: Hire[];
    milestones: Record<CheckinStage, string[]>;
    today?: string;
  },
): { person: Person; hire: Hire } {
  const personId = uniqueId(
    'p',
    input.name,
    context.people.map((p) => p.id),
  );
  const hireId = uniqueId(
    'h',
    input.name,
    context.hires.map((h) => h.id),
  );
  const person: Person = {
    id: personId,
    name: input.name.trim(),
    role: 'hire',
    jobTitle: input.jobTitle.trim(),
    area: input.area,
    email: workEmailFor(
      input.name,
      context.people.map((p) => p.email),
    ),
    managerId: input.managerId,
    employeeId: nextEmployeeId(context.people),
    mobile: input.mobile.trim(),
  };
  const checkins = generateCheckins(input.startDate, hireId, context.milestones);
  const version = latestVersion(context.template);
  const hire: Hire = {
    id: hireId,
    personId,
    startDate: input.startDate,
    managerId: input.managerId,
    buddyId: input.buddyId || undefined,
    hrId: context.hrId,
    templateId: input.templateId,
    status: hireStatus({ startDate: input.startDate, checkins }, context.today ?? DEMO_TODAY),
    // F8: the journey copies the version in force; publishing later never changes it.
    tasks: generateHireTasks(version ? asVersion(context.template, version) : context.template, input.startDate, hireId),
    checkins,
    templateVersion: version?.version,
  };
  return { person, hire };
}
