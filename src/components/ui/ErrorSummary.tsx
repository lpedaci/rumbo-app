import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineAlert } from './InlineAlert';

export interface ErrorSummaryItem {
  /** Stable key, usually the field name. */
  key: string;
  /** Visible name of the field, as in its label. */
  label: string;
  /** What to fix, the same message shown under the field. */
  message: string;
  /** Moves the focus to the field. */
  focus: () => void;
}

interface ErrorSummaryProps {
  items: ErrorSummaryItem[];
  /** Grows on every submit attempt: the summary takes the focus again each time. */
  attempt: number;
}

/**
 * Error summary of long forms (CLAUDE.md 2.10, RNF-043): above the form, one link per field
 * with a problem that moves the focus to it, and the focus goes to the summary on every
 * submit attempt. The errors stay in place under each field too. Buttons and not `#id` links,
 * because the app routes with the hash.
 */
export function ErrorSummary({ items, attempt }: ErrorSummaryProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const shown = items.length > 0;

  useEffect(() => {
    if (attempt > 0 && shown) requestAnimationFrame(() => ref.current?.focus());
    // Only on a new attempt, not while the person fixes the fields
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (!shown) return null;
  return (
    <InlineAlert ref={ref} tone="error" title={t('ui.errorSummary', { count: items.length })}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={item.focus}
              className="min-h-12 rounded-xs text-left text-body-medium underline underline-offset-2 md:min-h-6"
            >
              {item.label}: {item.message}
            </button>
          </li>
        ))}
      </ul>
    </InlineAlert>
  );
}

/** Focuses a field by id: the element itself, or the first control inside a group. */
export function focusField(id: string): void {
  const el = document.getElementById(id);
  const controls = 'input, select, textarea, button';
  const target = el?.matches(controls) ? el : el?.querySelector<HTMLElement>(controls);
  target?.focus();
  target?.scrollIntoView?.({ block: 'center' });
}
