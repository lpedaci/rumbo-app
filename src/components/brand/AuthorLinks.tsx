import { useTranslation } from 'react-i18next';
import { GITHUB_PROFILE_URL, LINKEDIN_URL, PORTFOLIO_URL } from '@/app/links';
import { Icon } from '@/components/ui/Icon';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { GitHubMark } from './GitHubMark';
import { LinkedInMark } from './LinkedInMark';

/**
 * Profile links (D-102): outlined icon buttons with soft corners (2.1.3), 48 px on phones and
 * 40 px from 640 px, each with an accessible name and a tooltip.
 */
const PROFILE_LINK =
  'inline-flex size-12 items-center justify-center rounded-sm border border-outline text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:size-10';

const PROFILES = [
  { key: 'linkedin', href: LINKEDIN_URL, mark: <LinkedInMark className="size-5 shrink-0" /> },
  { key: 'portfolio', href: PORTFOLIO_URL, mark: <Icon name="work" size={20} className="text-primary" /> },
  { key: 'github', href: GITHUB_PROFILE_URL, mark: <GitHubMark className="size-5 shrink-0" /> },
] as const;

/**
 * Who made Rumbo, in one line (D-92, D-102, D-103): name and role, then the profiles to get in
 * touch. Shared by the G0 footer and the design system site, so both say it the same way.
 */
export function AuthorLinks({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex flex-wrap items-center gap-x-6 gap-y-3', className)}>
      <p className="min-w-0 text-body-medium text-on-surface">{t('home.author')}</p>
      <ul className="flex flex-wrap gap-3 sm:gap-4" aria-label={t('home.footer.author')}>
        {PROFILES.map(({ key, href, mark }) => (
          <li key={key}>
            <Tooltip content={t(`home.footer.${key}`)}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t(`home.footer.${key}`)} ${t('home.newTab')}`}
                className={PROFILE_LINK}
              >
                {mark}
              </a>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
}
