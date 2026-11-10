import { Navigate } from 'react-router';
import { nextCheckin } from '@/lib/journey';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';

/** "Mi check-in" in the navigation opens the hire's next check-in (N3). */
export function NextCheckinRedirect() {
  const user = useCurrentUser();
  const hire = useDataStore((s) => s.hires.find((h) => h.personId === user?.personId));
  const stage = (hire && nextCheckin(hire)?.stage) ?? 'day30';
  return <Navigate to={`/me/checkin/${stage}`} replace />;
}
