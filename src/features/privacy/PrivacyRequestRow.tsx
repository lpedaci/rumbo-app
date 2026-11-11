import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { formatDate } from '@/lib/dates';
import { daysLeft } from '@/lib/privacy';
import { cn } from '@/lib/utils';
import type { Person, PrivacyRequest, PrivacyRequestStatus } from '@/types/domain';

const STATUS: Record<PrivacyRequestStatus, { tone: StatusTone; icon: IconName }> = {
  new: { tone: 'info', icon: 'schedule' },
  in_progress: { tone: 'warning', icon: 'pending' },
  answered: { tone: 'success', icon: 'check_circle' },
  rejected: { tone: 'error', icon: 'cancel' },
};

export function PrivacyStatusPill({ status, className }: { status: PrivacyRequestStatus; className?: string }) {
  const { t } = useTranslation();
  return <StatusPill {...STATUS[status]} label={t(`privacy.status.${status}`)} className={className} />;
}

/** Deadline in words for an open request: "Vence en 3 días", "Vence hoy", "Venció hace 2 días". */
export function useDueText() {
  const { t } = useTranslation();
  return (request: PrivacyRequest) => {
    if (request.status === 'answered' || request.status === 'rejected') {
      return { text: t('privacy.requests.answeredOn', { date: formatDate((request.answeredAt ?? request.createdAt).slice(0, 10)) }), late: false };
    }
    const left = daysLeft(request.dueAt);
    if (left > 0) return { text: t('privacy.requests.dueIn', { count: left }), late: false };
    if (left === 0) return { text: t('privacy.requests.dueToday'), late: true };
    return { text: t('privacy.requests.overdue', { count: -left }), late: true };
  };
}

/**
 * One request about personal data (F10), with the list rhythm of the product (D-106): who or what
 * on the left, the request in the middle, the status and the deadline on the right. In A12 the
 * whole row opens the request; in G10 it shows HR's answer underneath.
 */
export function PrivacyRequestRow({
  request: r,
  person,
  onOpen,
  showResponse = false,
}: {
  request: PrivacyRequest;
  /** A12: who sent it (avatar and name instead of the icon). */
  person?: Person;
  onOpen?: () => void;
  showResponse?: boolean;
}) {
  const { t } = useTranslation();
  const due = useDueText()(r);
  const title = person ? person.name : `${t(`privacy.types.${r.type}`)} · ${r.id}`;

  const content = (
    <>
      {person ? <Avatar name={person.name} role={person.role} size="md" /> : <IconTile icon="policy" tone="neutral" />}
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-title-small text-on-surface">{title}</span>
        {person && (
          <span className="text-body-small text-on-surface-variant">
            {t(`privacy.types.${r.type}`)} · {r.id}
          </span>
        )}
        <span className={cn('text-body-medium text-on-surface', onOpen && 'line-clamp-2')}>{r.detail}</span>
        <span className="text-body-small text-on-surface-variant tabular-nums">
          {t('privacy.mine.sentOn', { date: formatDate(r.createdAt.slice(0, 10)) })} ·{' '}
          {t('privacy.mine.due', { date: formatDate(r.dueAt) })}
        </span>
        {showResponse && r.response && (
          <span className="mt-1 flex flex-col gap-1 rounded-md bg-surface-container p-3">
            <span className="text-label-medium text-on-surface-variant">{t('privacy.mine.response')}</span>
            <span className="text-body-medium text-on-surface">{r.response}</span>
          </span>
        )}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5 text-right">
        <PrivacyStatusPill status={r.status} />
        <span
          className={cn('flex items-center gap-1 text-label-medium', due.late ? 'text-error' : 'text-on-surface')}
        >
          {due.late && <Icon name="error" size={16} />}
          {due.text}
        </span>
      </span>
    </>
  );

  return (
    <li className="border-b border-outline-variant last:border-b-0">
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          // Named by its own visible content (WCAG 2.5.3, label in name)
          className="flex min-h-14 w-full min-w-0 items-start gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          {content}
        </button>
      ) : (
        <div className="flex min-h-14 min-w-0 items-start gap-3 px-2 py-3">{content}</div>
      )}
    </li>
  );
}
