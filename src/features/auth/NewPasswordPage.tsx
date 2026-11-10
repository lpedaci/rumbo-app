import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { TextField } from '@/components/ui/TextField';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { checkPassword, completePasswordChange, type PasswordChecks, passwordStrength } from './auth-service';
import { AuthLayout } from './AuthLayout';

const RULES: (keyof PasswordChecks)[] = ['minLength', 'uppercase', 'lowercase', 'number', 'symbol', 'notPrevious'];

/**
 * New password after IT forced a change (CLAUDE.md F0). The policy is visible and
 * checked live; one field with "show password" instead of asking twice (WCAG 3.3.7).
 */
export function NewPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pending = useSessionStore((s) => s.pending);
  const minLength = useDataStore((s) => s.securityPolicy.passwordMinLength);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!pending || pending.step !== 'new_password') return <Navigate to="/login" replace />;

  const checks = checkPassword(password, minLength);
  const allMet = RULES.every((rule) => checks[rule]);
  const strength = passwordStrength(password);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!allMet) return;
    const result = completePasswordChange(password);
    if (result.status === 'mfa') navigate('/login/verify', { replace: true });
    else if (result.status === 'signed_in') navigate(result.path, { replace: true });
  };

  return (
    <AuthLayout>
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-small text-on-surface">{t('auth.newPassword.title')}</h1>
        <p className="text-body-large text-on-surface-variant">{t('auth.newPassword.subtitle')}</p>
      </header>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label={t('auth.newPassword.label')}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText={t('auth.newPassword.help')}
          error={submitted && !allMet ? t('auth.newPassword.invalid') : undefined}
          aria-describedby="password-rules"
          trailing={
            <IconButton
              icon={show ? 'visibility_off' : 'visibility'}
              label={show ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
              size="xs"
              onClick={() => setShow((v) => !v)}
            />
          }
        />

        <div id="password-rules" className="flex flex-col gap-2 rounded-md bg-surface-container p-4">
          <p className="text-title-small text-on-surface">{t('auth.newPassword.rulesTitle')}</p>
          <ul className="flex flex-col gap-1.5">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-center gap-2 text-body-medium text-on-surface">
                <Icon
                  name={checks[rule] ? 'check_circle' : 'radio_button_unchecked'}
                  filled={checks[rule]}
                  className={checks[rule] ? 'text-success' : 'text-on-surface-variant'}
                />
                <span>
                  {t(`auth.newPassword.rules.${rule}`, { min: minLength })}
                  <span className="sr-only">
                    {' '}
                    ({checks[rule] ? t('auth.newPassword.met') : t('auth.newPassword.notMet')})
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex flex-col gap-1.5" aria-live="polite">
            <div className="grid grid-cols-4 gap-1" aria-hidden>
              {[1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={cn(
                    'h-1.5 rounded-full transition-colors duration-200',
                    strength >= level ? (strength <= 1 ? 'bg-error' : strength === 2 ? 'bg-warning' : 'bg-success') : 'bg-outline-variant',
                  )}
                />
              ))}
            </div>
            <p className="text-body-small text-on-surface-variant">
              {t('auth.newPassword.strength', { level: t(`auth.newPassword.levels.${strength}`) })}
            </p>
          </div>
        </div>

        <Button type="submit" fullWidth size="m" className="md:h-12">
          {t('auth.newPassword.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
