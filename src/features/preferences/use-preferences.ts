import { useEffect, useMemo } from 'react';
import i18n from '@/app/i18n';
import { DATA_TIMEZONE, setDisplayPreferences } from '@/lib/dates';
import { preferencesOf } from '@/lib/preferences';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { UserPreferences } from '@/types/domain';

/** The signed-in person's preferences (F17), or the defaults when they never saved any. */
export function useMyPreferences(): UserPreferences | undefined {
  const user = useCurrentUser();
  const all = useDataStore((s) => s.preferences);
  return useMemo(() => (user ? preferencesOf(all, user.personId) : undefined), [all, user]);
}

/**
 * Applies the preferences of whoever is signed in (F17, D-129): interface language, how dates
 * and times are shown, reduced motion and high contrast (as attributes on <html>, read by the
 * motion helpers and the tokens). Switching role applies the other person's preferences.
 */
export function useApplyPreferences(prefs: UserPreferences | undefined): void {
  // Set during render, before the children format any date.
  if (prefs) setDisplayPreferences({ dateFormat: prefs.dateFormat, timezone: prefs.timezone });

  useEffect(() => {
    if (!prefs) return;
    if (i18n.language !== prefs.language) void i18n.changeLanguage(prefs.language);
    const root = document.documentElement;
    root.dataset.reduceMotion = String(prefs.reduceMotion);
    if (prefs.highContrast) root.dataset.contrast = 'high';
    else delete root.dataset.contrast;
  }, [prefs]);

  // Signing out leaves the login and the home page with the defaults (the language stays as chosen).
  useEffect(
    () => () => {
      setDisplayPreferences({ dateFormat: 'dmy', timezone: DATA_TIMEZONE });
      delete document.documentElement.dataset.contrast;
      delete document.documentElement.dataset.reduceMotion;
    },
    [],
  );
}
