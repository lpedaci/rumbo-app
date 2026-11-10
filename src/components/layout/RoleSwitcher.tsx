import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { toast } from '@/components/ui/toast-store';
import { DEMO_ACCOUNTS, findDemoPerson, switchRole } from '@/features/auth/auth-service';
import { can } from '@/lib/permissions';
import { useCurrentUser } from '@/store/session-store';
import type { Role } from '@/types/domain';

/**
 * "Ver como" demo selector, always visible in the header (CLAUDE.md principles).
 * Switching closes the session and opens the demo user's session of that role.
 */
export function RoleSwitcher() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  if (!user || !can(user, 'demo:switch_role')) return null;

  const onChange = (value: string) => {
    const role = value as Role;
    if (role === user.role) return;
    const path = switchRole(role);
    const person = findDemoPerson(DEMO_ACCOUNTS.find((a) => a.role === role)!.personId);
    navigate(path);
    toast.info(t('layout.switched', { name: person?.name ?? '', role: t(`rolesInline.${role}`) }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outlined" size="xs" leadingIcon="swap_horiz" trailingIcon="keyboard_arrow_down" className="max-w-[11rem] sm:max-w-none">
          <span className="sr-only sm:not-sr-only">{t('layout.viewAs')}:&nbsp;</span>
          <span className="truncate">{t(`roles.${user.role}`)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent label={t('layout.viewAsMenu')}>
        <DropdownMenuLabel>{t('layout.viewAsMenu')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={user.role} onValueChange={onChange}>
          {DEMO_ACCOUNTS.map(({ personId, role }) => (
            <DropdownMenuRadioItem key={role} value={role} description={findDemoPerson(personId)?.name}>
              {t(`roles.${role}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
