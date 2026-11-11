import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/ui/Icon';
import { isEmptyDiff, type TemplateDiff } from '@/lib/templates';
import type { TemplateTask } from '@/types/domain';

/**
 * What changed between two versions (F8): added, removed and changed tasks, each group with an
 * icon and a count (never color alone), and a line for reordering and for the template details.
 * Used in the publish summary (A6) and in the comparison of A8. `headingLevel` is the level of
 * the group titles, one below the section that holds the view (2.10).
 */
export function TemplateDiffView({ diff, headingLevel = 'h3' }: { diff: TemplateDiff; headingLevel?: 'h3' | 'h4' }) {
  const { t } = useTranslation();
  if (isEmptyDiff(diff)) {
    return <p className="text-body-medium text-on-surface-variant">{t('templateVersions.diff.none')}</p>;
  }
  const field = (f: string) => t(`templateVersions.diff.fields.${f}`);
  const stageOf = (task: TemplateTask) => t(`stages.${task.stage}`);

  return (
    <div className="flex flex-col gap-4">
      {diff.details.length > 0 && (
        <p className="text-body-medium text-on-surface">
          {t('templateVersions.diff.details', { fields: diff.details.map(field).join(', ') })}
        </p>
      )}
      <Group
        as={headingLevel}
        icon="add_circle"
        iconClass="text-success"
        title={t('templateVersions.diff.added', { count: diff.added.length })}
        items={diff.added.map((task) => ({ key: task.id, title: task.title, detail: stageOf(task) }))}
      />
      <Group
        as={headingLevel}
        icon="do_not_disturb_on"
        iconClass="text-error"
        title={t('templateVersions.diff.removed', { count: diff.removed.length })}
        items={diff.removed.map((task) => ({ key: task.id, title: task.title, detail: stageOf(task) }))}
      />
      <Group
        as={headingLevel}
        icon="change_circle"
        iconClass="text-info"
        title={t('templateVersions.diff.modified', { count: diff.modified.length })}
        items={diff.modified.map(({ before, after, fields }) => ({
          key: after.id,
          title: after.title,
          detail: fields.includes('offsetDays')
            ? [
                t('templateVersions.diff.offset', { from: before.offsetDays, to: after.offsetDays }),
                ...(fields.length > 1
                  ? [
                      t('templateVersions.diff.changed', {
                        fields: fields.filter((f) => f !== 'offsetDays').map(field).join(', '),
                      }),
                    ]
                  : []),
              ].join(' · ')
            : t('templateVersions.diff.changed', { fields: fields.map(field).join(', ') }),
        }))}
      />
      {diff.reordered && (
        <p className="flex items-start gap-2 text-body-medium text-on-surface-variant">
          <Icon name="swap_vert" size={20} className="shrink-0" />
          {t('templateVersions.diff.reordered')}
        </p>
      )}
    </div>
  );
}

function Group({
  as: Heading,
  icon,
  iconClass,
  title,
  items,
}: {
  as: 'h3' | 'h4';
  icon: IconName;
  iconClass: string;
  title: string;
  items: { key: string; title: string; detail: string }[];
}) {
  if (!items.length) return null;
  return (
    <section className="flex flex-col gap-2">
      <Heading className="flex items-center gap-2 text-title-small text-on-surface">
        <Icon name={icon} size={20} className={iconClass} />
        {title}
      </Heading>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex min-w-0 flex-col gap-0.5 border-b border-outline-variant py-2 pl-7 last:border-b-0"
          >
            <span className="text-body-medium text-on-surface">{item.title}</span>
            <span className="text-body-small text-on-surface-variant">{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
