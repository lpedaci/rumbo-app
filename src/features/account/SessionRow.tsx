import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { IconTile } from '@/components/ui/IconTile';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDateTime } from '@/lib/dates';
import type { DeviceSession } from '@/types/domain';

/**
 * One signed-in device (F11), with the list rhythm of the product (D-106): the kind of device
 * on the left; device and browser, place and last use in the middle; "Esta sesión" or the
 * action on the right.
 */
export function SessionRow({ session: s, action, lead }: { session: DeviceSession; action?: ReactNode; lead?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <li className="flex min-h-14 min-w-0 flex-col gap-3 border-b border-outline-variant px-2 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {lead ?? <IconTile icon={s.kind === 'mobile' ? 'mobile' : 'computer'} tone="neutral" />}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-title-small text-on-surface">
            {s.device} · {s.browser}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 text-body-small text-on-surface-variant tabular-nums">
            <span>{s.approxLocation}</span>
            <span aria-hidden>·</span>
            <span>{s.current ? t('sessions.activeNow') : t('sessions.lastSeen', { date: formatDateTime(s.lastSeenAt) })}</span>
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
        {s.current && <StatusPill tone="success" icon="check_circle" label={t('sessions.current')} />}
        {action}
      </div>
    </li>
  );
}
