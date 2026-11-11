import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import type { Person } from '@/types/domain';

/**
 * One key contact in compact form: avatar, name and relation (jefe directo, buddy,
 * referente de RRHH). Tapping it opens the full card with job title and email.
 */
export function ContactCard({ person, relation }: { person: Person; relation: string }) {
  const { t } = useTranslation();

  return (
    <li className="min-w-0">
      <Popover>
        <PopoverTrigger
          className={cn(
            'group flex w-full min-w-0 flex-col items-center gap-2 rounded-lg px-1 py-2 text-center transition-colors duration-150',
            'hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary',
            'data-[state=open]:bg-surface-container',
          )}
        >
          <span className="relative">
            <Avatar name={person.name} role={person.role} size="lg" />
            {/* Hint that the avatar opens more information */}
            <span
              aria-hidden
              className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-primary text-on-primary"
            >
              <Icon name="info" size={16} />
            </span>
          </span>
          <span className="flex w-full min-w-0 flex-col">
            <span className="line-clamp-2 text-title-small text-on-surface">{person.name}</span>
            <span className="line-clamp-2 text-body-small text-on-surface-variant">{relation}</span>
          </span>
          <span className="sr-only">{t('journey.contacts.more')}</span>
        </PopoverTrigger>
        <PopoverContent label={t('journey.contacts.detailsOf', { name: person.name })}>
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
              <span className="min-w-0 truncate">{person.email}</span>
              <span className="sr-only">: {t('journey.contacts.email', { name: person.name })}</span>
            </a>
          </div>
        </PopoverContent>
      </Popover>
    </li>
  );
}
