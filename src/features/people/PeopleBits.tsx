import { useTranslation } from 'react-i18next';
import { ROLE_ACCENT } from '@/components/ui/Avatar';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import type { IconName } from '@/components/ui/Icon';
import type { PersonStatus } from '@/lib/people';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/domain';

/**
 * Role in its color (D-69): role colors identify people and roles, never states. The basic role
 * reads "Nuevo ingreso" only for people with an onboarding journey; for the rest, "Acceso básico" (D-116).
 */
export function RoleChip({ role, newHire = true, className }: { role: Role; newHire?: boolean; className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex h-6 w-fit shrink-0 items-center rounded-full px-2.5 text-label-medium whitespace-nowrap',
        ROLE_ACCENT[role].chip,
        className,
      )}
    >
      {role === 'hire' && !newHire ? t('people.roleBasic') : t(`roles.${role}`)}
    </span>
  );
}

const STATUS: Record<PersonStatus, { tone: StatusTone; icon: IconName }> = {
  active: { tone: 'success', icon: 'check_circle' },
  locked: { tone: 'error', icon: 'lock' },
  offboarded: { tone: 'neutral', icon: 'logout' },
};

export function PersonStatusPill({ status, className }: { status: PersonStatus; className?: string }) {
  const { t } = useTranslation();
  return <StatusPill {...STATUS[status]} label={t(`people.status.${status}`)} className={className} />;
}
