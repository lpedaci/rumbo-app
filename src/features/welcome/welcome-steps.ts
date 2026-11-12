import type { Role } from '@/types/domain';

/** Roles with a guided welcome (F16, 2.2.1 pattern 9): every role since D-127. */
const ROLES_WITH_WELCOME: Role[] = ['admin', 'manager', 'hire', 'it_admin'];

export function hasGuidedWelcome(role: Role): boolean {
  return ROLES_WITH_WELCOME.includes(role);
}
