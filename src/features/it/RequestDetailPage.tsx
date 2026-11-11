import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { FormFooter } from '@/components/ui/FormFooter';
import { Icon, type IconName } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { StatusPill } from '@/components/ui/StatusPill';
import { TextArea } from '@/components/ui/TextArea';
import { toast } from '@/components/ui/toast-store';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { attemptsFor, type IdentityCheck, isOpen, requester, suggestedAction } from '@/lib/access';
import { formatDateTime } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { maskPhone } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { AccessResolutionAction } from '@/types/domain';
import { RequestStatusPill } from './RequestStatusPill';

type RestoreAction = Exclude<AccessResolutionAction, 'reject'>;
const ACTIONS: RestoreAction[] = ['unlock', 'force_password_reset', 'reset_mfa'];
const ACTION_ICON: Record<AccessResolutionAction, IconName> = {
  unlock: 'lock_open',
  force_password_reset: 'password',
  reset_mfa: 'key',
  reject: 'block',
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-4 border-b border-outline-variant py-3 last:border-b-0">
      <dt className="shrink-0 text-body-medium text-on-surface-variant">{label}</dt>
      <dd className="min-w-0 text-right text-body-medium break-words text-on-surface">{value}</dd>
    </div>
  );
}

/**
 * S2 · Access request detail (CLAUDE.md F6) in two steps: first IT verifies who is asking
 * (call to the registered mobile or validation with the direct manager), then restores the
 * access (unlock, force a new password or reset MFA) or rejects it with a reason. Nothing is
 * restored without a verified identity. Every step goes to the audit log.
 */
