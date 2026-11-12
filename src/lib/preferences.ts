import type { AppNotification, NotificationCategory, UserPreferences } from '@/types/domain';
import { NOTIFICATION_TYPES } from './notifications';

/**
 * User preferences (F17): language, time zone and date format, notification channels by kind of
 * event, and accessibility. Each person has their own; without saved ones, the defaults apply.
 */

export const TIMEZONES = [
  'America/Argentina/Buenos_Aires',
  'America/Montevideo',
  'America/Santiago',
  'America/Bogota',
  'America/Mexico_City',
  'Europe/Madrid',
] as const;
export const DEFAULT_TIMEZONE = TIMEZONES[0];

export const DATE_FORMATS = ['dmy', 'iso'] as const;
export const NOTIFICATION_CATEGORIES: NotificationCategory[] = ['tasks', 'checkins', 'people', 'access'];
export type ChannelChoice = 'app' | 'email' | 'both';
export const CHANNEL_CHOICES: ChannelChoice[] = ['app', 'email', 'both'];

export function defaultPreferences(personId: string): UserPreferences {
  return {
    personId,
    language: 'es',
    timezone: DEFAULT_TIMEZONE,
    dateFormat: 'dmy',
    notifications: { tasks: ['app', 'email'], checkins: ['app', 'email'], people: ['app', 'email'], access: ['app', 'email'] },
    reduceMotion: false,
    highContrast: false,
  };
}

export function preferencesOf(all: UserPreferences[], personId: string): UserPreferences {
  return all.find((p) => p.personId === personId) ?? defaultPreferences(personId);
}

export function choiceOf(channels: ('app' | 'email')[]): ChannelChoice {
  return channels.includes('app') && channels.includes('email') ? 'both' : channels.includes('email') ? 'email' : 'app';
}

export function channelsOf(choice: ChannelChoice): ('app' | 'email')[] {
  return choice === 'both' ? ['app', 'email'] : [choice];
}

/** In the app only what the person did not move to email only (F7 respects the preferences). */
export function shownInApp(notification: AppNotification, prefs: UserPreferences): boolean {
  const category = NOTIFICATION_TYPES[notification.type]?.category;
  return !category || prefs.notifications[category].includes('app');
}

/** Whether a notification also arrives by (simulated) email for this person. */
export function sentByEmail(notification: AppNotification, prefs: UserPreferences): boolean {
  const meta = NOTIFICATION_TYPES[notification.type];
  return Boolean(meta?.email) && prefs.notifications[meta!.category].includes('email');
}
