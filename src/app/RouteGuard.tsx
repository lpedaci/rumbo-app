import { Outlet, useLocation } from 'react-router';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { can, requiredPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/store/session-store';

/**
 * Checks the permission required by the current route against the matrix in
 * permissions.ts. Without permission it shows G7 inside the layout (and audits it).
 */
export function RouteGuard() {
  const user = useCurrentUser();
  const { pathname } = useLocation();
  const action = requiredPermission(pathname);
  if (action && !can(user, action)) return <AccessDeniedPage reason="denied" />;
  return <Outlet />;
}
