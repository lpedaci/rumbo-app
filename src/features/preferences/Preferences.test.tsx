import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/app/i18n';
import { switchRole } from '@/features/auth/auth-service';
import { defaultPreferences } from '@/lib/preferences';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
});

afterEach(async () => {
  await i18n.changeLanguage('es');
});

describe('G11 · Preferences (F17)', () => {
  it('saves the preferences for the person and applies them', async () => {
    act(() => {
      switchRole('admin');
    });
    const view = renderAt('/account/preferences');
    expect(await screen.findByRole('heading', { level: 1, name: es.preferences.title })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: es.preferences.language.en }));
    fireEvent.change(screen.getByLabelText(es.preferences.dates.format), { target: { value: 'iso' } });
    fireEvent.click(screen.getByLabelText(es.preferences.accessibility.highContrast));
    fireEvent.click(screen.getByRole('button', { name: es.preferences.save }));

    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
    expect(useDataStore.getState().preferences).toEqual([
      expect.objectContaining({ personId: 'p-carla', language: 'en', dateFormat: 'iso', highContrast: true }),
    ]);
    expect(document.documentElement.dataset.contrast).toBe('high');
    view.unmount();
    // Leaving the app (signing out) clears the display preferences from the page.
    expect(document.documentElement.dataset.contrast).toBeUndefined();
  });

  it("switching role applies the other person's preferences", async () => {
    useDataStore.getState().savePreferences({ ...defaultPreferences('p-carla'), language: 'en' });
    act(() => {
      switchRole('admin');
    });
    const first = renderAt('/account/preferences');
    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
    first.unmount();

    act(() => {
      switchRole('manager');
    });
    renderAt('/account/preferences');
    await waitFor(() => expect(document.documentElement.lang).toBe('es'));
    expect(await screen.findByRole('heading', { level: 1, name: es.preferences.title })).toBeInTheDocument();
  });
});
