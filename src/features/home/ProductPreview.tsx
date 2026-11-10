import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';

/**
 * Product preview on the demo start (G0), drawn with the real tokens: a journey card
 * with progress and a checklist (reference cf59fe35). Decorative: hidden from assistive tech.
 */
export function ProductPreview() {
  const { t } = useTranslation();
  const tasks = t('home.preview.tasks', { returnObjects: true }) as string[];

  return (
    <div aria-hidden className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
      <div className="flex items-center gap-2 text-label-large text-primary">
        <Icon name="route" />
        {t('home.preview.journey')}
      </div>
      <ProgressBar value={67} label={t('home.preview.progress')} valueText="67 %" />
      <ul className="flex flex-col divide-y divide-outline-variant rounded-md border border-outline-variant">
        {tasks.map((task, i) => (
          <li key={task} className="flex items-center gap-3 px-3 py-2.5 text-body-medium text-on-surface">
            <Icon
              name={i < 2 ? 'check_circle' : 'radio_button_unchecked'}
              filled={i < 2}
              className={i < 2 ? 'text-success' : 'text-on-surface-variant'}
            />
            <span className="min-w-0 flex-1 truncate">{task}</span>
            <Icon name="chevron_right" className="text-on-surface-variant" />
          </li>
        ))}
      </ul>
    </div>
  );
}
