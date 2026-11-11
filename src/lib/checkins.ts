import { DEMO_TODAY, daysBetween } from '@/lib/dates';
import { checkinDueDate } from '@/lib/journey';
import type { Checkin, CheckinAction, CheckinStage, Hire, MilestoneResult, Mood } from '@/types/domain';

/** Days before the due date from which the manager is prompted to run the check-in (J1). */
export const CHECKIN_SOON_DAYS = 7;

export function findCheckin(hire: Hire, stage: string): Checkin | undefined {
  return hire.checkins.find((c) => c.stage === stage);
}

/** Days until the effective due date (negative when overdue). */
export function daysUntilCheckin(checkin: Checkin, today = DEMO_TODAY): number {
  return daysBetween(today, checkinDueDate(checkin));
}

/** Whether J1 offers "Hacer check-in": the self-review is in, or the date is close or past. */
export function checkinIsActionable(checkin: Checkin, today = DEMO_TODAY): boolean {
  if (checkin.status === 'completed') return false;
  return checkin.status === 'hire_done' || daysUntilCheckin(checkin, today) <= CHECKIN_SOON_DAYS;
}

/** A milestone "not met" needs a decision: reschedule or escalate to HR (F5). */
export function needsAction(results: (MilestoneResult | undefined)[]): boolean {
  return results.includes('not_met');
}

function updateCheckin(hire: Hire, stage: CheckinStage, change: (c: Checkin) => Checkin): Hire {
  return { ...hire, checkins: hire.checkins.map((c) => (c.stage === stage ? change(c) : c)) };
}

/** N3: the hire's self-review, sent before the meeting. */
export function applySelfReview(
  hire: Hire,
  stage: CheckinStage,
  review: { mood: Mood; comment: string },
  at: string,
): Hire {
  return updateCheckin(hire, stage, (c) => ({
    ...c,
    status: c.status === 'completed' ? 'completed' : 'hire_done',
    hireSelfReview: { ...review, comment: review.comment.trim(), submittedAt: at },
  }));
}

export interface ManagerCheckinInput {
  results: MilestoneResult[];
  managerComment: string;
  nextSteps: string;
  action?: CheckinAction;
}

/** J3: the manager reviews the milestones and closes the check-in (F5). */
export function applyManagerCheckin(hire: Hire, stage: CheckinStage, input: ManagerCheckinInput, at: string): Hire {
  return updateCheckin(hire, stage, (c) => ({
    ...c,
    status: 'completed',
    milestones: c.milestones.map((m, i) => ({ ...m, result: input.results[i] })),
    managerComment: input.managerComment.trim() || undefined,
    nextSteps: input.nextSteps.trim() || undefined,
    action: needsAction(input.results) ? input.action : undefined,
    completedAt: at,
  }));
}
