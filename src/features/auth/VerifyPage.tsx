import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { TextField } from '@/components/ui/TextField';
import { addDays, DEMO_TODAY, formatDate } from '@/lib/dates';
import { digitsMask } from '@/lib/input-masks';
import { useFieldError } from '@/lib/use-field-error';
import { otpField } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import {
  cancelSignIn,
  DEMO_BACKUP_CODE,
  DEMO_MFA_CODE,
  findDemoPerson,
  REMEMBER_DEVICE_DAYS,
  verifyMfa,
} from './auth-service';
import { AuthLayout } from './AuthLayout';
import { LoginPreview } from './LoginPreview';

const appSchema = z.object({ code: otpField, remember: z.boolean() });
const backupSchema = z.object({
  code: z.string().trim().min(1, 'validation.required').regex(/^\d{8}$/, 'auth.mfa.invalidBackup'),
  remember: z.boolean(),
});
type MfaValues = z.infer<typeof appSchema>;

const appMask = digitsMask(6);
const backupMask = digitsMask(8);

/**
 * G3 · Two-step verification. One field that accepts pasting (WCAG 3.3.8),
 * code shown on screen in the demo and prefilled in the one-click flow.
 */
export function VerifyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pending = useSessionStore((s) => s.pending);
  const mfaReset = useDataStore((s) => (pending ? s.accountFlags[pending.personId]?.mfaReset : false));
  const fieldError = useFieldError();
  const [backup, setBackup] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<MfaValues>({
    resolver: zodResolver(backup ? backupSchema : appSchema),
    mode: 'onTouched',
    defaultValues: { code: pending?.demo ? DEMO_MFA_CODE : '', remember: false },
  });

  if (!pending || pending.step !== 'mfa') return <Navigate to="/login" replace />;
  const person = findDemoPerson(pending.personId);

  const onSubmit = async ({ code, remember }: MfaValues) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const result = verifyMfa(code, { backup, remember });
    if (result.status === 'invalid') {
      setError('code', { message: backup ? 'auth.mfa.invalidBackup' : 'auth.mfa.invalid' }, { shouldFocus: true });
      return;
    }
    navigate(result.path, { replace: true });
  };

  const toggleBackup = () => {
    setBackup((v) => !v);
    setValue('code', '');
    clearErrors('code');
  };

  return (
    <AuthLayout aside={<LoginPreview />}>
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-small text-on-surface">{t('auth.mfa.title')}</h1>
        <p className="text-body-large text-on-surface-variant">{t('auth.mfa.subtitle')}</p>
        {person && <p className="text-body-medium text-on-surface-variant">{t('auth.mfa.signingAs', { name: person.name })}</p>}
      </header>

      {mfaReset && <InlineAlert tone="warning">{t('auth.mfa.relink')}</InlineAlert>}

      <InlineAlert tone="info">
        {backup
          ? t('auth.mfa.demoBackup', { code: DEMO_BACKUP_CODE })
          : t(pending.demo ? 'auth.mfa.demoCode' : 'auth.mfa.demoCodeManual', { code: DEMO_MFA_CODE })}
      </InlineAlert>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField
          key={backup ? 'backup' : 'app'}
          label={backup ? t('auth.mfa.backupLabel') : t('auth.mfa.codeLabel')}
          inputMode="numeric"
          autoComplete="one-time-code"
          mask={backup ? backupMask : appMask}
          helperText={backup ? t('auth.mfa.backupHelp') : t('auth.mfa.codeHelp')}
          error={fieldError(errors.code)}
          className="max-w-xs"
          {...register('code')}
        />
        <Checkbox
          label={t('auth.mfa.remember')}
          description={t('auth.mfa.rememberHelp', { date: formatDate(addDays(DEMO_TODAY, REMEMBER_DEVICE_DAYS)) })}
          {...register('remember')}
        />
        <Button type="submit" fullWidth size="m" className="md:h-12" loading={isSubmitting} loadingText={t('auth.login.submitting')}>
          {t('auth.mfa.submit')}
        </Button>
      </form>

      <div className="flex flex-col items-start gap-1 border-t border-outline-variant pt-4">
        <Button variant="text" className="-ml-3" onClick={toggleBackup}>
          {backup ? t('auth.mfa.useApp') : t('auth.mfa.useBackup')}
        </Button>
        <Button
          variant="text"
          className="-ml-3"
          onClick={() => {
            cancelSignIn();
            navigate('/login', { replace: true });
          }}
        >
          {t('auth.mfa.cancel')}
        </Button>
      </div>
    </AuthLayout>
  );
}
