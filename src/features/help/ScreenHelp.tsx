import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { DialogClose, DialogContent } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';

/**
 * Contextual help (F16, D-127): one short explanation per main screen, opened from the Help menu
 * of the top bar, always in the same place (WCAG 3.2.6). The most specific route wins.
 */
const HELP_ROUTES: [RegExp, string][] = [
  [/^\/admin$/, 'dashboard'],
  [/^\/admin\/hires$/, 'hires'],
  [/^\/admin\/hires\/new$/, 'hireNew'],
  [/^\/admin\/hires\/[^/]+$/, 'hireRecord'],
  [/^\/admin\/templates$/, 'templates'],
  [/^\/admin\/templates\/[^/]+/, 'templateEditor'],
  [/^\/admin\/people/, 'people'],
  [/^\/admin\/lifecycle$/, 'lifecycle'],
  [/^\/admin\/privacy-requests$/, 'privacyRequests'],
  [/^\/admin\/reports$/, 'reports'],
  [/^\/(admin|manager|it)\/access-review$/, 'accessReview'],
  [/^\/manager$/, 'team'],
  [/^\/manager\/hires\/[^/]+$/, 'teamRecord'],
  [/^\/manager\/hires\/[^/]+\/checkin\//, 'checkin'],
  [/^\/me$/, 'journey'],
  [/^\/me\/tasks\//, 'task'],
  [/^\/me\/checkin/, 'selfReview'],
  [/^\/it\/requests$/, 'requests'],
  [/^\/it\/requests\/[^/]+$/, 'requestDetail'],
  [/^\/it\/lifecycle$/, 'accessTasks'],
  [/^\/it\/approvals$/, 'approvals'],
  [/^\/it\/access-reviews/, 'campaigns'],
  [/^\/it\/security$/, 'security'],
  [/^\/notifications$/, 'notifications'],
  [/^\/search$/, 'search'],
  [/^\/account\/security$/, 'mySecurity'],
  [/^\/account\/privacy$/, 'myPrivacy'],
];

export function helpKeyFor(pathname: string): string | undefined {
  return HELP_ROUTES.find(([pattern]) => pattern.test(pathname))?.[1];
}

/** The help dialog of the current screen: what it is for and what can be done there. */
export function ScreenHelpDialog() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const key = helpKeyFor(pathname);
  const title = key ? t(`help.screens.${key}.title`) : t('help.generic');
  const points = key ? (t(`help.screens.${key}.points`, { returnObjects: true }) as string[]) : [];
  return (
    <DialogContent
      title={t('help.dialogTitle', { screen: title })}
      actions={
        <DialogClose asChild>
          <Button variant="outlined">{t('ui.close')}</Button>
        </DialogClose>
      }
    >
      <p className="text-body-medium text-on-surface">{key ? t(`help.screens.${key}.purpose`) : t('help.genericPurpose')}</p>
      {points.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-title-small text-on-surface">{t('help.whatYouCanDo')}</h3>
          <ul className="flex flex-col gap-2">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-body-medium text-on-surface">
                <Icon name="check_circle" size={18} className="mt-px shrink-0 text-primary" />
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}
    </DialogContent>
  );
}
