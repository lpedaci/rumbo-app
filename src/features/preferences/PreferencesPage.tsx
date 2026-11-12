import { type FormEvent, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormFooter } from '@/components/ui/FormFooter';
import { SegmentedButton } from '@/components/ui/SegmentedButton';
import { Select } from '@/components/ui/Select';
import { toast } from '@/components/ui/toast-store';
import { DATA_TIMEZONE, DEMO_TODAY, offsetMinutes } from '@/lib/dates';
import {
  CHANNEL_CHOICES,
  type ChannelChoice,
  channelsOf,
  choiceOf,
  DATE_FORMATS,
  NOTIFICATION_CATEGORIES,
  TIMEZONES,
} from '@/lib/preferences';
import { preferencesSchema } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import type { UserPreferences } from '@/types/domain';
import { useMyPreferences } from './use-preferences';

/** 10:00 in Buenos Aires shown in another time zone, for the help text. */
function tenInZone(timezone: string): string {
  const day = new Date(`${DEMO_TODAY}T10:00:00`);
  const minutes = 10 * 60 + offsetMinutes(timezone, day) - offsetMinutes(DATA_TIMEZONE, day);
  const h = Math.floor((((minutes % 1440) + 1440) % 1440) / 60);
  const m = ((minutes % 60) + 60) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** A labelled group with its supporting text, like every field (2.10). */
function Field({ id, label, help, children }: { id: string; label: string; help: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-help`}
      className="flex min-w-0 flex-col gap-2"
    >
      <span id={`${id}-label`} className="text-label-medium text-on-surface">
        {label}
      </span>
      {children}
      <span id={`${id}-help`} className="text-body-small text-on-surface-variant">
        {help}
      </span>
    </div>
  );
}

/**
 * G11 · Preferences (F17): language, time zone and date format, where each kind of notification
 * arrives, and accessibility. They belong to the person and apply on saving (D-129).
 */
export function PreferencesPage() {
  const { t } = useTranslation();
  const saved = useMyPreferences();
  const [draft, setDraft] = useState<UserPreferences | undefined>(saved);
  if (!saved || !draft) return null;
  const change = (patch: Partial<UserPreferences>) => setDraft({ ...draft, ...patch });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // RNF-023: only the offered values are saved
    if (!preferencesSchema.safeParse(draft).success) return;
    useDataStore.getState().savePreferences(draft);
    toast.success(t('preferences.saved', { lng: draft.language }));
  };

  const today = DEMO_TODAY.split('-');
  const formatExample = draft.dateFormat === 'iso' ? DEMO_TODAY : `${today[2]}/${today[1]}/${today[0]}`;

  return (
    <>
      <PageHeader title={t('preferences.title')} description={t('preferences.description')} />
      <Card>
        <form noValidate onSubmit={submit} className="@container flex flex-col gap-8">
          <section aria-labelledby="pref-language" className="flex flex-col gap-4">
            <h2 id="pref-language" className="text-title-medium text-on-surface">
              {t('preferences.language.title')}
            </h2>
            <Field id="pref-lang" label={t('preferences.language.label')} help={t('preferences.language.help')}>
              <SegmentedButton
                label={t('preferences.language.label')}
                value={draft.language}
                onValueChange={(language) => change({ language })}
                options={(['es', 'en'] as const).map((lng) => ({
                  value: lng,
                  label: t(`preferences.language.${lng}`),
                }))}
              />
            </Field>
          </section>

          <section aria-labelledby="pref-dates" className="flex flex-col gap-4 border-t border-outline-variant pt-6">
            <h2 id="pref-dates" className="text-title-medium text-on-surface">
              {t('preferences.dates.title')}
            </h2>
            <div className="flex flex-col gap-5">
              <Select
                id="pref-timezone"
                label={t('preferences.dates.timezone')}
                helperText={t('preferences.dates.timezoneHelp', { example: tenInZone(draft.timezone) })}
                value={draft.timezone}
                onChange={(event) => change({ timezone: event.target.value })}
                options={TIMEZONES.map((tz) => ({ value: tz, label: t(`preferences.dates.zones.${tz}`) }))}
              />
              <Select
                id="pref-format"
                label={t('preferences.dates.format')}
                helperText={t('preferences.dates.formatHelp', { example: formatExample })}
                value={draft.dateFormat}
                onChange={(event) => change({ dateFormat: event.target.value as UserPreferences['dateFormat'] })}
                options={DATE_FORMATS.map((f) => ({ value: f, label: t(`preferences.dates.formats.${f}`) }))}
              />
            </div>
          </section>

          <section
            aria-labelledby="pref-notifications"
            className="flex flex-col gap-4 border-t border-outline-variant pt-6"
          >
            <div className="flex flex-col gap-1">
              <h2 id="pref-notifications" className="text-title-medium text-on-surface">
                {t('preferences.notifications.title')}
              </h2>
              <p className="text-body-medium text-on-surface-variant">{t('preferences.notifications.description')}</p>
            </div>
            <ul className="flex flex-col">
              {NOTIFICATION_CATEGORIES.map((category) => (
                <li key={category} className="border-b border-outline-variant py-3 last:border-b-0">
                  <Field
                    id={`pref-${category}`}
                    label={t(`notifications.categories.${category}`)}
                    help={t(`preferences.notifications.help.${category}`)}
                  >
                    <SegmentedButton<ChannelChoice>
                      label={t(`notifications.categories.${category}`)}
                      value={choiceOf(draft.notifications[category])}
                      onValueChange={(choice) =>
                        change({ notifications: { ...draft.notifications, [category]: channelsOf(choice) } })
                      }
                      options={CHANNEL_CHOICES.map((c) => ({
                        value: c,
                        label: t(`preferences.notifications.choices.${c}`),
                      }))}
                    />
                  </Field>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="pref-a11y" className="flex flex-col gap-3 border-t border-outline-variant pt-6">
            <h2 id="pref-a11y" className="text-title-medium text-on-surface">
              {t('preferences.accessibility.title')}
            </h2>
            <Checkbox
              id="pref-motion"
              label={t('preferences.accessibility.reduceMotion')}
              description={t('preferences.accessibility.reduceMotionHelp')}
              checked={draft.reduceMotion}
              onChange={(event) => change({ reduceMotion: event.target.checked })}
            />
            <Checkbox
              id="pref-contrast"
              label={t('preferences.accessibility.highContrast')}
              description={t('preferences.accessibility.highContrastHelp')}
              checked={draft.highContrast}
              onChange={(event) => change({ highContrast: event.target.checked })}
            />
          </section>

          <FormFooter note={t('preferences.note')}>
            <Button type="submit" leadingIcon="save">
              {t('preferences.save')}
            </Button>
          </FormFooter>
        </form>
      </Card>
    </>
  );
}
