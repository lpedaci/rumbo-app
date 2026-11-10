import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { recordAccessDenied } from '@/features/auth/auth-service';
import { homePath } from '@/lib/permissions';
import { useCurrentUser } from '@/store/session-store';

/**
 * G7 · Access not allowed (inside the layout) or page not found.
 * A denied attempt is recorded in the audit log once per visit (CLAUDE.md F0).
 */
export function AccessDeniedPage({ reason }: { reason: 'denied' | 'not_found' }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { pathname } = useLocation();
  const recorded = useRef<string | null>(null);

  useEffect(() => {
    if (reason === 'denied' && recorded.current !== pathname) {
      recorded.current = pathname;
      recordAccessDenied(pathname);
    }
  }, [reason, pathname]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 py-10">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
        <Icon name={reason === 'denied' ? 'lock' : 'search'} size={24} />
      </span>
      <h1 className="text-headline-small text-on-surface">
        {reason === 'denied' ? t('forbidden.title') : t('notFound.title')}
      </h1>
      <p className="text-body-large text-on-surface-variant">
        {reason === 'denied' ? t('forbidden.body') : t('notFound.body')}
      </p>
      <Button asChild leadingIcon="home">
        <Link to={homePath(user)}>{user ? t('forbidden.backHome') : t('notFound.backHome')}</Link>
      </Button>
    </div>
  );
}
