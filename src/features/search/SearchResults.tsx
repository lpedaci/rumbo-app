import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import type { IconName } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import type { SearchGroup, SearchResult } from '@/lib/search';

export const GROUP_ICON: Record<SearchGroup, IconName> = {
  people: 'group',
  templates: 'description',
  tasks: 'task_alt',
  requests: 'support_agent',
};

/** Arrow keys move between the results of a list (the links stay in the tab order too). */
export function moveFocus(event: KeyboardEvent<HTMLElement>, container: HTMLElement | null) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  const links = [...(container?.querySelectorAll<HTMLAnchorElement>('a[data-result]') ?? [])];
  if (!links.length) return;
  event.preventDefault();
  const index = links.indexOf(document.activeElement as HTMLAnchorElement);
  const next = event.key === 'ArrowDown' ? Math.min(links.length - 1, index + 1) : index - 1;
  if (next < 0) (container?.querySelector<HTMLInputElement>('input') ?? links[0])?.focus();
  else links[next]?.focus();
}

/**
 * One result in the list rhythm (D-106): the person (avatar in the role color) or the kind of
 * object on the left, then the name and what it is. The whole row is the link.
 */
export function SearchResultRow({ result: r, onOpen }: { result: SearchResult; onOpen?: () => void }) {
  const { t } = useTranslation();
  const detail = r.kind ? `${t(`search.kinds.${r.kind}`)} · ${r.detail}` : r.detail;
  return (
    <li className="border-b border-outline-variant last:border-b-0">
      <Link
        to={r.link}
        data-result
        onClick={onOpen}
        className="flex min-h-14 min-w-0 items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        {r.group === 'people' ? (
          <Avatar name={r.title} role={r.role} size="md" />
        ) : (
          <IconTile icon={GROUP_ICON[r.group]} tone="neutral" />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-title-small text-on-surface">{r.title}</span>
          <span className="truncate text-body-small text-on-surface-variant">{detail}</span>
        </span>
      </Link>
    </li>
  );
}
