import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { DEMO_TODAY, daysBetween } from '@/lib/dates';
import { isPastDue, rootBlocker } from '@/lib/journey';
import type { Alert, AlertKind } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import type { Hire, Person } from '@/types/domain';
import { CHECKIN_OFFSETS } from '@/lib/journey';

const KIND: Record<AlertKind, { icon: IconName; color: string }> = {
  checkin_escalated: { icon: 'warning', color: 'text-error' },
  task_blocked: { icon: 'lock', color: 'text-warning' },
  checkin_overdue: { icon: 'event', color: 'text-warning' },
  overdue_tasks: { icon: 'schedule', color: 'text-error' },
};

/** How many alerts are shown before "Ver N más". */
const VISIBLE = 6;

/**
 * Alerts of the HR panel (F4): one row per alert, most urgent first (escalations, blocked
 * work, late check-ins, overdue tasks). The whole row opens the hire record (A4). Each row
 * says who, what happened and, for blocked work, who it is waiting for: the bottleneck.
 */
export function AlertList({ alerts, hires, people }: { alerts: Alert[]; hires: Hire[]; people: Person[] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0) {
    return (
      <p className="flex items-start gap-2 rounded-md bg-success-container p-3 text-body-medium text-on-success-container">
        <Icon name="check_circle" size={20} className="shrink-0 text-success" />
        {t('dashboard.alerts.empty')}
      </p>
    );
  }

  const shown = expanded ? alerts : alerts.slice(0, VISIBLE);

  /** What happened (first line) and the detail that explains it (second line), D-87. */
  const message = (alert: Alert, hire: Hire): { what: string; detail: string } => {
    switch (alert.kind) {
      case 'checkin_escalated':
      case 'checkin_overdue': {
        const checkin = hire.checkins.find((c) => c.id === alert.refId);
        const days = checkin ? CHECKIN_OFFSETS[checkin.stage] : 30;
        return {
          what: t('dashboard.alerts.checkin', { days }),
          detail:
            alert.kind === 'checkin_escalated'
              ? t('dashboard.alerts.escalatedDetail')
              : t('dashboard.alerts.lateDetail', { count: alert.count }),
        };
      }
      case 'task_blocked': {
        const task = hire.tasks.find((x) => x.id === alert.refId);
        const waitingFor = task ? t(`owners.${rootBlocker(task, hire.tasks).owner}`) : '';
        return {
          what: t('dashboard.alerts.blocked', { count: alert.count }),
          detail: t('dashboard.alerts.blockedDetail', { owner: waitingFor }),
        };
      }
      default: {
        const oldest = hire.tasks
          .filter((task) => isPastDue(task))
          .reduce((min, task) => (task.dueDate < min ? task.dueDate : min), DEMO_TODAY);
        return {
          what: t('dashboard.alerts.overdue', { count: alert.count }),
          detail: t('dashboard.alerts.overdueDetail', { count: daysBetween(oldest, DEMO_TODAY) }),
        };
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <ul className="-mx-2 flex flex-col">
        {shown.map((alert) => {
          const hire = hires.find((h) => h.id === alert.hireId);
          const person = hire && people.find((p) => p.id === hire.personId);
          if (!hire || !person) return null;
          const kind = KIND[alert.kind];
          const msg = message(alert, hire);
          return (
            <li key={alert.id} className="border-b border-outline-variant last:border-b-0">
              <Link
                to={`/admin/hires/${hire.id}`}
                className="flex min-h-14 min-w-0 items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <Avatar name={person.name} role={person.role} size="sm" />
                {/* Three lines with the same rhythm in every row: who, what happened, the detail */}
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate text-title-small text-on-surface">{person.name}</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-body-small text-on-surface">
                    <Icon name={kind.icon} size={16} className={cn('shrink-0', kind.color)} />
                    <span className="truncate">{msg.what}</span>
                  </span>
                  <span className="truncate pl-[1.375rem] text-body-small text-on-surface-variant">{msg.detail}</span>
                </span>
                <Icon name="chevron_right" className="shrink-0 text-on-surface-variant" />
              </Link>
            </li>
          );
        })}
      </ul>
      {alerts.length > VISIBLE && (
        <Button
          variant="text"
          size="xs"
          trailingIcon={expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          className="w-fit"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? t('dashboard.alerts.less') : t('dashboard.alerts.more', { count: alerts.length - VISIBLE })}
        </Button>
      )}
    </div>
  );
}
