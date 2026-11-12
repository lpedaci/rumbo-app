import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormFooter } from '@/components/ui/FormFooter';
import { Icon } from '@/components/ui/Icon';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { TextArea } from '@/components/ui/TextArea';
import { toast } from '@/components/ui/toast-store';
import { DEMO_TODAY, demoNow, formatDate } from '@/lib/dates';
import { PRIVACY_DEADLINES } from '@/app/legal';
import { consentOf, dueDateFor, nextPrivacyRequestId } from '@/lib/privacy';
import { issuesByPath, maskPhone } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { PrivacyRequestType, SensitiveField } from '@/types/domain';
import { MaskedValue } from './MaskedValue';
import { PrivacyRequestRow } from './PrivacyRequestRow';
import { EmailText } from '@/components/ui/EmailText';

const TYPES: PrivacyRequestType[] = ['access', 'rectification', 'deletion'];
const requestSchema = z.object({
  type: z.enum(['access', 'rectification', 'deletion'], { error: 'privacy.mine.typeRequired' }),
  detail: z.string().trim().min(10, 'privacy.mine.detailRequired').max(500, 'privacy.mine.detailMax'),
});

/**
 * G10 · My privacy (F10): the notice accepted (version and date) and the full text on demand,
 * the personal data Rumbo keeps about the person (identifiers masked), and their requests to
 * access, correct or delete it (Ley 25.326), with the legal deadline and HR's answer.
 */
export function MyPrivacyPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const people = useDataStore((s) => s.people);
  const consents = useDataStore((s) => s.consents);
  const policy = useDataStore((s) => s.securityPolicy);
  const all = useDataStore((s) => s.privacyRequests);
  const [showNotice, setShowNotice] = useState(false);
  const [type, setType] = useState('');
  const [detail, setDetail] = useState('');
  const [tried, setTried] = useState(false);

  const person = people.find((p) => p.id === user?.personId);
  if (!user || !person) return null;
  const consent = consentOf(consents, person.id);
  const mine = all.filter((r) => r.personId === person.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const issues = tried ? issuesByPath(requestSchema.safeParse({ type, detail })) : {};
  const steps = t('privacy.steps', {
    returnObjects: true,
    journeyYears: policy.retentionJourneyYears,
    selfReviewYears: policy.retentionSelfReviewYears,
  }) as { title: string; items: string[] }[];
  const manager = people.find((p) => p.id === person.managerId);

  const send = () => {
    setTried(true);
    if (!requestSchema.safeParse({ type, detail }).success) return;
    const id = nextPrivacyRequestId(all);
    useDataStore.getState().addPrivacyRequest({
      id,
      personId: person.id,
      type: type as PrivacyRequestType,
      detail: detail.trim(),
      createdAt: demoNow(),
      dueAt: dueDateFor(type as PrivacyRequestType, DEMO_TODAY),
      status: 'new',
    });
    setType('');
    setDetail('');
    setTried(false);
    toast.success(t('privacy.mine.sent', { id }));
  };

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t('privacy.mine.fields.name'), value: person.name },
    { label: t('privacy.mine.fields.email'), value: <EmailText email={person.email} /> },
    { label: t('privacy.mine.fields.jobTitle'), value: person.jobTitle },
    { label: t('privacy.mine.fields.area'), value: person.area },
    ...(manager ? [{ label: t('privacy.mine.fields.manager'), value: manager.name }] : []),
    ...(person.employeeId ? [{ label: t('privacy.mine.fields.employeeId'), value: person.employeeId }] : []),
    ...(person.mobile ? [{ label: t('privacy.mine.fields.mobile'), value: maskPhone(person.mobile) }] : []),
    ...(['dni', 'cuil', 'bankAccount'] as SensitiveField[])
      .filter((f) => person[f])
      .map((f) => ({
        label: t(`privacy.mine.fields.${f}`),
        value: <MaskedValue personId={person.id} personName={person.name} field={f} value={person[f]!} />,
      })),
  ];

  return (
    <>
      <PageHeader title={t('privacy.mine.title')} description={t('privacy.mine.description')} />

      <div className="flex flex-col gap-(--space-bento-gap)">
        <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-2">
          <Card title={t('privacy.mine.noticeCard')}>
            {consent && (
              <p className="flex items-start gap-2 text-body-medium text-on-surface">
                <Icon name="check_circle" size={20} className="mt-px shrink-0 text-success" />
                {t('privacy.mine.acceptedOn', {
                  version: consent.noticeVersion,
                  date: formatDate(consent.acceptedAt.slice(0, 10)),
                })}
              </p>
            )}
            <Button
              variant="outlined"
              leadingIcon={showNotice ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              aria-expanded={showNotice}
              aria-controls="privacy-notice"
              onClick={() => setShowNotice((v) => !v)}
              className="w-fit"
            >
              {showNotice ? t('privacy.mine.hideNotice') : t('privacy.mine.showNotice')}
            </Button>
            {showNotice && (
              <div id="privacy-notice" className="flex flex-col gap-5 border-t border-outline-variant pt-4">
                {steps.map((step) => (
                  <section key={step.title} className="flex flex-col gap-2">
                    <h3 className="text-title-small text-on-surface">{step.title}</h3>
                    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-medium text-on-surface">
                      {step.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </Card>

          <Card title={t('privacy.mine.dataCard')} description={t('privacy.mine.dataHelp')}>
            <dl className="flex flex-col">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex min-w-0 flex-col gap-1 border-b border-outline-variant py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <dt className="shrink-0 text-body-medium text-on-surface-variant">{row.label}</dt>
                  <dd className="min-w-0 text-body-medium text-on-surface sm:text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <Card title={t('privacy.mine.requestsCard')}>
          {mine.length === 0 ? (
            <p className="text-body-medium text-on-surface-variant">{t('privacy.mine.requestsEmpty')}</p>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {mine.map((r) => (
                <PrivacyRequestRow key={r.id} request={r} showResponse />
              ))}
            </ul>
          )}

          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
            className="flex flex-col gap-5 border-t border-outline-variant pt-5"
          >
            <h3 className="text-title-medium text-on-surface">{t('privacy.mine.formTitle')}</h3>
            <RadioGroup
              name="privacy-type"
              legend={t('privacy.mine.type')}
              required
              helperText={t('privacy.mine.typeHelp')}
              error={issues.type ? t(issues.type) : undefined}
              value={type}
              onChange={(event) => setType(event.target.value)}
              options={TYPES.map((value) => ({
                value,
                label: t(`privacy.mine.typeOptions.${value}.label`),
                description: t(`privacy.mine.typeOptions.${value}.help`, { days: PRIVACY_DEADLINES[value].days }),
              }))}
            />
            <TextArea
              id="privacy-detail"
              label={t('privacy.mine.detail')}
              required
              helperText={t('privacy.mine.detailHelp')}
              error={issues.detail ? t(issues.detail) : undefined}
              value={detail}
              rows={3}
              onChange={(event) => setDetail(event.target.value)}
            />
            <FormFooter noteIcon="schedule" note={t('privacy.mine.note')}>
              <Button type="submit" leadingIcon="send">
                {t('privacy.mine.send')}
              </Button>
            </FormFooter>
          </form>
        </Card>
      </div>
    </>
  );
}
