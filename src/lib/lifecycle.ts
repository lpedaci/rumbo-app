import type { AccessTask, JobTitle, LifecycleEvent } from '@/types/domain';
import { DEMO_TODAY } from './dates';

/**
 * Access lifecycle rules (F12): joiner, mover and leaver. The access each job needs comes from
 * the jobs catalog (F15, `suggestedAccess`); IT grants or revokes each one and marks it done.
 */

/** Always revoked on a leaver: the devices given to the person (laptop, phone, badge). */
export const DEVICES_ACCESS = 'Dispositivos asignados';

let counter = 0;
function taskId(): string {
  counter += 1;
  return `at-${Date.now().toString(36)}-${counter}`;
}

const grant = (system: string): AccessTask => ({ id: taskId(), system, action: 'grant', status: 'pending' });
const revoke = (system: string): AccessTask => ({ id: taskId(), system, action: 'revoke', status: 'pending' });

/** Joiner: grant everything the job needs. */
export function joinerTasks(job: JobTitle | undefined): AccessTask[] {
  return (job?.suggestedAccess ?? ['Cuenta de trabajo', 'Correo']).map(grant);
}

/** Mover: grant what the new job adds and revoke what it no longer needs. */
export function moverTasks(from: JobTitle | undefined, to: JobTitle): AccessTask[] {
  const before = new Set(from?.suggestedAccess ?? []);
  const after = new Set(to.suggestedAccess);
  return [
    ...to.suggestedAccess.filter((a) => !before.has(a)).map(grant),
    ...(from?.suggestedAccess ?? []).filter((a) => !after.has(a)).map(revoke),
  ];
}

/** Leaver: revoke every access of the job, then recover the devices. */
export function leaverTasks(job: JobTitle | undefined): AccessTask[] {
  const access = job?.suggestedAccess ?? ['Cuenta de trabajo', 'Correo'];
  return [...access, DEVICES_ACCESS].map(revoke);
}

export function progressOfEvent(event: Pick<LifecycleEvent, 'accessTasks'>): { done: number; total: number } {
  return { done: event.accessTasks.filter((t) => t.status === 'done').length, total: event.accessTasks.length };
}

export type LifecycleState = 'scheduled' | 'in_progress' | 'done';

/** Done when every task is done; scheduled while the effective date is ahead and nothing is done. */
export function lifecycleState(event: LifecycleEvent, today = DEMO_TODAY): LifecycleState {
  const { done, total } = progressOfEvent(event);
  if (total > 0 && done === total) return 'done';
  if (event.effectiveDate > today && done === 0) return 'scheduled';
  return 'in_progress';
}

/** True when the change takes effect now (the demo applies it at once; later dates stay scheduled). */
export function isEffective(event: Pick<LifecycleEvent, 'effectiveDate'>, today = DEMO_TODAY): boolean {
  return event.effectiveDate <= today;
}

export function nextLifecycleId(existing: { id: string }[]): string {
  const numbers = existing.map((e) => Number(e.id.split('-').at(-1)) || 0);
  return `LC-${DEMO_TODAY.slice(0, 4)}-${String(Math.max(0, ...numbers) + 1).padStart(4, '0')}`;
}
