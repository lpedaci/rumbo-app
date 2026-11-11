import type { ConsentRecord, Hire, PrivacyRequestType, SensitiveField } from '@/types/domain';
import { addDays, DEMO_TODAY, daysBetween } from './dates';
import { CHECKIN_OFFSETS } from './journey';

/**
 * Privacy rules (F10). Deadlines follow Ley 25.326 (Argentina): access within 10 calendar days,
 * rectification and deletion within 5 business days. Sensitive identifiers are always masked
 * and only the last 4 characters are shown.
 */

/** True when the person accepted the version of the notice in force. */
export function hasConsent(consents: ConsentRecord[], personId: string, version: string): boolean {
  return consents.some((c) => c.personId === personId && c.noticeVersion === version);
}

export function consentOf(consents: ConsentRecord[], personId: string): ConsentRecord | undefined {
  return consents.find((c) => c.personId === personId);
}

/** Adds business days (Monday to Friday) to an ISO date. */
export function addBusinessDays(isoDate: string, days: number): string {
  let date = isoDate;
  let left = days;
  while (left > 0) {
    date = addDays(date, 1);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) left -= 1;
  }
  return date;
}

/** Legal deadline of a request, from the day it was sent. */
export function dueDateFor(type: PrivacyRequestType, createdOn: string): string {
  return type === 'access' ? addDays(createdOn, 10) : addBusinessDays(createdOn, 5);
}

/** Days left to answer (negative when the deadline passed). */
export function daysLeft(dueAt: string, today = DEMO_TODAY): number {
  return daysBetween(today, dueAt);
}

/** Masked identifier: everything hidden except the last 4 characters, keeping separators. */
export function mask(value: string, field: SensitiveField): string {
  const last = value.replace(/\D/g, '').slice(-4);
  if (field === 'bankAccount') return `•••• •••• •••• ${last}`;
  // DNI 39.562.914 → ***.***.2914 ; CUIL 23-39562914-4 → **-*****914-4
  if (field === 'dni') return `***.***.${last}`;
  return `**-****${value.replace(/\D/g, '').slice(-4, -1)}-${value.slice(-1)}`;
}

/**
 * Scheduled anonymization of a finished journey (retention policy): the journey ends at day 90
 * and its data is kept `years` years after that.
 */
export function anonymizationDate(hire: Pick<Hire, 'startDate'>, years: number): string {
  const end = addDays(hire.startDate, CHECKIN_OFFSETS.day90);
  return addDays(end, Math.round(years * 365));
}

/** Next request id, `PRIV-2026-0009` style. */
export function nextPrivacyRequestId(existing: { id: string }[], year = DEMO_TODAY.slice(0, 4)): string {
  const numbers = existing.map((r) => Number(r.id.split('-').at(-1)) || 0);
  return `PRIV-${year}-${String(Math.max(0, ...numbers) + 1).padStart(4, '0')}`;
}
