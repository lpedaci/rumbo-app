import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { TextArea } from '@/components/ui/TextArea';
import { toast } from '@/components/ui/toast-store';
import { can } from '@/lib/permissions';
import { mask } from '@/lib/privacy';
import { issuesByPath } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { SensitiveField } from '@/types/domain';

const reasonSchema = z.string().trim().min(10, 'privacy.pii.reasonRequired').max(200, 'privacy.pii.reasonMax');

/**
 * A sensitive identifier (F10): always masked (only the last 4 digits). People with `pii:reveal`
 * (HR) can show it after writing a reason, which goes to the audit log (`pii.reveal`); it stays
 * visible only while this screen is open. Everyone else only ever sees the masked value.
 */
export function MaskedValue({
  personId,
  personName,
  field,
  value,
}: {
  personId: string;
  personName: string;
  field: SensitiveField;
  value: string;
}) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const fieldName = t(`privacy.mine.fields.${field}`);
  const issue = issuesByPath(reasonSchema.safeParse(reason))[''];
  const canReveal = can(user, 'pii:reveal') && user?.personId !== personId;

  const confirm = () => {
    setTried(true);
    if (issue || !user) return;
    useDataStore.getState().logPiiReveal(personId, field, reason, user.personId);
    setRevealed(true);
    setOpen(false);
    setReason('');
    setTried(false);
    toast.info(t('privacy.pii.revealed'));
  };

  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
      <span className="tabular-nums [overflow-wrap:anywhere]">
        {revealed ? value : mask(value, field)}
        {!revealed && <span className="sr-only"> ({t('privacy.pii.masked')})</span>}
      </span>
      {canReveal &&
        (revealed ? (
          <Button variant="text" size="xs" leadingIcon="visibility_off" onClick={() => setRevealed(false)}>
            {t('privacy.pii.hide')}
          </Button>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <Button
              variant="text"
              size="xs"
              leadingIcon="visibility"
              aria-label={t('privacy.pii.showLabel', { field: fieldName })}
              onClick={() => setOpen(true)}
            >
              {t('privacy.pii.show')}
            </Button>
            <DialogContent
              title={t('privacy.pii.revealTitle', { field: fieldName, name: personName })}
              description={t('privacy.pii.revealBody')}
              actions={
                <>
                  <DialogClose asChild>
                    <Button variant="outlined">{t('ui.cancel')}</Button>
                  </DialogClose>
                  <Button leadingIcon="visibility" onClick={confirm}>
                    {t('privacy.pii.confirm')}
                  </Button>
                </>
              }
            >
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  confirm();
                }}
              >
                <TextArea
                  id={`reveal-${personId}-${field}`}
                  label={t('privacy.pii.reason')}
                  required
                  helperText={t('privacy.pii.reasonHelp')}
                  error={tried && issue ? t(issue) : undefined}
                  value={reason}
                  rows={2}
                  onChange={(event) => setReason(event.target.value)}
                />
              </form>
            </DialogContent>
          </Dialog>
        ))}
    </span>
  );
}
