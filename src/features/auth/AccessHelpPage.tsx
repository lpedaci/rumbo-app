import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { noSpacesMask } from '@/lib/input-masks';
import { useFieldError } from '@/lib/use-field-error';
import { emailField } from '@/lib/validation';
import type { AccessRequestReason } from '@/types/domain';
import { createAccessRequest, SIMULATED_ERROR_TRIGGER, switchRole } from './auth-service';
import { AuthLayout } from './AuthLayout';

const REASONS: AccessRequestReason[] = ['locked', 'forgot_password', 'mfa_issue', 'other'];

const schema = z.object({
  email: emailField,
  reason: z.enum(REASONS, 'accessHelp.reasonRequired'),
  comment: z.string().max(500),
});
type HelpValues = z.infer<typeof schema>;

const channels: { icon: IconName; key: string }[] = [
  { icon: 'support_agent', key: 'portal' },
  { icon: 'mail', key: 'email' },
  { icon: 'call', key: 'phone' },
  { icon: 'schedule', key: 'hours' },
];

/**
 * G4 · "¿Problemas para iniciar sesión?". No self-service: the request always goes to
 * IT, and the confirmation is identical whether the email exists or not (CLAUDE.md F0).
 */
export function AccessHelpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fieldError = useFieldError();
  const [requestId, setRequestId] = useState<string | null>(null);
  const [serverError, setServerError] = useState(false);
  const [failedOnce, setFailedOnce] = useState(false);
  const serverErrorRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HelpValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '', comment: '' },
  });

  useEffect(() => {
    if (serverError) serverErrorRef.current?.focus();
  }, [serverError]);

  useEffect(() => {
    if (requestId) confirmationRef.current?.focus();
  }, [requestId]);

  const onSubmit = async (values: HelpValues) => {
    setServerError(false);
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Demo of a server error (CLAUDE.md 2.10): only with "#error" in the comment, and only once.
    const simulateFailure = values.comment.includes(SIMULATED_ERROR_TRIGGER) && !failedOnce;
    try {
      setRequestId(createAccessRequest(values, simulateFailure));
    } catch {
      setFailedOnce(true);
      setServerError(true);
    }
  };

  const channelList = (
    <section aria-labelledby="help-channels" className="flex flex-col gap-3">
      <h2 id="help-channels" className="text-title-medium text-on-surface">
        {t('accessHelp.channelsTitle')}
      </h2>
      <ul className="flex flex-col gap-2">
        {channels.map(({ icon, key }) => (
          <li key={key} className="flex items-start gap-3 text-body-medium text-on-surface">
            <Icon name={icon} className="mt-px text-on-surface-variant" />
            <span className="min-w-0 break-words">{t(`accessHelp.${key}`)}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <AuthLayout
      aside={
        <div className="flex flex-col gap-6">
          {channelList}
          <InlineAlert tone="info" title={t('accessHelp.ssoTitle')}>
            {t('accessHelp.ssoBody')}
          </InlineAlert>
        </div>
      }
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-headline-small text-on-surface">{t('accessHelp.title')}</h1>
        <p className="text-body-large text-on-surface-variant">{t('accessHelp.intro')}</p>
      </header>

      <div className="flex flex-col gap-6 lg:hidden">
        <InlineAlert tone="info" title={t('accessHelp.ssoTitle')}>
          {t('accessHelp.ssoBody')}
        </InlineAlert>
        {channelList}
      </div>

      {requestId ? (
        <section aria-labelledby="help-confirmation" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container p-5">
            <Icon name="check_circle" size={24} filled className="text-success" />
            <h2 id="help-confirmation" ref={confirmationRef} tabIndex={-1} className="text-title-large text-on-surface focus:outline-none">
              {t('accessHelp.confirmTitle')}
            </h2>
            <p className="text-title-medium text-on-surface tabular-nums">{t('accessHelp.confirmNumber', { id: requestId })}</p>
            <p className="text-body-medium text-on-surface-variant">{t('accessHelp.confirmBody')}</p>
            <p className="text-body-medium text-on-surface-variant">{t('accessHelp.confirmKeep')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
            <Button
              leadingIcon="swap_horiz"
              onClick={() => {
                // Demo shortcut: sign in as Diego (IT) and open this request in the IT inbox.
                switchRole('it_admin');
                navigate(`/it/requests/${requestId}`);
              }}
            >
              {t('accessHelp.viewAsIt')}
            </Button>
            <Button asChild variant="outlined">
              <Link to="/login">{t('accessHelp.backToLogin')}</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="help-form" className="flex flex-col gap-4">
          <div>
            <h2 id="help-form" className="text-title-large text-on-surface">
              {t('accessHelp.formTitle')}
            </h2>
            <p className="text-body-medium text-on-surface-variant">{t('accessHelp.formIntro')}</p>
          </div>

          {serverError && (
            <InlineAlert
              ref={serverErrorRef}
              tone="error"
              live="alert"
              title={t('accessHelp.serverErrorTitle')}
              action={
                <Button variant="outlined" size="xs" leadingIcon="refresh" onClick={handleSubmit(onSubmit)}>
                  {t('accessHelp.retry')}
                </Button>
              }
            >
              {t('accessHelp.serverErrorBody')}
            </InlineAlert>
          )}

          <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <TextField
              label={t('auth.login.emailLabel')}
              type="email"
              autoComplete="email"
              required
              mask={noSpacesMask}
              helperText={t('auth.login.emailHelp')}
              error={fieldError(errors.email)}
              {...register('email')}
            />
            <RadioGroup
              legend={t('accessHelp.reasonLegend')}
              required
              helperText={t('accessHelp.reasonHelp')}
              error={fieldError(errors.reason)}
              options={REASONS.map((reason) => ({ value: reason, label: t(`accessHelp.reasons.${reason}`) }))}
              {...register('reason')}
            />
            <TextArea
              label={t('accessHelp.commentLabel')}
              optional
              helperText={t('accessHelp.commentHelp')}
              error={fieldError(errors.comment)}
              {...register('comment')}
            />
            <p className="flex items-start gap-2 text-body-small text-on-surface-variant">
              <Icon name="info" size={16} className="mt-px" />
              {t('accessHelp.demoTip')}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button asChild variant="outlined">
                <Link to="/login">{t('accessHelp.backToLogin')}</Link>
              </Button>
              <Button type="submit" loading={isSubmitting} loadingText={t('accessHelp.sending')}>
                {t('accessHelp.submit')}
              </Button>
            </div>
          </form>
        </section>
      )}
    </AuthLayout>
  );
}