export function RequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const user = useCurrentUser();
  const requests = useDataStore((s) => s.accessRequests);
  const people = useDataStore((s) => s.people);
  const attempts = useDataStore((s) => s.authAttempts);
  const flags = useDataStore((s) => s.accountFlags);
  const auditEvents = useDataStore((s) => s.auditEvents);
  const store = useDataStore.getState;

  const request = requests.find((r) => r.id === id);
  const [check, setCheck] = useState<IdentityCheck | undefined>();
  const [checkError, setCheckError] = useState(false);
  const [action, setAction] = useState<RestoreAction | undefined>(request ? suggestedAction(request) : undefined);
  const [note, setNote] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectError, setRejectError] = useState(false);

  if (!request || !user) return <AccessDeniedPage reason="not_found" />;
  const canResolve = can(user, 'access_request:resolve');
  const person = requester(request, people);
  const manager = person?.managerId ? people.find((p) => p.id === person.managerId) : undefined;
  const account = attemptsFor(request.email, attempts);
  const accountFlags = person ? flags[person.id] : undefined;
  const open = isOpen(request);
  const nameOf = (actorId: string) =>
    actorId === 'anonymous' ? t('it.history.anonymous') : (people.find((p) => p.id === actorId)?.name ?? actorId);
  const history = auditEvents
    .filter((e) => e.resource === request.id || e.resource?.toLowerCase() === request.email.toLowerCase())
    .sort((a, b) => a.at.localeCompare(b.at));

  // Only the checks that the person's record makes possible (D-90): never a number given in the request.
  const checkOptions = [
    ...(person?.mobile
      ? [
          {
            value: 'callback',
            label: t('it.detail.checks.callback'),
            description: t('it.detail.checks.callbackHelp', { mobile: maskPhone(person.mobile) }),
          },
        ]
      : []),
    ...(manager
      ? [
          {
            value: 'manager',
            label: t('it.detail.checks.manager'),
            description: t('it.detail.checks.managerHelp', { name: manager.name }),
          },
        ]
      : []),
  ];

  const confirmIdentity = () => {
    if (!check) {
      setCheckError(true);
      return;
    }
    if (request.status === 'new') store().startVerification(request.id, user.personId);
    store().verifyIdentity(request.id, check, user.personId);
    toast.success(t('it.detail.verifiedToast'));
  };

  const restore = () => {
    if (!action) return;
    store().resolveAccessRequest(request.id, action, note.trim(), user.personId);
    toast.success(t('it.detail.resolvedToast'));
  };

  const reject = () => {
    if (!rejectNote.trim()) {
      setRejectError(true);
      return;
    }
    store().rejectAccessRequest(request.id, rejectNote.trim(), user.personId);
    setRejecting(false);
    toast.success(t('it.detail.rejectedToast'));
  };

  return (
    <>
      <nav aria-label={t('hires.detail.breadcrumb')} className="mb-4 md:mb-6">
        <Link
          to="/it/requests"
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('it.detail.back')}
        </Link>
      </nav>

      <header className="mb-(--space-section) flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 items-center rounded-full border border-outline-variant px-2.5 text-label-medium text-on-surface tabular-nums">
            {request.id}
          </span>
          <RequestStatusPill status={request.status} />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-small text-balance text-on-surface">
            {t(`accessHelp.reasons.${request.reason}`)}
          </h1>
          <p className="text-body-large text-on-surface-variant">
            {t('it.detail.subtitle', { name: person?.name ?? request.email, date: formatDateTime(request.createdAt) })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 flex-col gap-(--space-bento-gap)">
          {/* Step 1: who is asking */}
          <Card
            title={t('it.detail.step1')}
            description={t('it.detail.step1Help')}
            action={
              request.identityVerified ? (
                <StatusPill tone="success" icon="verified_user" label={t('it.detail.verified')} />
              ) : undefined
            }
          >
            {request.identityVerified ? (
              <p className="flex items-start gap-2 text-body-medium text-on-surface">
                <Icon name="check_circle" size={20} className="shrink-0 text-success" />
                {t('it.detail.verifiedBody', {
                  method:
                    history.find((e) => e.action === 'access_request.verify_identity')?.detail ??
                    t('it.detail.verifiedUnknown'),
                })}
              </p>
            ) : open && canResolve ? (
              <div className="flex flex-col gap-4">
                {checkOptions.length === 0 && (
                  <InlineAlert
                    tone="warning"
                    title={person ? t('it.detail.noCheckTitle') : t('it.detail.noPersonTitle')}
                  >
                    {t('it.detail.noPersonBody')}
                  </InlineAlert>
                )}
                {checkOptions.length > 0 && (
                  <RadioGroup
                    name="identity-check"
                    legend={t('it.detail.checkLegend')}
                    value={check}
                    onChange={(e) => {
                      setCheck(e.target.value as IdentityCheck);
                      setCheckError(false);
                    }}
                    error={checkError ? t('it.detail.checkRequired') : undefined}
                    options={checkOptions}
                  />
                )}
                {checkOptions.length > 0 && (
                  <FormFooter note={t('it.detail.checkNote')} noteIcon="info">
                    <Button leadingIcon="verified_user" onClick={confirmIdentity}>
                      {t('it.detail.confirmIdentity')}
                    </Button>
                  </FormFooter>
                )}
              </div>
            ) : (
              <p className="text-body-medium text-on-surface-variant">{t('it.detail.notVerified')}</p>
            )}
          </Card>

          {/* Step 2: restore the access, or the outcome when the request is closed */}
          <Card title={open ? t('it.detail.step2') : t('it.detail.outcome')}>
            {request.resolution ? (
              <div className="flex flex-col gap-3">
                <p className="flex items-start gap-2 text-body-large text-on-surface">
                  <Icon
                    name={ACTION_ICON[request.resolution.action]}
                    size={20}
                    className={request.resolution.action === 'reject' ? 'mt-0.5 text-error' : 'mt-0.5 text-success'}
                  />
                  {t(`it.outcomes.${request.resolution.action}`)}
                </p>
                <p className="text-body-small text-on-surface-variant tabular-nums">
                  {t('it.detail.resolvedBy', {
                    name: nameOf(request.resolution.by),
                    date: formatDateTime(request.resolution.at),
                  })}
                </p>
                {request.resolution.note && (
                  <p className="rounded-md bg-surface-container p-3 text-body-medium text-on-surface">
                    {request.resolution.note}
                  </p>
                )}
              </div>
            ) : canResolve ? (
              <div className="flex flex-col gap-4">
                {!request.identityVerified && (
                  <p className="flex items-start gap-2 rounded-md bg-warning-container p-3 text-body-medium text-on-warning-container">
                    <Icon name="lock" size={20} className="shrink-0 text-warning" />
                    {t('it.detail.lockedStep')}
                  </p>
                )}
                <RadioGroup
                  name="restore-action"
                  legend={t('it.detail.actionLegend')}
                  value={action}
                  disabled={!request.identityVerified}
                  onChange={(e) => setAction(e.target.value as RestoreAction)}
                  options={ACTIONS.map((a) => ({
                    value: a,
                    label:
                      a === suggestedAction(request)
                        ? t('it.detail.suggested', { action: t(`it.actions.${a}`) })
                        : t(`it.actions.${a}`),
                    description: t(`it.actionHelp.${a}`),
                  }))}
                />
                <TextArea
                  label={t('it.detail.note')}
                  helperText={t('it.detail.noteHelp')}
                  optional
                  rows={2}
                  value={note}
                  disabled={!request.identityVerified}
                  onChange={(e) => setNote(e.target.value)}
                />
                <FormFooter>
                  <Button variant="outlined" leadingIcon="block" onClick={() => setRejecting(true)}>
                    {t('it.detail.reject')}
                  </Button>
                  <Button
                    leadingIcon="check"
                    disabledReason={request.identityVerified ? undefined : t('it.detail.lockedStep')}
                    onClick={restore}
                  >
                    {t('it.detail.apply')}
                  </Button>
                </FormFooter>
              </div>
            ) : null}
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-(--space-bento-gap)">
          <Card title={t('it.detail.request')}>
            <div className="flex min-w-0 items-center gap-3">
              {person ? (
                <Avatar name={person.name} role={person.role} size="lg" />
              ) : (
                <span
                  aria-hidden
                  className="flex size-12 items-center justify-center rounded-full bg-surface-container"
                >
                  <Icon name="person" className="text-on-surface-variant" />
                </span>
              )}
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-title-medium text-on-surface">
                  {person?.name ?? t('it.unknownPerson')}
                </span>
                <span className="truncate text-body-small text-on-surface-variant">{request.email}</span>
              </div>
            </div>
            {request.comment && (
              <blockquote className="rounded-md bg-surface-container p-3 text-body-medium text-on-surface">
                “{request.comment}”
              </blockquote>
            )}
            <dl className="flex flex-col">
              {person?.employeeId && <DetailRow label={t('hires.detail.employeeId')} value={person.employeeId} />}
              {person?.mobile && <DetailRow label={t('hires.detail.mobile')} value={maskPhone(person.mobile)} />}
              {person && <DetailRow label={t('it.detail.area')} value={`${person.jobTitle} · ${person.area}`} />}
              {manager && <DetailRow label={t('hires.detail.manager')} value={manager.name} />}
            </dl>
          </Card>

          <Card title={t('it.detail.account')}>
            <ul className="flex flex-col gap-2 text-body-medium text-on-surface">
              <li className="flex items-start gap-2">
                <Icon
                  name={account?.locked ? 'lock' : 'lock_open'}
                  size={20}
                  className={account?.locked ? 'shrink-0 text-error' : 'shrink-0 text-success'}
                />
                <span>
                  {account?.locked
                    ? t('it.detail.accountLocked', { date: account.lockedAt ? formatDateTime(account.lockedAt) : '' })
                    : t('it.detail.accountActive')}
                </span>
              </li>
              <li className="flex items-start gap-2 text-on-surface-variant">
                <Icon name="history" size={20} className="shrink-0" />
                {t('it.detail.failedAttempts', { count: account?.failedCount ?? 0 })}
              </li>
              {accountFlags?.mustChangePassword && (
                <li className="flex items-start gap-2 text-on-surface-variant">
                  <Icon name="password" size={20} className="shrink-0" />
                  {t('it.detail.flagPassword')}
                </li>
              )}
              {accountFlags?.mfaReset && (
                <li className="flex items-start gap-2 text-on-surface-variant">
                  <Icon name="key" size={20} className="shrink-0" />
                  {t('it.detail.flagMfa')}
                </li>
              )}
            </ul>
          </Card>

          <Card title={t('it.history.title')} description={t('it.history.description')}>
            <ol className="flex flex-col">
              {history.map((e, i) => (
                <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="flex w-4 shrink-0 flex-col items-center">
                    <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    {i < history.length - 1 && <span aria-hidden className="mt-1 w-px flex-1 bg-outline-variant" />}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-body-medium text-on-surface">
                      {t(`it.audit.actions.${e.action}`, { defaultValue: e.action })}
                    </span>
                    <span className="text-body-small text-on-surface-variant tabular-nums">
                      {nameOf(e.actorId)} · {formatDateTime(e.at)}
                    </span>
                    {e.detail && <span className="text-body-small text-on-surface-variant">{e.detail}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent
          title={t('it.detail.rejectTitle')}
          description={t('it.detail.rejectBody')}
          actions={
            <>
              <DialogClose asChild>
                <Button variant="outlined" fullWidth className="sm:w-auto">
                  {t('ui.cancel')}
                </Button>
              </DialogClose>
              <Button variant="danger" fullWidth className="sm:w-auto" onClick={reject}>
                {t('it.detail.rejectConfirm')}
              </Button>
            </>
          }
        >
          <TextArea
            label={t('it.detail.rejectReason')}
            helperText={t('it.detail.rejectReasonHelp')}
            required
            rows={3}
            value={rejectNote}
            error={rejectError && !rejectNote.trim() ? t('it.detail.rejectReasonRequired') : undefined}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
