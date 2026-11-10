import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button, interactive } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { DEMO_ACCOUNTS, type SignInStep, signInWithSso } from './auth-service';
import { AuthLayout } from './AuthLayout';
import { LoginPreview } from './LoginPreview';

const REDIRECT_MS = 900;

/**
 * G2 · Simulated SSO redirect. In production this is the identity provider's page
 * (OIDC/SAML, docs/security.md); here it shows the step and returns with the account.
 */
export function SsoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const people = useDataStore((s) => s.people);

  const provider = params.get('provider') === 'google' ? 'google' : 'microsoft';
  const method = provider === 'google' ? 'sso_google' : 'sso_microsoft';
  const demoAccount = params.get('demo') === '1' ? params.get('account') : null;
  const providerName = t(`auth.methods.${method}`);
  const [redirecting, setRedirecting] = useState(true);

  const go = (result: SignInStep) => {
    if (result.status === 'locked') navigate('/login', { replace: true, state: { locked: true } });
    else if (result.status === 'mfa') navigate('/login/verify', { replace: true });
    else if (result.status === 'new_password') navigate('/login/new-password', { replace: true });
    else if (result.status === 'signed_in') navigate(result.path, { replace: true });
    else navigate('/login', { replace: true });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (demoAccount) go(signInWithSso(demoAccount, method, true));
      else setRedirecting(false);
    }, REDIRECT_MS);
    return () => clearTimeout(timer);
    // Runs once per visit: the redirect is simulated a single time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthLayout aside={<LoginPreview />}>
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-small text-on-surface">{t('auth.sso.title', { provider: providerName })}</h1>
        <p className="text-body-large text-on-surface-variant">{t('auth.sso.redirecting')}</p>
      </header>
      <InlineAlert tone="info">{t('auth.sso.simulated')}</InlineAlert>

      {redirecting ? (
        <div role="status" className="flex flex-col gap-3">
          <ProgressBar value={100} label={t('auth.sso.redirecting')} />
          <span className="sr-only">{t('auth.sso.redirecting')}</span>
        </div>
      ) : (
        <section aria-labelledby="sso-accounts" className="flex flex-col gap-3">
          <h2 id="sso-accounts" className="text-title-medium text-on-surface">
            {t('auth.sso.chooseAccount')}
          </h2>
          <ul className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map(({ personId }) => {
              const person = people.find((p) => p.id === personId);
              if (!person) return null;
              return (
                <li key={personId}>
                  <button
                    type="button"
                    onClick={() => go(signInWithSso(personId, method, false))}
                    className={cn(
                      'flex w-full min-w-0 items-center gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-3 text-left hover:border-outline',
                      interactive,
                    )}
                  >
                    <Avatar name={person.name} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-label-large text-on-surface">
                        {t('auth.sso.continueAs', { name: person.name })}
                      </span>
                      <span className="truncate text-body-small text-on-surface-variant">{person.email}</span>
                    </span>
                    <Icon name="chevron_right" className="text-on-surface-variant" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Button asChild variant="text" leadingIcon="arrow_back" className="w-fit -ml-3">
        <Link to="/login">{t('auth.sso.back')}</Link>
      </Button>
    </AuthLayout>
  );
}
