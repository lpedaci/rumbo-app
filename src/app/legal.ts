import type { PrivacyRequestType } from '@/types/domain';

/**
 * Legal configuration (F10, D-113, confirmed by Lourdes on 11/11/2026). Deadlines to answer a
 * request about personal data under Ley 25.326 (Argentina). Kept in one place because there are
 * reform bills in Congress: changing a value here updates the rule, the seed, the texts and the
 * tests at once.
 *
 * - `calendar`: every day counts.
 * - `business`: Monday to Friday; Saturdays and Sundays are skipped. National holidays are not
 *   counted out in the demo (there is no holiday calendar), see D-113.
 */
export type DeadlineKind = 'calendar' | 'business';

export interface LegalDeadline {
  days: number;
  kind: DeadlineKind;
  /** Article of the law, shown in the documentation. */
  article: string;
}

export const PRIVACY_LAW = 'Ley 25.326';

export const PRIVACY_DEADLINES: Record<PrivacyRequestType, LegalDeadline> = {
  access: { days: 10, kind: 'calendar', article: 'art. 14' },
  rectification: { days: 5, kind: 'business', article: 'art. 16' },
  deletion: { days: 5, kind: 'business', article: 'art. 16' },
};
