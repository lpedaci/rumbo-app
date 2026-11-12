import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { RoleChip } from '@/features/people/PeopleBits';
import { Avatar } from '@/components/ui/Avatar';
import type { IconName } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { decidersOf, decideBlock } from '@/lib/approvals';
import { formatDate } from '@/lib/dates';
import { useDataStore } from '@/store/data-store';
import type { ApprovalRequest, ApprovalStatus, PolicyField } from '@/types/domain';

const STATUS: Record<ApprovalStatus, { tone: StatusTone; icon: IconName }> = {
  pending: { tone: 'warning', icon: 'hourglass_empty' },
  approved: { tone: 'success', icon: 'check_circle' },
  rejected: { tone: 'error', icon: 'cancel' },
};

export function ApprovalStatusPill({ status, className }: { status: ApprovalStatus; className?: string }) {
  const { t } = useTranslation();
  return <StatusPill {...STATUS[status]} label={t(`approvals.status.${status}`)} className={className} />;
}

/** Texts of a request: its title, what changes ("12 → 14 caracteres") and who asked or decided. */
export function useApprovalText() {
  const { t } = useTranslation();
  const people = useDataStore((s) => s.people);
  const hires = useDataStore((s) => s.hires);
  // Same reading as in People (D-116): the basic role is "Nuevo ingreso" only with a journey.
  const roleName = (role: ApprovalRequest['fromRole'], personId: string) =>
    role === 'hire' && !hires.some((h) => h.personId === personId) ? t('people.roleBasic') : t(`roles.${role}`);
  const nameOf = (id?: string) => people.find((p) => p.id === id)?.name ?? '';
  const policyValue = (field: PolicyField, value?: number) => t(`approvals.units.${field}`, { count: value ?? 0 });
  return {
    nameOf,
    roleName,
    policyValue,
    title: (a: ApprovalRequest) =>
      a.action === 'role.change'
        ? t('approvals.roleTitle', { name: nameOf(a.targetId) })
        : t('approvals.policyTitle', { policy: t(`approvals.policyNames.${a.targetId}`) }),
    change: (a: ApprovalRequest) =>
      a.action === 'role.change'
        ? t('approvals.change', { from: roleName(a.fromRole, a.targetId), to: roleName(a.toRole, a.targetId) })
        : t('approvals.change', {
            from: policyValue(a.targetId as PolicyField, a.fromValue),
            to: policyValue(a.targetId as PolicyField, a.toValue),
          }),
    requested: (a: ApprovalRequest) =>
      t('approvals.requestedBy', { name: nameOf(a.requestedBy), date: formatDate(a.createdAt.slice(0, 10)) }),
    decided: (a: ApprovalRequest) =>
      a.status === 'pending' || !a.decidedAt
        ? ''
        : t(`approvals.decidedBy.${a.status}`, {
            name: nameOf(a.decidedBy),
            date: formatDate(a.decidedAt.slice(0, 10)),
          }),
  };
}

/**
 * What a request changes. Roles always go as `RoleChip`, in their color (D-69), like everywhere
 * else; a policy goes as plain values ("12 caracteres → 14 caracteres").
 */
export function ApprovalChange({ approval: a, className }: { approval: ApprovalRequest; className?: string }) {
  const { t } = useTranslation();
  const text = useApprovalText();
  const hasHire = useDataStore((s) => s.hires.some((h) => h.personId === a.targetId));
  if (a.action !== 'role.change' || !a.fromRole || !a.toRole) {
    return <span className={className}>{text.change(a)}</span>;
  }
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`}>
      <RoleChip role={a.fromRole} newHire={hasHire} />
      <Icon name="arrow_forward" size={16} className="text-on-surface-variant" />
      <span className="sr-only">{t('approvals.changeTo')}</span>
      <RoleChip role={a.toRole} newHire={hasHire} />
    </span>
  );
}

/**
 * One request in the list rhythm (D-106, D-115): the person or the policy on the left; title,
 * change and who asked in the middle, with a third line when the viewer cannot decide it; the
 * status on the right. The whole row opens the request.
 */
export function ApprovalRow({
  approval: a,
  viewerId,
  onOpen,
}: {
  approval: ApprovalRequest;
  viewerId: string;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const text = useApprovalText();
  const target = useDataStore((s) =>
    a.action === 'role.change' ? s.people.find((p) => p.id === a.targetId) : undefined,
  );
  const block = decideBlock(a, viewerId);
  // D-118: the viewer's own request says who it is waiting for.
  const people = useDataStore((s) => s.people);
  const waiting = block === 'own' ? decidersOf(a, people) : [];
  const note =
    block === 'own'
      ? waiting.length
        ? t('approvals.waitingFor', { name: waiting.map((p) => p.name).join(', ') })
        : t('approvals.own')
      : block === 'target'
        ? t('approvals.target')
        : undefined;
  return (
    <li className="border-b border-outline-variant last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        // Named by its own visible content (WCAG 2.5.3, label in name)
        className="flex min-h-14 w-full min-w-0 flex-col gap-3 rounded-md px-2 py-3 text-left sm:flex-row sm:items-start transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        <span className="flex min-w-0 flex-1 items-start gap-3">
          {target ? (
            <Avatar name={target.name} role={target.role} size="md" />
          ) : (
            <IconTile icon="rule" tone="neutral" />
          )}
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-title-small text-on-surface">{text.title(a)}</span>
            <ApprovalChange approval={a} className="text-body-medium text-on-surface" />
            <span className="text-body-small text-on-surface-variant tabular-nums">
              {a.id} · {a.status === 'pending' ? text.requested(a) : text.decided(a)}
            </span>
            {note && <span className="text-body-small text-on-surface-variant">{note}</span>}
          </span>
        </span>
        {/* Phones: the status goes on its own line under the content, as in every list (D-106, D-115). */}
        <ApprovalStatusPill status={a.status} className="shrink-0 self-start" />
      </button>
    </li>
  );
}
