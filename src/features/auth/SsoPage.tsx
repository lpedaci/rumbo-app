import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { DEMO_ACCOUNTS, findDemoPerson, type SignInStep, signInWithSso } from './auth-service';
import { AuthLayout } from './AuthLayout';

/**
 * G2 · Neutral, clearly labelled simulation of the SSO redirect (CLAUDE.md F0).
 * It never imitates the Microsoft or Google sign-in pages (a copy of those pages
 * would work like a phishing page, even in a demo). In production this step is the
 * identity provider's page, branded by Nortia (docs/security.md).
 */
export function SsoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const provider = params.get('provider') === 'google' ? 'google' : 'microsoft';
  const method = provider === 'google' ? 'sso_google' : 'sso_microsoft';
  const providerName = t(`auth.methods.${method}`);
  const preselected = findDemoPerson(params.get('account') ?? '');
  const demo = params.get('demo') === '1' && Boolean(preselected);
  const [accountId, setAccountId] = useState(preselected?.id ?? DEMO_ACCOUNTS[0]!.personId);

  const go = (result: SignInStep) => {
    if (result.status === 'locked') navigate('/login', { replace: true, state: { locked: true } });
    else if (result.status === 'mfa') navigate('/login/verify', { replace: true });
    else if (result.status === 'new_password') navigate('/login/new-password', { replace: true });
    else if (result.status === 'signed_in') navigate(result.path, { replace: true });
    else navigate('/login', { replace: true });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    go(signInWithSso(accountId, method, demo));
  };

  return (
    <AuthLayout>
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-small text-on-surface">{t('auth.sso.title', { provider: providerName })}</h1>
      </header>

      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-outline bg-surface-container p-5">
        <span className="flex size-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
          <Icon name="open_in_new" />
        </span>
        <p className="text-body-large text-on-surface">{t('auth.sso.simulation', { provider: providerName })}</p>
        <p className="text-body-medium text-on-surface-variant">{t('auth.sso.branding')}</p>
      </div>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {preselected ? (
          <p className="flex min-w-0 items-center gap-3 text-body-medium text-on-surface">
            <Avatar name={preselected.name} size="sm" />
            <span className="min-w-0 truncate">
              {preselected.name} · {preselected.email}
            </span>
          </p>
        ) : (
          <RadioGroup
            legend={t('auth.sso.accountLegend')}
            helperText={t('auth.sso.accountHelp')}
            name="demo-account"
            options={DEMO_ACCOUNTS.map(({ personId, role }) => {
              const person = findDemoPerson(personId);
              return { value: personId, label: `${person?.name ?? ''}, ${t(`rolesInline.${role}`)}`, description: person?.email };
            })}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
        )}
        <Button type="submit" fullWidth size="m" className="md:h-12" trailingIcon="arrow_forward">
          {t('auth.sso.continue')}
        </Button>
      </form>

      <Button asChild variant="text" leadingIcon="arrow_back" className="w-fit -ml-3">
        <Link to="/login">{t('auth.sso.back')}</Link>
      </Button>
    </AuthLayout>
  );
}
