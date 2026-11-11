import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar, ROLE_ACCENT } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { DEMO_ACCOUNTS, demoKeyFor, findDemoPerson } from '@/features/auth/auth-service';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/domain';
import { ROLE_PREVIEW } from './RolePreviews';
import { SectionHeading } from './SectionHeading';

/** Flat tint behind each preview, in the role's container color (no gradients, 2.2). */
const ROLE_BACKDROP: Record<Role, string> = {
  admin: 'bg-role-hr-container',
  manager: 'bg-role-manager-container',
  hire: 'bg-role-hire-container',
  it_admin: 'bg-role-it-container',
};

/**
 * G0 · One journey per role (D-71, reference of alternating sections): text on one side
 * (who, what they do, what you can explore and the entry action) and a miniature of their
 * screen on the other, alternating sides from 1024 px.
 */
export const RoleShowcase = forwardRef<HTMLHeadingElement>(function RoleShowcase(_, ref) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="choose-title" className="flex flex-col gap-12 lg:gap-20">
      <SectionHeading
        ref={ref}
        id="choose-title"
        eyebrow={t('home.showcase.eyebrow')}
        title={t('home.showcase.title')}
        highlight={t('home.showcase.titleHighlight')}
        subtitle={t('home.showcase.subtitle')}
      />
      <ul className="flex flex-col gap-16 lg:gap-24">
        {DEMO_ACCOUNTS.map(({ personId, role }, i) => {
          const person = findDemoPerson(personId);
          const key = demoKeyFor(personId)!;
          const accent = ROLE_ACCENT[role];
          const points = t(`home.roles.${role}.points`, {
            returnObjects: true,
          }) as string[];
          const Preview = ROLE_PREVIEW[role];
          return (
            <li
              key={role}
              aria-labelledby={`role-${role}`}
              className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16"
            >
              <div className={cn('flex min-w-0 flex-col gap-5', i % 2 === 1 && 'lg:order-2')}>
                <div className="flex min-w-0 items-center gap-3">
                  {person && <Avatar name={person.name} role={role} size="lg" />}
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className={cn('inline-flex w-fit rounded-full px-2.5 py-0.5 text-label-medium', accent.chip)}>
                      {t(`roles.${role}`)}
                    </span>
                    <span className="truncate text-body-small text-on-surface-variant">
                      {person?.name} · {person?.jobTitle}
                    </span>
                  </div>
                </div>
                <h3 id={`role-${role}`} className="text-headline-small text-balance text-on-surface">
                  {t(`home.showcase.roles.${role}.title`)}
                </h3>
                <p className="text-body-large text-on-surface-variant">{t(`home.showcase.roles.${role}.body`)}</p>
                <div className="flex flex-col gap-2">
                  <p className="text-label-medium text-on-surface">{t('home.youWillSee')}</p>
                  <ul className="flex flex-wrap gap-2">
                    {points.map((point) => (
                      <li
                        key={point}
                        className="inline-flex items-start gap-1.5 rounded-md border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-body-small text-on-surface"
                      >
                        <Icon name="check_circle" size={16} className={cn('mt-px shrink-0', accent.icon)} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild variant="outlined" trailingIcon="arrow_forward" className="w-full sm:w-fit">
                  <Link to={`/login?demo=${key}`}>
                    {t('home.cardAction', {
                      name: person?.name.split(' ')[0] ?? '',
                    })}
                  </Link>
                </Button>
              </div>
              <div
                className={cn(
                  'relative min-w-0 rounded-xl p-4 sm:p-8',
                  ROLE_BACKDROP[role],
                  i % 2 === 1 && 'lg:order-1',
                )}
              >
                <Preview />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
});
