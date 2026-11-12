import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { TextField } from '@/components/ui/TextField';
import { MIN_QUERY, search, SEARCH_GROUPS } from '@/lib/search';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import { useUiStore } from '@/store/ui-store';
import { moveFocus, SearchResultRow } from './SearchResults';

/** Results per group in the quick search; the rest are on the search page (G12). */
const PER_GROUP = 4;

/** True when a key press happens while typing, so "/" does not steal a slash from a field. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)));
}

/** Opens the quick search: a field-like button (from 1024 px) or an icon button. */
export function SearchButton({ variant, className }: { variant: 'field' | 'icon'; className?: string }) {
  const { t } = useTranslation();
  const open = () => useUiStore.getState().setSearchOpen(true);
  return variant === 'field' ? (
    <button
      type="button"
      onClick={open}
      aria-keyshortcuts="Control+K /"
      className={cn(
        'inline-flex h-10 w-60 shrink-0 items-center gap-2 rounded-md border border-outline bg-surface-container-lowest px-3 text-body-medium text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:w-72',
        className,
      )}
    >
      <Icon name="search" />
      <span className="flex-1 truncate text-left">{t('search.open')}</span>
      <kbd className="rounded-sm border border-outline-variant px-1.5 text-label-small text-on-surface-variant">
        {t('search.shortcut')}
      </kbd>
    </button>
  ) : (
    <IconButton icon="search" label={t('search.open')} aria-keyshortcuts="Control+K /" className={className} onClick={open} />
  );
}

/**
 * Global search (F16), mounted once in the top bar: Ctrl+K (or Cmd+K) and "/" open it from any
 * screen. Results come grouped by type and filtered by the role's permissions; Enter opens the
 * full results (G12).
 */
export function GlobalSearch() {
  const open = useUiStore((s) => s.searchOpen);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const combo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (combo || (event.key === '/' && !isTyping(event.target))) {
        event.preventDefault();
        useUiStore.getState().setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const close = () => useUiStore.getState().setSearchOpen(false);
  return (
    <Dialog open={open} onOpenChange={(v) => useUiStore.getState().setSearchOpen(v)}>
      {open && <QuickSearch onClose={close} />}
    </Dialog>
  );
}

function QuickSearch({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const data = useDataStore();
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => search(data, user, query), [data, user, query]);
  const ready = query.trim().length >= MIN_QUERY;
  const toPage = `/search?q=${encodeURIComponent(query.trim())}`;

  // The field, not the close button, gets the focus on open, so the person can type right away.
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById('global-search')?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <DialogContent title={t('search.dialogTitle')} className="max-w-2xl">
      <div ref={listRef} className="flex flex-col gap-4" onKeyDown={(event) => moveFocus(event, listRef.current)}>
        <TextField
          id="global-search"
          label={t('search.label')}
          helperText={t('search.help')}
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && ready) {
              event.preventDefault();
              onClose();
              navigate(toPage);
            }
          }}
        />
        <div aria-live="polite" className="flex flex-col gap-4">
          {!ready ? (
            <p className="text-body-medium text-on-surface-variant">{t('search.hint')}</p>
          ) : results.length === 0 ? (
            <p className="text-body-medium text-on-surface-variant">{t('search.empty', { q: query.trim() })}</p>
          ) : (
            SEARCH_GROUPS.map((group) => {
              const rows = results.filter((r) => r.group === group);
              if (!rows.length) return null;
              return (
                <section key={group} aria-labelledby={`search-${group}`} className="flex flex-col gap-1">
                  <h3 id={`search-${group}`} className="text-title-small text-on-surface-variant">
                    {t(`search.groups.${group}`)} ({rows.length})
                  </h3>
                  <ul className="-mx-2 flex flex-col">
                    {rows.slice(0, PER_GROUP).map((r) => (
                      <SearchResultRow key={`${r.group}-${r.id}`} result={r} onOpen={onClose} />
                    ))}
                  </ul>
                </section>
              );
            })
          )}
          {ready && results.length > 0 && (
            <Link
              to={toPage}
              data-result
              onClick={onClose}
              className="inline-flex min-h-12 items-center gap-1 self-start rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
            >
              {t('search.seeAll', { count: results.length })}
              <Icon name="arrow_forward" />
            </Link>
          )}
        </div>
        <p className="text-body-small text-on-surface-variant">{t('search.shortcutHelp')}</p>
      </div>
    </DialogContent>
  );
}
