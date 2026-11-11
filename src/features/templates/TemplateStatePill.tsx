import { useTranslation } from 'react-i18next';
import { StatusPill } from '@/components/ui/StatusPill';
import { latestVersion, templateState } from '@/lib/templates';
import type { Template } from '@/types/domain';

/**
 * State of a template (F8, D-108) as a status pill with icon and text: draft (never published),
 * published with its version, or published with a draft in progress.
 */
export function TemplateStatePill({ template, className }: { template: Template; className?: string }) {
  const { t } = useTranslation();
  const state = templateState(template);
  const version = latestVersion(template)?.version ?? 0;
  const tone = state === 'published' ? 'success' : state === 'draft' ? 'neutral' : 'info';
  const icon = state === 'published' ? 'check_circle' : 'edit_note';
  return (
    <StatusPill
      tone={tone}
      icon={icon}
      label={t(`templateVersions.state.${state}`, { version })}
      className={className}
    />
  );
}
