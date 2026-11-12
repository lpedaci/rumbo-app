import { afterEach, describe, expect, it } from 'vitest';
import type { AppNotification } from '@/types/domain';
import {
  DATA_TIMEZONE,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  setDisplayPreferences,
  setNumberLanguage,
} from './dates';
import { channelsOf, choiceOf, defaultPreferences, preferencesOf, sentByEmail, shownInApp } from './preferences';

const note = (type: string) => ({ id: 'n', recipientId: 'p-carla', createdAt: '2026-11-10T09:00:00', type }) as AppNotification;

afterEach(() => {
  setDisplayPreferences({ dateFormat: 'dmy', timezone: DATA_TIMEZONE });
  setNumberLanguage('es');
});

describe('F17 · Preferences', () => {
  it('uses the defaults until the person saves their own', () => {
    const mine = { ...defaultPreferences('p-martin'), language: 'en' as const };
    expect(preferencesOf([mine], 'p-martin').language).toBe('en');
    expect(preferencesOf([mine], 'p-carla')).toEqual(defaultPreferences('p-carla'));
    expect(defaultPreferences('p-carla')).toMatchObject({ language: 'es', dateFormat: 'dmy', timezone: DATA_TIMEZONE });
  });

  it('turns the three channel choices into channels and back', () => {
    expect(channelsOf('both')).toEqual(['app', 'email']);
    expect(channelsOf('email')).toEqual(['email']);
    expect(choiceOf(['app', 'email'])).toBe('both');
    expect(choiceOf(['email'])).toBe('email');
    expect(choiceOf(['app'])).toBe('app');
  });

  it('respects the channels by kind of notification (F7)', () => {
    const prefs = { ...defaultPreferences('p-carla'), notifications: { ...defaultPreferences('p-carla').notifications, tasks: ['email' as const] } };
    // Tasks only by email: out of the app, still by email.
    expect(shownInApp(note('task.overdue'), prefs)).toBe(false);
    expect(sentByEmail(note('task.overdue'), prefs)).toBe(true);
    // A kind that never goes by email stays out of the email preview.
    expect(sentByEmail(note('task.unblocked'), prefs)).toBe(false);
    // The other categories are untouched.
    expect(shownInApp(note('checkin.completed'), prefs)).toBe(true);
  });

  it('shows dates in the chosen format and times in the chosen zone', () => {
    expect(formatDate('2026-11-10')).toBe('10/11/2026');
    expect(formatDateTime('2026-11-10T09:00:00')).toBe('10/11/2026 09:00');
    setDisplayPreferences({ dateFormat: 'iso', timezone: 'America/Mexico_City' });
    expect(formatDate('2026-11-10')).toBe('2026-11-10');
    // Buenos Aires is UTC-3 and Mexico City UTC-6: three hours earlier.
    expect(formatDateTime('2026-11-10T09:00:00')).toBe('2026-11-10 06:00');
    setDisplayPreferences({ dateFormat: 'dmy', timezone: 'Europe/Madrid' });
    // Madrid is UTC+1 in November: four hours later, even crossing midnight.
    expect(formatDateTime('2026-11-10T21:30:00')).toBe('11/11/2026 01:30');
  });

  it('writes numbers in the style of the interface language', () => {
    expect(formatNumber(1248)).toBe('1.248');
    expect(formatNumber(3.8, 1)).toBe('3,8');
    expect(formatPercent(84)).toBe(`84${String.fromCharCode(0xa0)}%`);
    setNumberLanguage('en');
    expect(formatNumber(1248)).toBe('1,248');
    expect(formatNumber(3.8, 1)).toBe('3.8');
    expect(formatPercent(84)).toBe('84%');
  });
});
