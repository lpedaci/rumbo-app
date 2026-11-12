import { useTranslation } from 'react-i18next';
import { Avatar, ROLE_ACCENT } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import type { Person } from '@/types/domain';
import { EmailText } from '@/components/ui/EmailText';

/**
 * One key contact. From 1024 px, the full card: avatar, relation chip, name, job title and
 * email (D-83). Below, compact form: a left-aligned row with avatar, name, relation
 * (jefe directo, buddy, referente de RRHH) and a chevron. Tapping it opens the full
 * card with job title and email.
 */
export function ContactCard({ person, relation }: { person: Person; relation: string }) {
  const { t } = useTranslation();
  // From 1024 px there is room for everything: the full card, no tap needed (D-83).
  const wide = useMediaQuery('(min-width: 64rem)', false);

  if (wide) {
    return (
      <li className="flex min-w-0 items-start gap-4 rounded-lg border border-outline-variant p-4">
        <Avatar name={person.name} role={person.role} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className={cn(
                'w-fit rounded-full px-2 py-0.5 text-label-medium text-on-surface',
                ROLE_ACCENT[person.role].chip,
              )}
            >
              {relation}
            </span>
            <span className="truncate pt-1 text-title-medium text-on-surface">{person.name}</span>
            <span className="truncate text-body-small text-on-surface-variant">{person.jobTitle}</span>
          </div>
          <a
            href={`mailto:${person.email}`}
            className="inline-flex min-h-9 w-fit max-w-full items-start gap-2 py-1.5 rounded-sm text-body-medium text-primary underline-offset-4 hover:underline"
          >
            <Icon name="mail" size={18} className="shrink-0" />
            <EmailText email={person.email} />
            <span className="sr-only">: {t('journey.contacts.email', { name: person.name })}</span>
          </a>
        </div>
      </li>
    );
  }

  return (
    <li className="min-w-0">
      <Popover>
        <PopoverTrigger
          className={cn(
            'flex min-h-14 w-full min-w-0 items-center gap-3 rounded-md border border-outline-variant px-3 py-2 text-left transition-colors duration-150',
            'hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary',
            'data-[state=open]:border-primary data-[state=open]:bg-surface-container',
          )}
        >
          <Avatar name={person.name} role={person.role} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-title-small text-on-surface">{person.name}</span>
            <span className="truncate text-body-small text-on-surface-variant">{relation}</span>
          </span>
          <Icon name="chevron_right" className="shrink-0 text-on-surface-variant" />
          <span className="sr-only">{t('journey.contacts.more')}</span>
        </PopoverTrigger>
        <PopoverContent label={t('journey.contacts.detailsOf', { name: person.name })} align="start">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Avatar name={person.name} role={person.role} size="lg" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-label-medium text-on-surface-variant">{relation}</span>
                <span className="text-title-medium text-on-surface">{person.name}</span>
                <span className="text-body-small text-on-surface-variant">{person.jobTitle}</span>
              </div>
              <PopoverClose asChild>
                <IconButton icon="close" label={t('ui.close')} size="xs" className="-mt-1 -mr-1" />
              </PopoverClose>
            </div>
            <a
              href={`mailto:${person.email}`}
              className="flex min-h-12 min-w-0 items-center gap-2 rounded-md bg-surface-container px-3 text-body-medium text-primary underline-offset-4 hover:underline md:min-h-10"
            >
              <Icon name="mail" className="shrink-0" />
              <EmailText email={person.email} />
              <span className="sr-only">: {t('journey.contacts.email', { name: person.name })}</span>
            </a>
          </div>
        </PopoverContent>
      </Popover>
    </li>
  );
}
