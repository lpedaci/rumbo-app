import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';

/** The journey of the signed-in new hire (scope "own" of hire:view). */
export function useOwnHire() {
  const user = useCurrentUser();
  return useDataStore((s) => s.hires.find((h) => h.personId === user?.personId));
}
