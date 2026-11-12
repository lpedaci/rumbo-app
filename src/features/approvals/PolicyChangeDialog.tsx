import { type FormEvent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { DialogClose, DialogContent } from '@/components/ui/Dialog';
import { RefChip } from '@/components/ui/RefChip';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import { POLICY_FIELDS, POLICY_LIMITS, pendingPolicyChange, policyValueIssue } from '@/lib/approvals';
import { integerMask } from '@/lib/input-masks';
import { issuesByPath } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { PolicyField } from '@/types/domain';
import { useApprovalText } from './ApprovalBits';

const reasonSchema = z.string().trim().min(10, 'approvals.policy.reasonRequired').max(300, 'approvals.policy.reasonMax');
const valueMask = integerMask({ maxDigits: 2 });
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * S3 · Propose a policy change (F14): the new value goes to S7 and applies only when another
 * person in IT approves it. One pending change per policy at a time.
 */
export function PolicyChangeDialog({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const policy = useDataStore((s) => s.securityPolicy);
  const approvals = useDataStore((s) => s.approvals);
  const text = useApprovalText();
  const [field, setField] = useState<PolicyField | ''>('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);

  const pending = field ? pendingPolicyChange(approvals, field) : undefined;
  const fieldIssue = !field ? 'approvals.policy.fieldRequired' : pending ? 'approvals.policy.fieldPending' : undefined;
  const valueIssue = field ? policyValueIssue(field, value === '' ? undefined : Number(value), policy) : undefined;
  const reasonIssue = issuesByPath(reasonSchema.safeParse(reason))[''];
  const show = (issue?: string) => (tried && issue ? t(issue, { id: pending?.id }) : undefined);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    const first = fieldIssue ? 'policy-field' : valueIssue ? 'policy-value' : reasonIssue ? 'policy-reason' : undefined;
    if (first || !field || !user) {
      if (first) document.getElementById(first)?.focus();
      return;
    }
    const id = useDataStore.getState().requestPolicyChange(field, Number(value), reason, user.personId);
    if (id) {
      toast.success(t('approvals.policy.sent', { id }));
      onDone();
    }
  };

  const limits = field ? POLICY_LIMITS[field] : undefined;
  return (
    <DialogContent
      title={t('approvals.policy.dialogTitle')}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outlined">{t('ui.cancel')}</Button>
          </DialogClose>
          <Button type="submit" form="policy-change" leadingIcon="approval">
            {t('approvals.policy.send')}
          </Button>
        </>
      }
    >
      <p className="text-body-medium text-on-surface">
        <Trans
          i18nKey="approvals.policy.introRich"
          components={{ chip: <RefChip icon="approval" to="/it/approvals" /> }}
        />
      </p>
      <form id="policy-change" noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Select
          id="policy-field"
          label={t('approvals.policy.field')}
          required
          helperText={t('approvals.policy.fieldHelp')}
          error={show(fieldIssue)}
          value={field}
          onChange={(event) => {
            setField(event.target.value as PolicyField | '');
            setValue('');
          }}
          options={[
            { value: '', label: t('hires.form.choose') },
            ...POLICY_FIELDS.map((f) => ({
              value: f,
              label: t('approvals.policy.option', {
                // The names are written for the middle of a sentence; an option starts with a capital.
                policy: capitalize(t(`approvals.policyNames.${f}`)),
                value: text.policyValue(f, policy[f]),
              }),
            })),
          ]}
        />
        <TextField
          id="policy-value"
          label={t('approvals.policy.value')}
          required
          inputMode="numeric"
          mask={valueMask}
          helperText={
            limits && field
              ? t('approvals.policy.valueHelp', { min: limits.min, max: limits.max, example: policy[field] + 2 > limits.max ? limits.min : policy[field] + 2 })
              : t('approvals.policy.valueHelpNone')
          }
          error={field ? show(valueIssue) : undefined}
          disabled={!field}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <TextArea
          id="policy-reason"
          label={t('approvals.policy.reason')}
          required
          helperText={t('approvals.policy.reasonHelp')}
          error={show(reasonIssue)}
          value={reason}
          rows={3}
          onChange={(event) => setReason(event.target.value)}
        />
      </form>
    </DialogContent>
  );
}
