import type { IconName } from '@/components/ui/Icon';
import type { Action } from '@/lib/permissions';

export interface NavItem {
  /** Route. `null` = computed at render time (for example, the next check-in). */
  to: string;
  /** i18n key of the label. */
  label: string;
  icon: IconName;
  /** Visible only to users with this permission (never by role name). */
  action: Action;
  /** Active only on the exact route (home items). */
  end?: boolean;
}

/** Global navigation by workspace (information-architecture.md 3.1), phase A items. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'layout.nav.dashboard', icon: 'dashboard', action: 'dashboard:view', end: true },
  { to: '/admin/hires', label: 'layout.nav.hires', icon: 'group', action: 'workspace:hr' },
  { to: '/admin/templates', label: 'layout.nav.templates', icon: 'description', action: 'template:view' },
  { to: '/admin/people', label: 'layout.nav.people', icon: 'badge', action: 'person:manage' },
  { to: '/admin/lifecycle', label: 'layout.nav.lifecycle', icon: 'swap_horiz', action: 'lifecycle:manage' },
  { to: '/admin/privacy-requests', label: 'layout.nav.privacy', icon: 'policy', action: 'privacy_request:manage' },
  { to: '/manager', label: 'layout.nav.team', icon: 'groups', action: 'workspace:team' },
  { to: '/me', label: 'layout.nav.journey', icon: 'route', action: 'workspace:journey', end: true },
  { to: '/me/checkin', label: 'layout.nav.checkin', icon: 'fact_check', action: 'checkin:self_review' },
  { to: '/it/requests', label: 'layout.nav.requests', icon: 'support_agent', action: 'access_request:view' },
  { to: '/it/lifecycle', label: 'layout.nav.accessTasks', icon: 'key', action: 'access_task:complete' },
  { to: '/it/security', label: 'layout.nav.security', icon: 'security', action: 'security:view' },
];
