import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { interactive } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { DEMO_ACCOUNTS } from './auth-service';

/**
 * One-click demo access (CLAUDE.md F0): each card goes through the full flow
 * (SSO redirect and MFA) with the verification code prefilled.
 */
export function DemoAccess({ headingLevel: Heading = 'h2' }: { headingLevel?: 'h2' | 'h3' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const people = useDataStore((state) => state.people);

  return (
    <section aria-labelledby="demo-access-title" className="flex flex-col gap-3">
      <div>
        <Heading id="demo-access-title" className="text-title-medium text-on-surface">
          {t('auth.login.demo.title')}
        </Heading>
        <p className="text-body-medium text-on-surface-variant">{t('auth.login.demo.subtitle')}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {DEMO_ACCOUNTS.map(({ personId, role }) => {
          const person = people.find((p) => p.id === personId);
          if (!person) return null;
          const firstName = person.name.split(' ')[0]!;
          return (
            <li key={personId}>
              <button
                type="button"
                onClick={() => navigate(`/login/sso?provider=microsoft&account=${personId}&demo=1`)}
                className={cn(
                  'flex w-full min-w-0 items-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-left',
                  interactive,
                  'hover:border-outline',
                )}
              >
                <Avatar name={person.name} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-label-large text-on-surface">
                    {t('auth.login.demo.enterAs', { name: firstName, role: t(`rolesInline.${role}`) })}
                  </span>
                  <span className="text-body-small text-on-surface-variant">
                    {t(`auth.login.demo.description.${role}`)}
                  </span>
                </span>
                <Icon name="chevron_right" className="text-on-surface-variant" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
