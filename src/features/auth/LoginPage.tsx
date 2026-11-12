import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { TextField } from '@/components/ui/TextField';
import { noSpacesMask } from '@/lib/input-masks';
import { homePath } from '@/lib/permissions';
import { useFieldError } from '@/lib/use-field-error';
import { emailField, requiredText } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { findDemoPerson, personIdForDemoKey, signInWithPassword } from './auth-service';
import type { AccessHelpState } from './AccessHelpPage';
import { AuthLayout } from './AuthLayout';
import { LoginShowcase } from './LoginShowcase';
import { SsoButton } from './SsoButton';

const schema = z.object({ email: emailField, password: requiredText });
type LoginValues = z.infer<typeof schema>;

type FormProblem = { kind: 'invalid'; failedCount: number } | { kind: 'locked' } | null;

/**
 * G1 · Login, clean like a real Nortia sign-in (CLAUDE.md F0): SSO first with the
 * official provider logos, email and password second. With a journey chosen on the
 * demo start (`?demo=carla`), SSO signs in with that person's fictitious account and the
 * email form comes prefilled; there is no extra notice on the screen (D-66).
 */
export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const session = useSessionStore((s) => s.session);
  const lastLogout = useSessionStore((s) => s.lastLogout);
  const lockoutAttempts = useDataStore((s) => s.securityPolicy.lockoutAttempts);
  const fieldError = useFieldError();

  const preselectedId = personIdForDemoKey(params.get('demo'));
  const preselected = preselectedId ? findDemoPerson(preselectedId) : undefined;

  const lockedFromSso = (location.state as { locked?: boolean } | null)?.locked === true;
  const [showEmailForm, setShowEmailForm] = useState(lockedFromSso);
  const [problem, setProblem] = useState<FormProblem>(lockedFromSso ? { kind: 'locked' } : null);
  const [showPassword, setShowPassword] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    // A journey chosen on the demo start prefills that person's fictitious work email (D-66).
    defaultValues: { email: preselected?.email ?? '', password: '' },
  });

  useEffect(() => {
    if (problem) alertRef.current?.focus();
  }, [problem]);

  if (session) return <Navigate to={homePath(session)} replace />;

  // WCAG 3.3.7 (RNF-045): G4 receives the email already typed here, and the reason when the
  // account was just locked, so nothing is asked twice in the same process (D-132).
  const helpState = (): AccessHelpState => ({
    email: getValues('email')?.trim() || preselected?.email || undefined,
    reason: problem?.kind === 'locked' ? 'locked' : undefined,
  });

  // Read when the link is used: the form does not re-render on every keystroke
  const goToHelp = (event: React.MouseEvent) => {
    event.preventDefault();
    navigate('/access-help', { state: helpState() });
  };

  const ssoPath = (provider: 'microsoft' | 'google') =>
    `/login/sso?provider=${provider}${preselected ? `&account=${preselected.id}&demo=1` : ''}`;

  const onSubmit = async ({ email, password }: LoginValues) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const result = signInWithPassword(email, password);
    switch (result.status) {
      case 'invalid':
        // The password is cleared for security; the email is kept (CLAUDE.md 2.10).
        resetField('password');
        setProblem({ kind: 'invalid', failedCount: result.failedCount });
        return;
      case 'locked':
        resetField('password');
        setProblem({ kind: 'locked' });
        return;
      case 'new_password':
        navigate('/login/new-password');
        return;
      case 'mfa':
        navigate('/login/verify');
        return;
      case 'signed_in':
        navigate(result.path, { replace: true });
    }
  };

  const logoutMessage =
    lastLogout === 'manual' || lastLogout === 'expired' ? t(`auth.login.logout.${lastLogout}`) : null;

  return (
    <AuthLayout showcase={<LoginShowcase />}>
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-small text-on-surface">{t('auth.login.title')}</h1>
        <p className="text-body-large text-on-surface-variant">{t('auth.login.subtitle')}</p>
      </header>

      {logoutMessage && (
        <InlineAlert tone={lastLogout === 'expired' ? 'warning' : 'success'} live="status">
          {logoutMessage}
        </InlineAlert>
      )}

      <section aria-label={t('auth.login.title')} className="flex flex-col gap-3">
        <SsoButton provider="microsoft" label={t('auth.login.ssoMicrosoft')} onClick={() => navigate(ssoPath('microsoft'))} />
        <SsoButton provider="google" label={t('auth.login.ssoGoogle')} onClick={() => navigate(ssoPath('google'))} />

        <div className="flex items-center gap-3 text-body-small text-on-surface-variant" aria-hidden>
          <span className="h-px flex-1 bg-outline-variant" />
          {t('auth.login.or')}
          <span className="h-px flex-1 bg-outline-variant" />
        </div>

        {!showEmailForm ? (
          <Button
            variant="text"
            fullWidth
            leadingIcon="mail"
            aria-expanded={false}
            aria-controls="email-login"
            onClick={() => {
              setShowEmailForm(true);
              setTimeout(() => setFocus('email'), 0);
            }}
          >
            {t('auth.login.emailToggle')}
          </Button>
        ) : (
          <form id="email-login" noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {problem?.kind === 'invalid' && (
              <InlineAlert ref={alertRef} tone="error" live="alert">
                {t('auth.login.invalid')}
                {problem.failedCount >= 3 && (
                  <span className="mt-1 block">{t('auth.login.attemptsWarning', { max: lockoutAttempts })}</span>
                )}
              </InlineAlert>
            )}
            {problem?.kind === 'locked' && (
              <InlineAlert
                ref={alertRef}
                tone="error"
                live="alert"
                title={t('auth.login.lockedTitle')}
                action={
                  <Link
                    to="/access-help"
                    onClick={goToHelp}
                    className="text-label-large text-on-error-container underline underline-offset-4"
                  >
                    {t('auth.login.troubleLink')}
                  </Link>
                }
              >
                {t('auth.login.lockedBody')}
              </InlineAlert>
            )}
            <TextField
              label={t('auth.login.emailLabel')}
              type="email"
              autoComplete="email"
              mask={noSpacesMask}
              helperText={t('auth.login.emailHelp')}
              error={fieldError(errors.email)}
              {...register('email')}
            />
            <TextField
              label={t('auth.login.passwordLabel')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              helperText={t('auth.login.passwordHelp')}
              error={fieldError(errors.password)}
              trailing={
                <IconButton
                  icon={showPassword ? 'visibility_off' : 'visibility'}
                  label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                  size="xs"
                  onClick={() => setShowPassword((v) => !v)}
                />
              }
              {...register('password')}
            />
            <Button
              type="submit"
              variant={preselected ? 'tonal' : 'filled'}
              fullWidth
              size="m"
              className="md:h-10 md:px-4 md:text-label-large"
              loading={isSubmitting}
              loadingText={t('auth.login.submitting')}
            >
              {t('auth.login.submit')}
            </Button>
          </form>
        )}
      </section>

      {/* Same place on every access screen (WCAG 3.2.6, consistent help). */}
      <div className="flex flex-col gap-3 border-t border-outline-variant pt-4">
        <Button asChild variant="text" className="w-fit -ml-3">
          <Link to="/access-help" onClick={goToHelp}>
            {t('auth.login.troubleLink')}
          </Link>
        </Button>
        <p role="note" className="text-body-small text-on-surface-variant">
          {t('app.demoNotice')}
        </p>
      </div>
    </AuthLayout>
  );
}
