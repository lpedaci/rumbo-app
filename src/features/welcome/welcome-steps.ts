import type { Role } from '@/types/domain';

/**
 * Roles with a guided welcome (F16, 2.2.1 pattern 9). The pilot covers the new hire;
 * the other roles get theirs when their home screens are redesigned.
 */
const ROLES_WITH_WELCOME: Role[] = ['hire'];

export function hasGuidedWelcome(role: Role): boolean {
  return ROLES_WITH_WELCOME.includes(role);
}
